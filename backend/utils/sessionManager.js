const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionDir = path.join(__dirname, '../../sessions');
    this.ensureSessionDir();
  }

  async ensureSessionDir() {
    try {
      await fs.access(this.sessionDir);
    } catch {
      await fs.mkdir(this.sessionDir, { recursive: true });
    }
  }

  createSession(scenarioId, agentData) {
    const sessionId = uuidv4();
    const session = {
      sessionId,
      scenarioId,
      agents: agentData,
      history: [],
      turn: 'Agent 1', // Start with Agent 1
      isPaused: false,
      userHint: null,
      reviewData: {
        startTime: new Date().toISOString(),
        turnCount: 0,
        userInterventions: 0,
        principlesUsed: [],
        conversationFlow: []
      },
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    // Add method to get current agent's tools
    session.getCurrentAgentTools = function() {
      const currentAgentData = this.agents[this.turn];
      return currentAgentData ? currentAgentData.tools || [] : [];
    };

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && !session.getCurrentAgentTools) {
      session.getCurrentAgentTools = function() {
        const currentAgentData = this.agents[this.turn];
        return currentAgentData ? currentAgentData.tools || [] : [];
      };
    }
    return session;
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updatedSession = { ...session, ...updates, lastActivity: new Date().toISOString() };
    this.sessions.set(sessionId, updatedSession);
    this.saveSessionToDisk(sessionId, updatedSession);
    return updatedSession;
  }

  addMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.history.push(message);
    session.lastActivity = new Date().toISOString();

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  incrementTurnCount(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.reviewData.turnCount += 1;
    session.lastActivity = new Date().toISOString();

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  addToolUsage(sessionId, toolName, reason) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.reviewData.principlesUsed.push({
      toolName,
      reason,
      timestamp: new Date().toISOString(),
      turn: session.reviewData.turnCount
    });

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  addUserIntervention(sessionId, hint) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.userHint = hint;
    session.reviewData.userInterventions += 1;
    session.reviewData.conversationFlow.push({
      type: 'user_intervention',
      hint,
      timestamp: new Date().toISOString(),
      turn: session.reviewData.turnCount
    });

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  switchTurn(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.turn = session.turn === 'Agent 1' ? 'Agent 2' : 'Agent 1';
    session.userHint = null; // Clear any user hint after turn switch

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.reviewData.endTime = new Date().toISOString();
    session.reviewData.duration = new Date(session.reviewData.endTime) - new Date(session.reviewData.startTime);
    session.status = 'completed';

    this.sessions.set(sessionId, session);
    this.saveSessionToDisk(sessionId, session);
    return session;
  }

  async saveSessionToDisk(sessionId, session) {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Failed to save session to disk:', error);
    }
  }

  async loadSessionFromDisk(sessionId) {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const session = JSON.parse(data);

      // Add method to get current agent's tools for backward compatibility
      if (!session.getCurrentAgentTools) {
        session.getCurrentAgentTools = function() {
          const currentAgentData = this.agents[this.turn];
          return currentAgentData ? currentAgentData.tools || [] : [];
        };
      }

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      console.error('Failed to load session from disk:', error);
      return null;
    }
  }

  getActiveSessionCount() {
    return this.sessions.size;
  }

  cleanup() {
    console.log(`Cleaning up ${this.sessions.size} active sessions...`);
    this.sessions.clear();
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

module.exports = SessionManager;