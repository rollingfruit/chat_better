const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

class ScenarioLoader {
  constructor() {
    this.scenarioDir = path.join(__dirname, '../../scenarios');
    this.cache = new Map();
  }

  async getAllScenarios() {
    try {
      const scenarios = [];
      const scenarioFolders = await fs.readdir(this.scenarioDir, { withFileTypes: true });

      for (const folder of scenarioFolders) {
        if (folder.isDirectory()) {
          try {
            const scenarioData = await this.loadScenario(folder.name);
            scenarios.push({
              id: folder.name,
              name: this.formatScenarioName(folder.name),
              description: scenarioData.description || 'No description available',
              agents: Object.keys(scenarioData.agents).length
            });
          } catch (error) {
            console.warn(`Failed to load scenario ${folder.name}:`, error.message);
          }
        }
      }

      return scenarios;
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      return [];
    }
  }

  async loadScenario(scenarioId) {
    // Check cache first
    if (this.cache.has(scenarioId)) {
      return this.cache.get(scenarioId);
    }

    const scenarioPath = path.join(this.scenarioDir, scenarioId);
    const agents = {};

    try {
      // Load agent_1.md
      const agent1Path = path.join(scenarioPath, 'agent_1.md');
      const agent1Content = await fs.readFile(agent1Path, 'utf8');
      const agent1Data = matter(agent1Content);
      agents['Agent 1'] = {
        ...agent1Data.data,
        content: agent1Data.content,
        tools: agent1Data.data.tools || [] // Extract tools from front matter
      };

      // Load agent_2.md
      const agent2Path = path.join(scenarioPath, 'agent_2.md');
      const agent2Content = await fs.readFile(agent2Path, 'utf8');
      const agent2Data = matter(agent2Content);
      agents['Agent 2'] = {
        ...agent2Data.data,
        content: agent2Data.content,
        tools: agent2Data.data.tools || [] // Extract tools from front matter
      };

      const scenarioData = {
        id: scenarioId,
        name: this.formatScenarioName(scenarioId),
        agents,
        description: agents['Agent 1'].scenario_description || this.formatScenarioName(scenarioId)
      };

      // Cache the loaded scenario
      this.cache.set(scenarioId, scenarioData);
      return scenarioData;

    } catch (error) {
      console.error(`Failed to load scenario ${scenarioId}:`, error);
      throw new Error(`Scenario '${scenarioId}' not found or invalid`);
    }
  }

  formatScenarioName(scenarioId) {
    return scenarioId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = ScenarioLoader;