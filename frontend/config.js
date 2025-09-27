// Configuration for the frontend application
window.APP_CONFIG = {
    // Backend API base URL
    API_BASE_URL: 'http://localhost:3000',

    // Development mode settings
    DEBUG_MODE: true,

    // WebSocket/SSE configuration
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 2000,

    // UI settings
    TYPING_SPEED: 50, // ms between characters
    AUTO_CONTINUE_DELAY: 2000, // ms before auto-continuing conversation

    // API endpoints
    ENDPOINTS: {
        SCENARIOS: '/api/scenarios',
        CHAT_STREAM: '/api/chat-stream',
        REVIEW: '/api/review',
        HEALTH: '/api/health'
    }
};

// Helper function to get full API URL
window.getApiUrl = function(endpoint) {
    if (!window.APP_CONFIG) {
        console.error('APP_CONFIG not loaded, using fallback');
        return 'http://localhost:3000' + endpoint;
    }
    return window.APP_CONFIG.API_BASE_URL + endpoint;
};

console.log('🔧 Frontend configuration loaded:', window.APP_CONFIG);