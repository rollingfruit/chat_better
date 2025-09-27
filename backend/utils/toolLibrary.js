// Tool Library - Centralized tool definitions with scenario-specific groupings
// Provides tools that can be assigned to specific agents/scenarios

// Define all available tools by category
const socialTools = {
  "find_common_ground": {
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
            "enum": ["find_common_ground"]
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
  },
  "FORD_method": {
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
            "enum": ["FORD_method"]
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
  },
  "open_ended_question": {
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
            "enum": ["open_ended_question"]
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
  },
  "active_listening_reflection": {
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
            "enum": ["active_listening_reflection"]
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
};

const professionalTools = {
  "mirroring_technique": {
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
            "enum": ["mirroring_technique"]
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
  },
  "open_ended_question": {
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
            "enum": ["open_ended_question"]
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
  },
  "active_listening_reflection": {
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
            "enum": ["active_listening_reflection"]
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
  },
  "emotional_labeling": {
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
            "enum": ["emotional_labeling"]
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
};

const supportiveTools = {
  "compliment_genuine": {
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
            "enum": ["compliment_genuine"]
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
  },
  "emotional_labeling": {
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
            "enum": ["emotional_labeling"]
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
  },
  "active_listening_reflection": {
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
            "enum": ["active_listening_reflection"]
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
};

// 面试官工具
const interviewerTools = {
  "interview_questioning": {
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
            "enum": ["interview_questioning"]
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
  },
  "behavioral_assessment": {
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
            "enum": ["behavioral_assessment"]
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
  },
  "pressure_testing": {
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
            "enum": ["pressure_testing"]
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
  },
  "company_culture_evaluation": {
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
            "enum": ["company_culture_evaluation"]
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
};

// 求职者工具
const candidateTools = {
  "STAR_storytelling": {
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
            "enum": ["STAR_storytelling"]
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
  },
  "value_demonstration": {
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
            "enum": ["value_demonstration"]
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
  },
  "weakness_reframing": {
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
            "enum": ["weakness_reframing"]
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
  },
  "strategic_questioning": {
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
            "enum": ["strategic_questioning"]
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
};

// Combine all tools into a single registry
const allTools = {
  ...socialTools,
  ...professionalTools,
  ...supportiveTools,
  ...interviewerTools,
  ...candidateTools
};

// Create master list for backward compatibility - single combined tool with all principles
const CONVERSATION_TOOLS = [{
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
            "compliment_genuine",
            "interview_questioning",
            "behavioral_assessment",
            "pressure_testing",
            "company_culture_evaluation",
            "STAR_storytelling",
            "value_demonstration",
            "weakness_reframing",
            "strategic_questioning"
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
}];

const PRINCIPLE_DESCRIPTIONS = {
  "FORD_method": {
    "name": "F.O.R.D. 聊天法",
    "description": "询问家庭(Family)、工作(Occupation)、娱乐(Recreation)或梦想(Dreams)来寻找对话话题",
    "icon": "👥",
    "example": "告诉我关于你的家庭 / 你是做什么工作的？ / 你平时喜欢做什么消遣？ / 你有什么目标或梦想？",
    "category": "social"
  },
  "open_ended_question": {
    "name": "开放性问题",
    "description": "提出需要详细回答而非简单是/否的问题，鼓励对方详细阐述",
    "icon": "❓",
    "example": "那种体验对你来说是什么样的？ / 你是怎么进入这个领域的？ / 这其中最有趣的部分是什么？",
    "category": "professional"
  },
  "active_listening_reflection": {
    "name": "积极倾听与反映",
    "description": "通过复述对方所说的话来表明你在认真倾听",
    "icon": "👂",
    "example": "所以你的意思是... / 听起来你真的很享受... / 我能感受到你对此很有热情...",
    "category": "supportive"
  },
  "find_common_ground": {
    "name": "寻找共同点",
    "description": "识别共同的经历、兴趣或价值观来建立联系",
    "icon": "🤝",
    "example": "我也有过类似的经历... / 我们都似乎喜欢... / 这让我想起了我...",
    "category": "social"
  },
  "mirroring_technique": {
    "name": "镜像技巧",
    "description": "巧妙地模仿对方的沟通风格、精力或肢体语言",
    "icon": "🪞",
    "example": "匹配对方的热情程度、说话节奏或正式程度",
    "category": "professional"
  },
  "emotional_labeling": {
    "name": "情感标签",
    "description": "承认并指出你在对话中观察到的情感",
    "icon": "💭",
    "example": "你看起来对此很兴奋 / 我能感受到一些挫败感 / 那一定很有挑战性",
    "category": "professional"
  },
  "compliment_genuine": {
    "name": "真诚赞美",
    "description": "给予真实、具体的赞美，表明你在用心关注",
    "icon": "⭐",
    "example": "我很佩服你对...的投入 / 你解释得很好... / 这是个很有创意的方法",
    "category": "supportive"
  },
  // 面试官工具
  "interview_questioning": {
    "name": "面试提问技巧",
    "description": "运用结构化问题和追问技巧深入了解候选人能力",
    "icon": "🎯",
    "example": "请描述一个具体的例子... / 那种情况下你是如何处理的？ / 你从中学到了什么？",
    "category": "interview_interviewer"
  },
  "behavioral_assessment": {
    "name": "行为面试评估",
    "description": "通过STAR方法评估候选人的过往行为和决策能力",
    "icon": "📊",
    "example": "请用STAR格式描述... / 在那种情况下，你采取了什么行动？ / 结果如何？",
    "category": "interview_interviewer"
  },
  "pressure_testing": {
    "name": "压力测试",
    "description": "通过适度的压力问题测试候选人的抗压能力和思维敏捷性",
    "icon": "⚡",
    "example": "如果时间很紧，你会如何处理？ / 假设资源有限，你的优先级是什么？",
    "category": "interview_interviewer"
  },
  "company_culture_evaluation": {
    "name": "企业文化匹配度评估",
    "description": "评估候选人与公司价值观和文化的契合度",
    "icon": "🏢",
    "example": "我们公司重视...，你如何看待？ / 描述你理想的工作环境",
    "category": "interview_interviewer"
  },
  // 求职者工具
  "STAR_storytelling": {
    "name": "STAR故事叙述",
    "description": "使用情况-任务-行动-结果的结构化方式回答行为问题",
    "icon": "⭐",
    "example": "当时的情况是... / 我的任务是... / 我采取的行动是... / 最终的结果是...",
    "category": "interview_candidate"
  },
  "value_demonstration": {
    "name": "价值展示",
    "description": "通过具体案例和数据展示自己能为公司带来的价值",
    "icon": "💎",
    "example": "我在之前的项目中... / 这为公司节省了... / 我的贡献帮助团队...",
    "category": "interview_candidate"
  },
  "weakness_reframing": {
    "name": "弱点重构",
    "description": "诚实地承认弱点并展示改进努力和学习态度",
    "icon": "🔄",
    "example": "我意识到我在...方面需要提升 / 为此我... / 现在我已经...",
    "category": "interview_candidate"
  },
  "strategic_questioning": {
    "name": "战略性提问",
    "description": "提出深思熟虑的问题展示对公司和职位的理解和兴趣",
    "icon": "🤔",
    "example": "公司在...方面的战略是什么？ / 这个职位面临的最大挑战是什么？",
    "category": "interview_candidate"
  }
};

/**
 * Get tools for specific agent roles
 * @param {string|string[]} toolNames - Array of tool names or single tool name
 * @returns {Array} Array of tool definitions
 */
function getToolsForAgent(toolNames) {
  if (!toolNames) return [];

  const names = Array.isArray(toolNames) ? toolNames : [toolNames];
  const selectedTools = [];

  // Create a combined tool with only the specified principles
  const combinedTool = {
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
            "enum": names.filter(name => PRINCIPLE_DESCRIPTIONS[name]) // Only valid principles
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
  };

  if (combinedTool.function.parameters.properties.principle_name.enum.length > 0) {
    selectedTools.push(combinedTool);
  }

  return selectedTools;
}

/**
 * Get all available tools by category for frontend display
 * @returns {Object} Tools organized by category
 */
function getToolsByCategory() {
  return {
    social: Object.keys(socialTools).map(key => ({
      name: key,
      ...PRINCIPLE_DESCRIPTIONS[key]
    })),
    professional: Object.keys(professionalTools).map(key => ({
      name: key,
      ...PRINCIPLE_DESCRIPTIONS[key]
    })),
    supportive: Object.keys(supportiveTools).map(key => ({
      name: key,
      ...PRINCIPLE_DESCRIPTIONS[key]
    })),
    interview_interviewer: Object.keys(interviewerTools).map(key => ({
      name: key,
      ...PRINCIPLE_DESCRIPTIONS[key]
    })),
    interview_candidate: Object.keys(candidateTools).map(key => ({
      name: key,
      ...PRINCIPLE_DESCRIPTIONS[key]
    }))
  };
}

/**
 * Get all available tool names
 * @returns {Array} Array of all tool names
 */
function getAllToolNames() {
  return Object.keys(PRINCIPLE_DESCRIPTIONS);
}

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
  // Tool categories
  socialTools,
  professionalTools,
  supportiveTools,
  interviewerTools,
  candidateTools,
  allTools,

  // Backward compatibility
  CONVERSATION_TOOLS,
  PRINCIPLE_DESCRIPTIONS,

  // New functions
  getToolsForAgent,
  getToolsByCategory,
  getAllToolNames,
  executeConversationTool
};