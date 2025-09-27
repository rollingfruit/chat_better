const express = require('express');
const OpenRouterClient = require('../utils/openrouterClient');
const ScenarioLoader = require('../utils/scenarioLoader');
const { CONVERSATION_TOOLS, executeConversationTool, getToolsForAgent } = require('../utils/toolLibrary');
const { logRequest, logResponse, logToolCall } = require('../utils/apiLogger');

const router = express.Router();
const openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY);
const scenarioLoader = new ScenarioLoader();

// POST /api/chat-stream/pause - Pause/unpause session
router.post('/pause', async (req, res) => {
  const { sessionId, isPaused } = req.body;

  try {
    const session = req.sessionManager.updateSession(sessionId, { isPaused });
    if (!session) {
      return res.json({ success: false, error: 'Session not found' });
    }

    console.log(`${isPaused ? '⏸️' : '▶️'} Session ${sessionId} ${isPaused ? 'paused' : 'resumed'}`);
    res.json({ success: true, isPaused: session.isPaused });
  } catch (error) {
    console.error('Pause/resume error:', error);
    res.json({ success: false, error: error.message });
  }
});

// POST /api/chat-stream/end - End session
router.post('/end', async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = req.sessionManager.endSession(sessionId);
    if (!session) {
      return res.json({ success: false, error: 'Session not found' });
    }

    console.log(`🛑 Session ${sessionId} ended by user`);
    res.json({ success: true, status: session.status });
  } catch (error) {
    console.error('End session error:', error);
    res.json({ success: false, error: error.message });
  }
});

// POST /api/chat-stream - Start or continue conversation with SSE streaming
router.post('/', async (req, res) => {
  const { scenarioId, customScenario, sessionId, userHint, action = 'continue' } = req.body;

  try {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    let session;

    if (action === 'start' && (scenarioId || customScenario)) {
      let scenarioData;
      let sessionIdentifier;

      if (scenarioId) {
        // Load scenario from file
        scenarioData = await scenarioLoader.loadScenario(scenarioId);
        sessionIdentifier = scenarioId;
      } else if (customScenario) {
        // Use custom scenario data
        scenarioData = {
          id: 'custom',
          name: '自定义场景',
          description: '用户创建的自定义对话场景',
          agents: customScenario.agents
        };
        sessionIdentifier = 'custom';
      }

      session = req.sessionManager.createSession(sessionIdentifier, scenarioData.agents);

      // Send session started event
      res.write(`data: ${JSON.stringify({
        type: 'session_start',
        sessionId: session.sessionId,
        scenario: scenarioData,
        currentTurn: session.turn
      })}\n\n`);

      // Add initial greeting from Agent 1 to start conversation naturally
      if (session.turn === 'Agent 1') {
        const initialMessage = {
          role: 'user',
          content: '开始对话'
        };
        req.sessionManager.addMessage(session.sessionId, initialMessage);
      }

    } else if (sessionId) {
      // Continue existing session
      session = req.sessionManager.getSession(sessionId);
      if (!session) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Session not found'
        })}\n\n`);
        return res.end();
      }

      // Apply user hint if provided
      if (userHint) {
        req.sessionManager.addUserIntervention(sessionId, userHint);
        session = req.sessionManager.getSession(sessionId);
      }
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'Either scenarioId/customScenario (for new session) or sessionId (for existing) is required'
      })}\n\n`);
      return res.end();
    }

    // Build conversation context for current agent
    const currentAgent = session.turn;
    const agentData = session.agents[currentAgent];
    const otherAgent = currentAgent === 'Agent 1' ? 'Agent 2' : 'Agent 1';
    const otherAgentData = session.agents[otherAgent];

    console.log(`🎭 Starting conversation for ${currentAgent}`);
    console.log(`📝 Session history length: ${session.history.length}`);
    console.log(`🎯 User hint: ${session.userHint || 'none'}`);

    // Build messages array for OpenRouter
    const messages = await buildMessagesForAgent(session, agentData, otherAgentData, currentAgent);

    console.log(`💬 Built ${messages.length} messages for ${currentAgent}`);
    console.log('🔍 Messages preview:', messages.map(m => ({ role: m.role, content: (m.content || '').substring(0, 100) + '...' })));

    // Start streaming conversation
    await streamConversation(res, session, messages, currentAgent, req.sessionManager);

  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

