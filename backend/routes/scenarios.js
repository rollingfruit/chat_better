const express = require('express');
const ScenarioLoader = require('../utils/scenarioLoader');
const { getToolsByCategory, getAllToolNames, PRINCIPLE_DESCRIPTIONS } = require('../utils/toolLibrary');

const router = express.Router();
const scenarioLoader = new ScenarioLoader();

// GET /api/scenarios - Get all available scenarios
router.get('/', async (req, res) => {
  try {
    const scenarios = await scenarioLoader.getAllScenarios();
    res.json({
      success: true,
      scenarios,
      count: scenarios.length
    });
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load scenarios',
      message: error.message
    });
  }
});

// GET /api/scenarios/tools/list - Get simple list of all tool names
router.get('/tools/list', async (req, res) => {
  try {
    const toolNames = getAllToolNames();
    const toolsList = toolNames.map(name => ({
      name,
      ...PRINCIPLE_DESCRIPTIONS[name]
    }));

    res.json({
      success: true,
      tools: toolsList,
      count: toolsList.length
    });
  } catch (error) {
    console.error('Failed to load tools list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tools list',
      message: error.message
    });
  }
});

// GET /api/scenarios/tools - Get all available tools organized by category
router.get('/tools', async (req, res) => {
  try {
    const toolsByCategory = getToolsByCategory();
    res.json({
      success: true,
      tools: toolsByCategory,
      totalCount: getAllToolNames().length
    });
  } catch (error) {
    console.error('Failed to load tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tools',
      message: error.message
    });
  }
});

// GET /api/scenarios/:id - Get specific scenario details
router.get('/:id', async (req, res) => {
  try {
    const scenarioId = req.params.id;
    const scenario = await scenarioLoader.loadScenario(scenarioId);
    res.json({
      success: true,
      scenario
    });
  } catch (error) {
    console.error(`Failed to load scenario ${req.params.id}:`, error);
    res.status(404).json({
      success: false,
      error: 'Scenario not found',
      message: error.message
    });
  }
});

module.exports = router;