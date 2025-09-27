const fs = require('fs').promises;
const path = require('path');

class ApiLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  async logApiCall({ sessionId, agent, type, requestPayload, responsePayload, metadata = {} }) {
    try {
      const timestamp = new Date().toISOString();
      const formattedTimestamp = timestamp.replace(/[:.]/g, '_').replace('Z', 'Z');
      const filename = `${formattedTimestamp}_${sessionId.substring(0, 8)}_${agent}_${type}.json`;

      const logData = {
        sessionId,
        agent,
        type, // 'request' | 'response' | 'tool_call'
        timestamp,
        metadata,
        requestPayload,
        responsePayload,
        apiInfo: {
          model: metadata.model || 'unknown',
          totalTokens: metadata.totalTokens || null,
          promptTokens: metadata.promptTokens || null,
          completionTokens: metadata.completionTokens || null
        }
      };

      const logPath = path.join(this.logDir, filename);
      await fs.writeFile(logPath, JSON.stringify(logData, null, 2));

      console.log(`📝 API call logged: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  async logRequest(sessionId, agent, messages, metadata = {}) {
    return this.logApiCall({
      sessionId,
      agent,
      type: 'request',
      requestPayload: {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content ? msg.content.substring(0, 1000) + (msg.content.length > 1000 ? '...' : '') : '',
          tool_calls: msg.tool_calls ? msg.tool_calls.length : 0
        })),
        messagesCount: messages.length,
        totalTokensEstimate: this.estimateTokens(messages)
      },
      metadata
    });
  }

  async logResponse(sessionId, agent, response, metadata = {}) {
    return this.logApiCall({
      sessionId,
      agent,
      type: 'response',
      responsePayload: {
        content: response.content || '',
        finishReason: response.finishReason,
        toolCalls: response.toolCalls || []
      },
      metadata
    });
  }

  async logToolCall(sessionId, agent, toolCalls, metadata = {}) {
    return this.logApiCall({
      sessionId,
      agent,
      type: 'tool_call',
      responsePayload: {
        toolCalls: toolCalls.map(call => ({
          id: call.id,
          function: {
            name: call.function.name,
            arguments: call.function.arguments
          }
        }))
      },
      metadata
    });
  }

  estimateTokens(messages) {
    // Rough estimate: ~4 characters per token
    const totalText = messages.reduce((acc, msg) => acc + (msg.content || ''), '');
    return Math.ceil(totalText.length / 4);
  }

  async getLogStats() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.endsWith('.json'));

      return {
        totalLogs: logFiles.length,
        oldestLog: logFiles.length > 0 ? logFiles[0] : null,
        newestLog: logFiles.length > 0 ? logFiles[logFiles.length - 1] : null
      };
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return { totalLogs: 0, oldestLog: null, newestLog: null };
    }
  }
}

const apiLogger = new ApiLogger();

module.exports = {
  logApiCall: apiLogger.logApiCall.bind(apiLogger),
  logRequest: apiLogger.logRequest.bind(apiLogger),
  logResponse: apiLogger.logResponse.bind(apiLogger),
  logToolCall: apiLogger.logToolCall.bind(apiLogger),
  getLogStats: apiLogger.getLogStats.bind(apiLogger)
};