async function streamConversation(res, session, messages, currentAgent, sessionManager) {
  let fullMessage = '';
  let toolCalls = [];
  let currentToolCall = null;

  console.log(`🚀 streamConversation started for ${currentAgent}`);

  try {
    // Log API request
    await logRequest(session.sessionId, currentAgent, messages, {
      model: 'openrouter',
      turnCount: session.reviewData?.turnCount || 0,
      userHint: session.userHint ? 'provided' : 'none'
    });

    // Get tools for current agent
    const agentTools = session.getCurrentAgentTools ? session.getCurrentAgentTools() : [];
    const toolsToUse = getToolsForAgent(agentTools);

    console.log(`🔧 Using ${toolsToUse.length} tools for ${currentAgent}:`, agentTools);

    // Call OpenRouter with streaming using agent-specific tools
    console.log(`📡 Calling OpenRouter API for ${currentAgent}...`);
    const response = await openRouterClient.createChatStream(messages, toolsToUse.length > 0 ? toolsToUse : CONVERSATION_TOOLS);
    console.log(`✅ OpenRouter response received for ${currentAgent}, status: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Send thinking start event
    res.write(`data: ${JSON.stringify({
      type: 'thinking_start',
      sender: currentAgent
    })}\n\n`);

    let buffer = ''; // Buffer for incomplete JSON

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      buffer += chunk;

      // Split buffer into lines but keep last incomplete line in buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep last potentially incomplete line

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          if (!data) continue; // Skip empty data

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta;

            // Handle content tokens
            if (delta.content) {
              // First content token means thinking is over, start message
              if (fullMessage === '') {
                res.write(`data: ${JSON.stringify({
                  type: 'thinking_end',
                  sender: currentAgent
                })}\n\n`);

                res.write(`data: ${JSON.stringify({
                  type: 'message_start',
                  sender: currentAgent
                })}\n\n`);
              }

              fullMessage += delta.content;

              res.write(`data: ${JSON.stringify({
                type: 'token',
                sender: currentAgent,
                content: delta.content
              })}\n\n`);
            }

            // Handle tool calls
            if (delta.tool_calls) {
              for (const toolCallDelta of delta.tool_calls) {
                const index = toolCallDelta.index;

                // Initialize tool call if needed
                if (!toolCalls[index]) {
                  toolCalls[index] = {
                    id: toolCallDelta.id || '',
                    type: 'function',
                    function: {
                      name: '',
                      arguments: ''
                    }
                  };
                }

                // Update tool call data
                if (toolCallDelta.id) {
                  toolCalls[index].id = toolCallDelta.id;
                }
                if (toolCallDelta.function?.name) {
                  toolCalls[index].function.name = toolCallDelta.function.name;
                }
                if (toolCallDelta.function?.arguments) {
                  toolCalls[index].function.arguments += toolCallDelta.function.arguments;
                }
              }
            }

            // Check for completion
            if (choice.finish_reason === 'tool_calls') {
              // Process tool calls
              await handleToolCalls(res, session, toolCalls, currentAgent, sessionManager, messages);
              return; // Tool call will trigger another stream
            }

            if (choice.finish_reason === 'stop') {
              // Log API response
              await logResponse(session.sessionId, currentAgent, {
                content: fullMessage,
                finishReason: 'stop',
                toolCalls: []
              }, {
                messageLength: fullMessage.length,
                turnCount: session.reviewData?.turnCount || 0
              });

              // Message completed
              res.write(`data: ${JSON.stringify({
                type: 'message_end',
                sender: currentAgent,
                content: fullMessage
              })}\n\n`);

              // Save message to session
              sessionManager.addMessage(session.sessionId, {
                role: 'assistant',
                content: fullMessage,
                agent: currentAgent,
                timestamp: new Date().toISOString()
              });

              // Increment turn count for completed turns
              sessionManager.incrementTurnCount(session.sessionId);

              // Switch turns
              const updatedSession = sessionManager.switchTurn(session.sessionId);
              const nextTurn = updatedSession.turn;

              console.log(`🔄 Turn switched from ${currentAgent} to ${nextTurn}`);

              res.write(`data: ${JSON.stringify({
                type: 'turn_end',
                sender: currentAgent,
                nextTurn: nextTurn
              })}\n\n`);

              // Continue with next agent automatically (unless paused or completed)
              setTimeout(async () => {
                // Check if session is still active and not paused or completed
                const currentSession = sessionManager.getSession(session.sessionId);
                if (!currentSession || currentSession.isPaused || currentSession.status === 'completed') {
                  console.log(`⏸️ Session ${session.sessionId} is paused, completed, or ended, not auto-continuing`);
                  return;
                }

                console.log(`🎭 Auto-starting conversation for ${nextTurn}`);

                const agentData = currentSession.agents[nextTurn];
                const otherAgent = nextTurn === 'Agent 1' ? 'Agent 2' : 'Agent 1';
                const otherAgentData = currentSession.agents[otherAgent];

                const messages = await buildMessagesForAgent(currentSession, agentData, otherAgentData, nextTurn);

                await streamConversation(res, currentSession, messages, nextTurn, sessionManager);
              }, 1000);

              return; // Keep connection alive
            }

          } catch (parseError) {
            console.error('Failed to parse OpenRouter response:', parseError);
            console.error('Raw data:', data);
            // Skip malformed JSON and continue processing
            continue;
          }
        }
      }
    }

  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }

  // Don't automatically end the connection - let it stay open for next turn
}

async function handleToolCalls(res, session, toolCalls, currentAgent, sessionManager, messages) {
  try {
    // Log tool calls
    await logToolCall(session.sessionId, currentAgent, toolCalls, {
      toolCount: toolCalls.length,
      turnCount: session.reviewData?.turnCount || 0
    });

    // Send tool visualization events
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === 'apply_conversational_principle') {
        try {
          const args = JSON.parse(toolCall.function.arguments);

          // Validate that required arguments exist
          if (!args.principle_name || !args.reason) {
            console.error('Incomplete tool arguments:', args);
            continue;
          }

          res.write(`data: ${JSON.stringify({
            type: 'tool_use',
            sender: currentAgent,
            toolName: args.principle_name,
            reason: args.reason,
            application: args.application || '未提供具体应用方式'
          })}\n\n`);

          // Execute the tool with parsed arguments (this will handle logging internally)
          executeConversationTool({ ...toolCall, function: { ...toolCall.function, arguments: args } }, session);

        } catch (argError) {
          console.error('Failed to parse tool arguments:', argError);
          console.error('Raw tool arguments:', toolCall.function.arguments);
          // Skip malformed tool call and continue processing
          continue;
        }
      }
    }

    // Add tool calls and responses to conversation history
    const assistantMessage = {
      role: 'assistant',
      content: '',
      tool_calls: toolCalls,
      agent: currentAgent,
      timestamp: new Date().toISOString()
    };

    sessionManager.addMessage(session.sessionId, assistantMessage);

    // Add tool responses
    for (const toolCall of toolCalls) {
      if (toolCall.id) { // Only add tool response if we have a valid tool call ID
        const toolResponse = {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `已应用沟通技巧: ${toolCall.function.name}`,
          timestamp: new Date().toISOString()
        };
        sessionManager.addMessage(session.sessionId, toolResponse);
      }
    }

    // Continue conversation with updated context including tool results
    const updatedSession = sessionManager.getSession(session.sessionId);
    const agentData = updatedSession.agents[currentAgent];
    const otherAgent = currentAgent === 'Agent 1' ? 'Agent 2' : 'Agent 1';
    const otherAgentData = updatedSession.agents[otherAgent];

    const updatedMessages = await buildMessagesForAgent(updatedSession, agentData, otherAgentData, currentAgent);

    // Continue streaming with tool results
    await streamConversation(res, updatedSession, updatedMessages, currentAgent, sessionManager);

  } catch (error) {
    console.error('Tool handling error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: 'Failed to process communication tools'
    })}\n\n`);
    res.end();
  }
}

