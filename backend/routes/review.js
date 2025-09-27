const express = require('express');
const router = express.Router();

// GET /api/review/:sessionId - Get conversation review data
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = req.sessionManager.getSession(sessionId);

    if (!session) {
      // Try to load from disk
      const loadedSession = await req.sessionManager.loadSessionFromDisk(sessionId);
      if (!loadedSession) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          sessionId
        });
      }
    }

    const sessionData = req.sessionManager.getSession(sessionId);
    const review = generateReviewReport(sessionData);

    res.json({
      success: true,
      sessionId,
      review
    });

  } catch (error) {
    console.error(`Failed to generate review for session ${req.params.sessionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate review',
      message: error.message
    });
  }
});

function generateReviewReport(session) {
  const { reviewData, history, agents, scenarioId } = session;

  // Calculate duration
  const startTime = new Date(reviewData.startTime);
  const endTime = reviewData.endTime ? new Date(reviewData.endTime) : new Date();
  const duration = Math.round((endTime - startTime) / 1000); // in seconds

  // Analyze conversation flow
  const messagesByAgent = {
    'Agent 1': history.filter(msg => msg.role === 'assistant' && msg.agent === 'Agent 1').length,
    'Agent 2': history.filter(msg => msg.role === 'assistant' && msg.agent === 'Agent 2').length
  };

  // Filter out invalid tool usage entries and clean up data
  const validPrinciples = reviewData.principlesUsed.filter(p =>
    p && p.toolName && p.toolName !== 'undefined' && typeof p.toolName === 'string'
  ).map(p => ({
    ...p,
    reason: p.reason || '未提供使用原因',
    application: p.application || '未提供具体应用方式'
  }));

  // Count unique principles used
  const uniquePrinciples = [...new Set(validPrinciples.map(p => p.toolName))];

  // Map English tool names to Chinese names
  const toolNameMap = {
    'FORD_method': 'F.O.R.D.技巧',
    'open_ended_question': '开放式提问',
    'active_listening_reflection': '积极倾听',
    'find_common_ground': '寻找共同点',
    'mirroring_technique': '镜像技巧',
    'emotional_labeling': '情感标记',
    'compliment_genuine': '真诚赞美'
  };

  // Generate insights in Chinese
  const insights = [];

  if (reviewData.userInterventions > 0) {
    insights.push(`您主动指导了对话 ${reviewData.userInterventions} 次，展现出积极的学习参与态度。`);
  }

  if (uniquePrinciples.length > 2) {
    insights.push(`AI智能体展现了多样性，使用了 ${uniquePrinciples.length} 种不同的沟通技巧。`);
  }

  if (validPrinciples.length > 0) {
    const mostUsedPrinciple = validPrinciples.reduce((acc, curr) => {
      acc[curr.toolName] = (acc[curr.toolName] || 0) + 1;
      return acc;
    }, {});
    const topPrinciple = Object.keys(mostUsedPrinciple).reduce((a, b) =>
      mostUsedPrinciple[a] > mostUsedPrinciple[b] ? a : b
    );
    const chineseTopPrinciple = toolNameMap[topPrinciple] || topPrinciple;
    insights.push(`最常使用的沟通技巧是"${chineseTopPrinciple}"，显示对这种沟通策略的重点关注。`);
  }

  if (validPrinciples.length === 0) {
    insights.push('本次对话中未检测到明确的沟通技巧应用，这可能是一个改进的机会。');
  }

  return {
    summary: {
      scenarioName: formatScenarioName(scenarioId),
      duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      totalTurns: reviewData.turnCount,
      userInterventions: reviewData.userInterventions,
      principlesApplied: reviewData.principlesUsed.length,
      uniquePrinciplesUsed: uniquePrinciples.length
    },
    conversationFlow: {
      messageDistribution: messagesByAgent,
      conversationBalance: calculateBalance(messagesByAgent),
      timeline: reviewData.conversationFlow || []
    },
    principlesUsed: validPrinciples.map(p => ({
      ...p,
      toolName: p.toolName, // Keep original for frontend compatibility
      chineseToolName: toolNameMap[p.toolName] || p.toolName, // Add Chinese name
      turnNumber: p.turn,
      timestamp: new Date(p.timestamp).toLocaleTimeString()
    })),
    insights,
    fullConversation: history.filter(msg => msg.role === 'assistant').map(msg => ({
      agent: msg.agent || 'System',
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
      toolsUsed: msg.tool_calls ? msg.tool_calls.map(tc => tc.function.name) : []
    })),
    recommendations: generateRecommendations(reviewData, uniquePrinciples, reviewData.userInterventions)
  };
}

function calculateBalance(messagesByAgent) {
  const total = Object.values(messagesByAgent).reduce((sum, count) => sum + count, 0);
  if (total === 0) return { balanced: true, ratio: '1:1' };

  const agent1Pct = Math.round((messagesByAgent['Agent 1'] / total) * 100);
  const agent2Pct = Math.round((messagesByAgent['Agent 2'] / total) * 100);

  return {
    balanced: Math.abs(agent1Pct - agent2Pct) <= 20, // Within 20% is considered balanced
    ratio: `${agent1Pct}:${agent2Pct}`,
    agent1Percentage: agent1Pct,
    agent2Percentage: agent2Pct
  };
}

function generateRecommendations(reviewData, uniquePrinciples, userInterventions) {
  const recommendations = [];

  if (uniquePrinciples.length < 3) {
    recommendations.push("建议在未来的对话中尝试更多不同的沟通技巧，扩展您的沟通工具库。");
  }

  if (userInterventions === 0) {
    recommendations.push("考虑在对话过程中为智能体提供指导，这有助于练习您的指导技能。");
  }

  if (reviewData.turnCount < 10) {
    recommendations.push("更长的对话能够提供更多练习不同沟通策略的机会。");
  }

  if (uniquePrinciples.includes('open_ended_question')) {
    recommendations.push("开放式提问使用得很好！这个技巧有助于保持对话自然流畅地进行。");
  }

  if (uniquePrinciples.includes('find_common_ground')) {
    recommendations.push("寻找共同点的技巧运用出色，这是建立良好人际关系的重要基础。");
  }

  if (uniquePrinciples.includes('active_listening_reflection')) {
    recommendations.push("积极倾听技巧的应用很棒，这能让对话伙伴感受到被理解和重视。");
  }

  if (uniquePrinciples.length === 0) {
    recommendations.push("建议在下次对话中尝试使用一些沟通技巧，比如开放式提问或寻找共同点。");
  }

  return recommendations;
}

function formatScenarioName(scenarioId) {
  return scenarioId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = router;