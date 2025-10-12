const fs = require('fs');
const path = require('path');

// --- Tool Registries ---
const toolMetadataRegistry = new Map();

/**
 * Loads tool definitions from a JSON file and populates the registries.
 * @param {string} filePath - The absolute path to the tools.json file.
 */
function loadToolsFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const toolDefinitions = JSON.parse(fileContent);

    for (const toolName in toolDefinitions) {
      if (Object.hasOwnProperty.call(toolDefinitions, toolName)) {
        const { metadata } = toolDefinitions[toolName];
        if (metadata && !toolMetadataRegistry.has(toolName)) {
          toolMetadataRegistry.set(toolName, { name: toolName, ...metadata });
        }
      }
    }
  } catch (error) {
    console.error(`Error loading tool file ${path.basename(filePath)}:`, error);
  }
}

/**
 * Scans all scenario directories to find and load tool definitions.
 */
function initializeToolLibrary() {
  console.log('🔧 Initializing Tool Library...');
  const scenariosDir = path.join(__dirname, '../../scenarios');
  try {
    // Load common tools first
    const commonToolsPath = path.join(scenariosDir, 'common_tools.json');
    loadToolsFromFile(commonToolsPath);

    // Then load scenario-specific tools, which can override common ones
    const scenarioFolders = fs.readdirSync(scenariosDir, { withFileTypes: true });
    for (const folder of scenarioFolders) {
      if (folder.isDirectory()) {
        const toolsJsonPath = path.join(scenariosDir, folder.name, 'tools.json');
        loadToolsFromFile(toolsJsonPath);
      }
    }
    console.log(`✅ Tool Library initialized. ${toolMetadataRegistry.size} tools loaded.`);
  } catch (error) {
    console.error('Failed to initialize tool library:', error);
  }
}

/**
 * Get tools for a specific agent based on a list of tool names.
 * This function constructs a single, unified tool schema for the LLM.
 * @param {string[]} toolNames - Array of tool names.
 * @returns {Array} Array containing a single tool definition for the LLM.
 */
function getToolsForAgent(toolNames) {
  if (!toolNames || toolNames.length === 0) return [];

  const validToolNames = toolNames.filter(name => toolMetadataRegistry.has(name));
  if (validToolNames.length === 0) return [];

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
            "enum": validToolNames
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

  return [combinedTool];
}

/**
 * Get all available tools for the frontend custom scenario builder.
 * @returns {Array} A flat list of all loaded tools with their metadata.
 */
function getAllToolsForFrontend() {
  return Array.from(toolMetadataRegistry.values());
}

/**
 * Executes the conversational tool, logs it, and returns the result.
 * @param {object} toolCall - The tool call object from the LLM.
 * @param {object} session - The current conversation session object.
 * @returns {object} An object indicating the result of the execution.
 */
function executeConversationTool(toolCall, session) {
  let args;
  if (typeof toolCall.function.arguments === 'string') {
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch (error) {
      console.error('Failed to parse tool call arguments:', error);
      return { success: false, message: `Failed to parse arguments: ${error.message}` };
    }
  } else {
    args = toolCall.function.arguments;
  }

  const { principle_name, reason, application } = args;

  if (!principle_name || !reason) {
    console.error('Missing required tool arguments:', { principle_name, reason });
    return { success: false, message: 'Missing required arguments: principle_name and reason are required' };
  }

  const metadata = toolMetadataRegistry.get(principle_name);
  if (!metadata) {
    return { success: false, message: `Unknown principle: ${principle_name}` };
  }

  if (session) {
    session.reviewData.principlesUsed.push({
      toolName: principle_name,
      reason: reason,
      application: application || '未提供具体应用方式',
      timestamp: new Date().toISOString(),
      turn: session.reviewData.turnCount
    });
  }

  return {
    success: true,
    principle: principle_name,
    description: metadata.description,
    reason,
    application: application || '未提供具体应用方式',
    message: `Applied ${metadata.name}: ${reason}`
  };
}

// --- Initialization ---
initializeToolLibrary();

module.exports = {
  getToolsForAgent,
  getAllToolsForFrontend,
  executeConversationTool
};