async function buildMessagesForAgent(session, agentData, otherAgentData, currentAgent) {
  const messages = [];
  const historyThreshold = 10; // 对话历史长度阈值
  const keepRecentCount = 6;   // 保留最近的对话数量

  // Build dynamic system prompt with word count control
  let systemPrompt = `你是 ${agentData.name}，${agentData.role}。

背景与性格：
${agentData.content}

对话场景：
你正在与 ${otherAgentData.name}（${otherAgentData.role}）进行对话。

重要指示：
- 请始终使用中文进行对话
- 保持角色的真实性格和背景
- 在合适时机运用沟通技巧工具
- 回应要自然真实，符合角色设定
- 当需要深化对话或建立连接时，考虑使用 apply_conversational_principle 工具
- 你的回应应该简洁明了，通常在2-3句话以内，避免冗长的表达
- 当你的回复中包含了体现沟通技巧的关键部分时，请使用 **** 将其包裹。例如："太巧了！我也特别喜欢在公园工作，尤其是在做品牌设计的构思阶段。****大自然的色彩和纹理总能给我带来意想不到的灵感****。"这样做是为了在前端实现高亮效果。注意：只标注最关键的沟通技巧部分，不要过度使用

${session.userHint ? `\n用户指导：${session.userHint}\n请在你的下一个回应中考虑这个指导。` : ''}

记住：先思考你的回应，然后在有助于改善对话时使用沟通工具。所有对话内容都必须使用中文。`;

  // Add dynamic reminder for long conversations
  if (session.history.length > 8) {
    systemPrompt += "\n\n**提醒：对话正在变长，请务必让你的回答更加简明扼要，严格遵守简洁性要求。**";
  }

  messages.push({
    role: 'system',
    content: systemPrompt
  });

  // Process conversation history with compression
  const relevantHistory = session.history.filter(msg =>
    (msg.role === 'assistant' && msg.agent) ||
    (msg.role === 'tool' && msg.tool_call_id)
  );

  if (relevantHistory.length <= historyThreshold) {
    // Short conversation: add all history
    addHistoryMessages(messages, relevantHistory, currentAgent);
  } else {
    // Long conversation: apply compression
    console.log(`📚 Compressing conversation history: ${relevantHistory.length} -> ${keepRecentCount} messages`);

    // Keep recent messages
    const recentHistory = relevantHistory.slice(-keepRecentCount);

    // Compress middle part with summary
    const compressedCount = relevantHistory.length - keepRecentCount;
    const topicsInCompressed = await summarizeConversationTopics(relevantHistory.slice(0, -keepRecentCount));

    const compressionSummary = `[此处省略了${compressedCount}条早期对话消息。${topicsInCompressed.length > 0 ?
      `在早期对话中，双方主要讨论了：${topicsInCompressed.join('、')}。` :
      ''}继续保持角色一致性和对话自然流畅。]`;

    messages.push({
      role: 'system',
      content: compressionSummary
    });

    // Add recent history
    addHistoryMessages(messages, recentHistory, currentAgent);
  }

  console.log(`💬 Built ${messages.length} messages for ${currentAgent} (original history: ${session.history.length})`);
  return messages;
}

