// Define conversation tools that agents can use during chat
const CONVERSATION_TOOLS = [
  {
    "type": "function",
    "function": {
      "name": "apply_conversational_principle",
      "description": "运用特定的沟通原则或技巧来改善对话流程和与对方的连接。",
      "parameters": {
        "type": "object",
        "properties": {
          "principle_name": {
            "type": "string",
            "description": "要应用的沟通原则名称",
            "enum": [
              "FORD_method",
              "open_ended_question",
              "active_listening_reflection",
              "find_common_ground",
              "mirroring_technique",
              "emotional_labeling",
              "compliment_genuine"
            ]
          },
          "reason": {
            "type": "string",
            "description": "解释为什么这个原则适合当前的对话情境，以及你希望通过使用它达到什么目的。"
          },
          "application": {
            "type": "string",
            "description": "描述你将如何在下一个回应中具体应用这个原则。"
          }
        },
        "required": ["principle_name", "reason", "application"]
      }
    }
  }
];

const PRINCIPLE_DESCRIPTIONS = {
  "FORD_method": {
    "name": "F.O.R.D. Method",
    "description": "Ask about Family, Occupation, Recreation, or Dreams to find conversation topics",
    "icon": "👥",
    "example": "Tell me about your family / What do you do for work? / What do you like to do for fun? / What are your goals or dreams?"
  },
  "open_ended_question": {
    "name": "Open-Ended Questions",
    "description": "Ask questions that require more than a yes/no answer to encourage elaboration",
    "icon": "❓",
    "example": "What was that experience like for you? / How did you get into that field? / What's the most interesting part about that?"
  },
  "active_listening_reflection": {
    "name": "Active Listening & Reflection",
    "description": "Show you're listening by reflecting back what the other person said",
    "icon": "👂",
    "example": "So what you're saying is... / It sounds like you really enjoyed... / I can hear that you're passionate about..."
  },
  "find_common_ground": {
    "name": "Find Common Ground",
    "description": "Identify shared experiences, interests, or values to build connection",
    "icon": "🤝",
    "example": "I've experienced something similar... / We both seem to enjoy... / That reminds me of when I..."
  },
  "mirroring_technique": {
    "name": "Mirroring Technique",
    "description": "Subtly match the other person's communication style, energy, or body language",
    "icon": "🪞",
    "example": "Match their enthusiasm level, speaking pace, or formality level"
  },
  "emotional_labeling": {
    "name": "Emotional Labeling",
    "description": "Acknowledge and name the emotions you observe in the conversation",
    "icon": "💭",
    "example": "You seem excited about this / I can sense some frustration / That must have been challenging"
  },
  "compliment_genuine": {
    "name": "Genuine Compliment",
    "description": "Give authentic, specific praise that shows you're paying attention",
    "icon": "⭐",
    "example": "I admire your dedication to... / You have a great way of explaining... / That's such a creative approach"
  }
};

function executeConversationTool(toolCall, session) {
  // Handle both parsed arguments (object) and string arguments
  let args;
  if (typeof toolCall.function.arguments === 'string') {
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch (error) {
      console.error('Failed to parse tool call arguments:', error);
      return {
        success: false,
        message: `Failed to parse arguments: ${error.message}`
      };
    }
  } else {
    args = toolCall.function.arguments;
  }

  const { principle_name, reason, application } = args;

  // Validate required fields
  if (!principle_name || !reason) {
    console.error('Missing required tool arguments:', { principle_name, reason });
    return {
      success: false,
      message: 'Missing required arguments: principle_name and reason are required'
    };
  }

  // Log the tool usage for analytics (only add if not already present to avoid duplicates)
  if (session) {
    session.reviewData.principlesUsed.push({
      toolName: principle_name,
      reason: reason,
      application: application || '未提供具体应用方式',
      timestamp: new Date().toISOString(),
      turn: session.reviewData.turnCount
    });
  }

  const principle = PRINCIPLE_DESCRIPTIONS[principle_name];
  if (!principle) {
    return {
      success: false,
      message: `Unknown principle: ${principle_name}`
    };
  }

  return {
    success: true,
    principle: principle_name,
    description: principle.description,
    reason,
    application: application || '未提供具体应用方式',
    message: `Applied ${principle.name}: ${reason}`
  };
}

module.exports = {
  CONVERSATION_TOOLS,
  PRINCIPLE_DESCRIPTIONS,
  executeConversationTool
};