function addHistoryMessages(messages, history, currentAgent) {
  for (const msg of history) {
    if (msg.role === 'assistant' && msg.agent) {
      const historyMessage = {
        role: msg.agent === currentAgent ? 'assistant' : 'user',
        content: msg.content || ''
      };

      // Only add tool_calls for assistant messages from current agent
      if (msg.tool_calls && msg.agent === currentAgent) {
        historyMessage.tool_calls = msg.tool_calls;
      }

      messages.push(historyMessage);
    } else if (msg.role === 'tool' && messages.length > 0) {
      // Only add tool responses if there was a preceding tool call
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.tool_calls) {
        messages.push({
          role: 'tool',
          tool_call_id: msg.tool_call_id,
          content: msg.content
        });
      }
    }
  }
}

async function summarizeConversationTopics(compressedHistory) {
  try {
    // 提取对话内容，过滤掉工具调用相关的消息
    const conversationContent = compressedHistory
      .filter(msg => msg.role === 'assistant' && msg.content && msg.content.trim().length > 0)
      .map(msg => `${msg.agent}: ${msg.content}`)
      .join('\n\n');

    if (conversationContent.length === 0) {
      return [];
    }

    // 构造总结提示
    const summaryPrompt = `请从以下对话历史中，提炼出3-5个核心话题，并以标签形式返回，用逗号分隔。
例如：职业转型, 自由职业, 工作环境, 创意灵感

对话内容：
${conversationContent}

请直接返回话题标签，用逗号分隔：`;

    const messages = [{
      role: 'user',
      content: summaryPrompt
    }];

    // 调用非流式API获取总结
    const topicsSummary = await openRouterClient.createChat(messages);

    if (topicsSummary && topicsSummary.trim()) {
      // 解析返回的话题标签
      return topicsSummary.trim().split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    }

    return [];
  } catch (error) {
    console.error('Failed to summarize conversation topics:', error);
    // 如果总结失败，返回空数组，保持原有的工具总结逻辑作为后备
    return extractToolsAsFallback(compressedHistory);
  }
}

function extractToolsAsFallback(compressedHistory) {
  const toolsUsed = new Set();
  for (const msg of compressedHistory) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const toolCall of msg.tool_calls) {
        if (toolCall.function && toolCall.function.name === 'apply_conversational_principle') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            if (args.principle_name) {
              toolsUsed.add(args.principle_name);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  }
  return Array.from(toolsUsed);
}

module.exports = router;