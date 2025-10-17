class ConversationApp {
    constructor() {
        this.currentSession = null;
        this.eventSource = null;
        this.currentMessage = null;
        this.isThinking = false;
        this.isPaused = false;
        this.autoContinueTimer = null; // Track pending auto-continue timer
        this.pendingToolCalls = []; // Cache tool calls when no current message
        this.toolDetailTimeout = null; // Track tool detail auto-hide timeout
        this.stats = {
            turns: 0,
            toolsUsed: 0,
            hints: 0
        };

        this.initializeApp();
        this.bindEvents();
    }

    async initializeApp() {
        // Load scenarios when app starts
        await this.loadScenarios();
    }

    bindEvents() {
        // Scenario selection - use event delegation to handle clicks on card or its children
        document.addEventListener('click', (e) => {
            // Find the closest scenario card (handles clicks on child elements too)
            const scenarioCard = e.target.closest('.scenario-card');
            if (scenarioCard) {
                const scenarioId = scenarioCard.dataset.scenarioId;
                this.startScenario(scenarioId);
            }
        });

        // Control buttons - check if elements exist (desktop and mobile)
        const pauseBtn = document.getElementById('pause-btn');
        const reviewBtn = document.getElementById('review-btn');
        const pauseBtnMobile = document.getElementById('pause-btn-mobile');
        const reviewBtnMobile = document.getElementById('review-btn-mobile');
        const applyHintBtn = document.getElementById('apply-hint-btn');
        const cancelHintBtn = document.getElementById('cancel-hint-btn');
        const closeReviewBtn = document.getElementById('close-review');

        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
        if (reviewBtn) reviewBtn.addEventListener('click', () => this.showReview());
        if (pauseBtnMobile) pauseBtnMobile.addEventListener('click', () => this.togglePause());
        if (reviewBtnMobile) reviewBtnMobile.addEventListener('click', () => this.showReview());
        if (applyHintBtn) applyHintBtn.addEventListener('click', () => this.applyUserHint());
        if (cancelHintBtn) cancelHintBtn.addEventListener('click', () => this.cancelUserHint());
        if (closeReviewBtn) closeReviewBtn.addEventListener('click', () => this.closeReview());

        // Custom scenario buttons
        const createCustomBtn = document.getElementById('create-custom-scenario');
        const backToScenariosBtn = document.getElementById('back-to-scenarios');
        const startCustomBtn = document.getElementById('start-custom-scenario');

        if (createCustomBtn) createCustomBtn.addEventListener('click', () => this.showCustomScenarioModal());
        if (backToScenariosBtn) backToScenariosBtn.addEventListener('click', () => this.hideCustomScenarioModal());
        if (startCustomBtn) startCustomBtn.addEventListener('click', () => this.startCustomScenario());

        // Tool interactions - use event delegation to handle clicks on tool indicator or its children
        document.addEventListener('click', (e) => {
            const toolIndicator = e.target.closest('.tool-indicator');
            if (toolIndicator) {
                this.showToolDetail(toolIndicator);
            }
        });

        document.addEventListener('mouseenter', (e) => {
            // Ensure e.target is an Element before using closest
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
                const toolIndicator = e.target.closest('.tool-indicator');
                if (toolIndicator) {
                    this.showToolTooltip({ target: toolIndicator });
                }
            }
        }, true); // Use capture phase for better child element handling

        document.addEventListener('mouseleave', (e) => {
            // Ensure e.target is an Element before using closest
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE) {
                const toolIndicator = e.target.closest('.tool-indicator');
                if (toolIndicator) {
                    this.hideToolTooltip();
                }
            }
        }, true); // Use capture phase for better child element handling

        // Close tool detail
        const closeToolDetailBtn = document.getElementById('close-tool-detail');
        if (closeToolDetailBtn) {
            closeToolDetailBtn.addEventListener('click', () => this.hideToolDetail());
        }

        // Close header tool display
        const closeHeaderToolBtn = document.getElementById('close-header-tool');
        if (closeHeaderToolBtn) {
            closeHeaderToolBtn.addEventListener('click', () => this.hideHeaderToolDetail());
        }
    }

    async loadScenarios() {
        try {
            const loadingEl = document.getElementById('scenario-loading');
            const listEl = document.getElementById('scenario-list');

            console.log('🔄 Loading scenarios from:', getApiUrl('/api/scenarios'));
            const response = await fetch(getApiUrl('/api/scenarios'));
            const data = await response.json();

            if (data.success) {
                loadingEl.style.display = 'none';
                this.renderScenarios(data.scenarios, listEl);
            } else {
                loadingEl.textContent = 'Failed to load scenarios: ' + data.error;
            }
        } catch (error) {
            console.error('Failed to load scenarios:', error);
            const loadingEl = document.getElementById('scenario-loading');
            if (loadingEl) {
                loadingEl.textContent = 'Connection error. Please check if the backend server is running on port 3000.';
            }
        }
    }

    getScenarioDisplayName(scenarioId) {
        const nameMap = {
            'job_interview': '面试场景',
            'coffee_shop': '咖啡店邂逅',
            'tech_meetup': '技术交流会',
            'billionaire_vs_worker': '首富对话打工人',
            'property_dispute': '物业纠纷'
        };
        return nameMap[scenarioId] || scenarioId;
    }

    getScenarioDisplayDescription(scenarioId) {
        const descMap = {
            'job_interview': '练习专业的面试技巧和评估方法',
            'coffee_shop': '在轻松的环境中练习与陌生人的随意对话',
            'tech_meetup': '在技术活动中练习建立人脉关系',
            'billionaire_vs_worker': '关于工作、生活和价值观的对话',
            'property_dispute': '维权业主与物业经理就高额物业费和服务质量展开对话'
        };
        return descMap[scenarioId] || '对话练习场景';
    }

    renderScenarios(scenarios, container) {
        container.innerHTML = scenarios.map(scenario => `
            <div class="scenario-card bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-blue-300"
                 data-scenario-id="${scenario.id}">
                <h3 class="text-xl font-bold text-gray-800 mb-3">${this.getScenarioDisplayName(scenario.id)}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${this.getScenarioDisplayDescription(scenario.id)}</p>
                <div class="agent-count inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    <span class="mr-1">👥</span>${scenario.agents} 个角色
                </div>
            </div>
        `).join('');
    }

    async startScenario(scenarioId) {
        try {
            this.showLoading('Initializing conversation...');

            // Hide scenario modal and show main interface
            document.getElementById('scenario-modal').classList.add('hidden');
            document.getElementById('main-interface').classList.remove('hidden');

            // Load scenario details
            const response = await fetch(getApiUrl(`/api/scenarios/${scenarioId}`));
            const data = await response.json();

            if (data.success) {
                this.setupInterface(data.scenario);
                await this.initializeConversation(scenarioId);
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            console.error('Failed to start scenario:', error);
            alert('Failed to start conversation: ' + error.message);

            // Reset UI state on error
            document.getElementById('scenario-modal').classList.remove('hidden');
            document.getElementById('main-interface').classList.add('hidden');
            this.hideLoading();
        }
    }

    setupInterface(scenario) {
        // Update header
        document.getElementById('scenario-title').textContent = scenario.name;
        document.getElementById('scenario-description').textContent = scenario.description;

        // Setup agent information
        const agent1 = scenario.agents['Agent 1'];
        const agent2 = scenario.agents['Agent 2'];

        // Store agent data for later use
        this.agentData = {
            'Agent 1': agent1,
            'Agent 2': agent2
        };

        // Update agent names
        const agent1NameEl = document.getElementById('agent1-name');
        if (agent1NameEl) {
            agent1NameEl.textContent = agent1.name || 'Agent 1';
        }

        const agent2NameEl = document.getElementById('agent2-name');
        if (agent2NameEl) {
            agent2NameEl.textContent = agent2.name || 'Agent 2';
        }

        // Update agent avatars
        this.updateAgentAvatars(agent1, agent2);

        // Clear welcome message
        document.getElementById('chat-messages').innerHTML = '';

        // Reset stats
        this.stats = { turns: 0, toolsUsed: 0, hints: 0 };
        this.updateStats();

        // Clear any pending tool calls
        this.pendingToolCalls = [];
    }

    updateAgentAvatars(agent1, agent2) {
        // Update Agent 1 avatar
        const agent1AvatarEl = document.getElementById('agent1-avatar');
        if (agent1AvatarEl && agent1.avatar) {
            agent1AvatarEl.innerHTML = `<img src="${agent1.avatar}" alt="${agent1.name}" class="avatar-image" />`;
        }

        // Update Agent 2 avatar
        const agent2AvatarEl = document.getElementById('agent2-avatar');
        if (agent2AvatarEl && agent2.avatar) {
            agent2AvatarEl.innerHTML = `<img src="${agent2.avatar}" alt="${agent2.name}" class="avatar-image" />`;
        }
    }

    getAgentDisplayName(agentKey) {
        if (this.agentData && this.agentData[agentKey]) {
            return this.agentData[agentKey].name;
        }
        return agentKey; // fallback to Agent 1/Agent 2
    }

    async initializeConversation(scenarioId) {
        try {
            // Start SSE connection
            this.startSSEConnection({
                scenarioId,
                action: 'start'
            });

        } catch (error) {
            console.error('Failed to initialize conversation:', error);
            this.hideLoading();
            throw error;
        }
    }

    startSSEConnection(data) {
        // Close existing connection
        if (this.eventSource) {
            this.eventSource.close();
        }

        // Start new SSE connection via POST
        fetch(getApiUrl('/api/chat-stream'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            this.processSSEStream(reader, decoder);
        }).catch(error => {
            console.error('SSE connection failed:', error);
            this.hideLoading();
            alert('Failed to connect to conversation stream: ' + error.message);
        });
    }

    async processSSEStream(reader, decoder) {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]' || dataStr === '') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            this.handleSSEMessage(data);
                        } catch (e) {
                            console.warn('Failed to parse SSE message:', line, 'Error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('SSE stream error:', error);
            this.handleConnectionError(error);
        }
    }

    handleSSEMessage(data) {
        console.log('SSE Message:', data);

        switch (data.type) {
            case 'session_start':
                this.currentSession = data.sessionId;
                this.hideLoading();
                const currentAgentName = this.getAgentDisplayName(data.currentTurn);
                this.updateTurnIndicator(`${currentAgentName} 正在思考...`);
                this.updateAgentStatus(data.currentTurn, 'thinking');
                break;

            case 'thinking_start':
                this.isThinking = true;
                this.updateAgentStatus(data.sender, 'thinking');
                const thinkingAgentName = this.getAgentDisplayName(data.sender);
                this.updateTurnIndicator(`${thinkingAgentName} 正在思考...`);
                this.showTypingIndicator(true);
                break;

            case 'thinking_end':
                this.showTypingIndicator(false);
                const respondingAgentName = this.getAgentDisplayName(data.sender);
                this.updateTurnIndicator(`${respondingAgentName} 正在回应...`);
                break;

            case 'message_start':
                if (!this.currentMessage) {
                    this.currentMessage = this.createMessage(data.sender);
                }

                // Apply any pending tool calls to the message.
                // This is a fallback for cases where tool_use might still get cached.
                if (this.pendingToolCalls.length > 0) {
                    for (const toolData of this.pendingToolCalls) {
                        this.updateOrAddToolIndicator(this.currentMessage, toolData);
                    }
                    this.pendingToolCalls = []; // Clear pending tools
                }
                break;

            case 'token':
                if (this.currentMessage) {
                    this.appendToken(this.currentMessage, data.content);
                }
                break;

            case 'message_end':
                if (this.currentMessage) {
                    this.finalizeMessage(this.currentMessage, data.sender, data.content);
                    this.currentMessage = null;
                }
                this.stats.turns++;
                this.updateStats();
                break;

            case 'tool_selected':
                // Handle early tool selection notification
                console.log(` 本次 Tool selected: ${data.toolName}`);
                // Show tool selection in header immediately
                this.showToolSelectionNotification(data.toolName, data.sender);

                // Create message container if it doesn't exist yet
                if (!this.currentMessage) {
                    this.currentMessage = this.createMessage(data.sender);
                }

                break;

            case 'tool_use':
                if (!this.currentMessage) {
                    // If tool_use is the first event for a turn, create the message bubble.
                    this.currentMessage = this.createMessage(data.sender);
                }
                // Update existing placeholder or add a new expanded indicator in the message
                this.updateOrAddToolIndicator(this.currentMessage, data);

                // Show the full tool details in the header overlay
                this.showHeaderToolDetail(data.toolName, data.reason, data.application);

                this.stats.toolsUsed++;
                this.updateStats();
                break;

            case 'turn_end':
                this.isThinking = false; // Release state lock
                this.updateAgentStatus(data.sender, 'waiting');
                this.updateAgentStatus(data.nextTurn, 'active');

                if (this.isPaused) {
                    this.updateTurnIndicator(`对话已暂停 - 点击继续按钮恢复`);
                } else {
                    const nextAgentName = this.getAgentDisplayName(data.nextTurn);
                    this.updateTurnIndicator(`${nextAgentName} 正在准备回应...`);
                }

                const senderName = this.getAgentDisplayName(data.sender);
                const nextName = this.getAgentDisplayName(data.nextTurn);
                console.log(` Turn ended: ${senderName} → ${nextName} (Backend will auto-continue if not paused)`);
                break;

            case 'session_end':
                this.isThinking = false; // Release state lock
                this.endConversation();
                break;

            case 'error':
                this.isThinking = false; // Release state lock
                console.error('Server error:', data.message);
                alert('Conversation error: ' + data.message);
                break;
        }
    }

    createMessage(sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        const agentClass = sender.toLowerCase().replace(' ', '');
        const isAgent1 = sender === 'Agent 1';

        messageEl.className = `message ${agentClass} flex ${isAgent1 ? 'justify-start' : 'justify-end'} mb-4`;

        // Get agent data
        const agentData = this.agentData && this.agentData[sender];
        const agentName = agentData ? agentData.name : sender;

        // Get agent avatar
        let agentAvatar;
        if (agentData && agentData.avatar) {
            agentAvatar = `<img src="${agentData.avatar}" alt="${agentName}" class="avatar-image" />`;
        } else {
            // Fallback to emoji
            agentAvatar = isAgent1 ? '' : '';
        }

        const bubbleColor = isAgent1 ? 'bg-blue-100 border-blue-200' : 'bg-green-100 border-green-200';
        const textColor = isAgent1 ? 'text-blue-900' : 'text-green-900';

        messageEl.innerHTML = `
            ${isAgent1 ? `<div class="message-avatar">${agentAvatar}</div>` : ''}
            <div class="message-content max-w-2xl">
                <div class="message-header mb-2 ${isAgent1 ? 'text-left' : 'text-right'}">
                    <span class="agent-name text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        ${agentName}
                    </span>
                </div>
                <div class="message-tools flex flex-wrap gap-2 mb-2 ${isAgent1 ? 'justify-start' : 'justify-end'}"></div>
                <div class="message-bubble ${bubbleColor} ${textColor} border rounded-2xl p-4 shadow-sm">
                    <span class="message-text"></span>
                </div>
            </div>
            ${!isAgent1 ? `<div class="message-avatar">${agentAvatar}</div>` : ''}
        `;

        messagesContainer.appendChild(messageEl);

        // Always scroll to bottom when creating a new message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return messageEl;
    }

    appendToken(messageEl, token) {
        const textEl = messageEl.querySelector('.message-text');

        // Check if this is the first token (text is empty)
        const isFirstToken = textEl.textContent === '';

        if (isFirstToken) {
            // Keep tool overlay visible for 2s after text starts streaming.
            if (this.toolDetailTimeout) {
                clearTimeout(this.toolDetailTimeout);
            }
            this.toolDetailTimeout = setTimeout(() => {
                this.hideHeaderToolDetail();
            }, 2000);

            // Collapse any expanded tool indicators before showing message content
            this.collapseExpandedTools(messageEl);
        }

        textEl.textContent += token;

        // Smart auto-scroll: only scroll if user is near bottom
        const container = document.getElementById('chat-messages');
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }

    finalizeMessage(messageEl, sender, fullContent) {
        // Ensure full content is set and render markdown
        const textEl = messageEl.querySelector('.message-text');
        textEl.innerHTML = SimpleMarkdown.render(fullContent);
    }


    updateOrAddToolIndicator(messageEl, toolData) {
        const toolsEl = messageEl.querySelector('.message-tools');

        // Check if there's an expanded placeholder for this tool
        const existingIndicator = Array.from(toolsEl.children).find(
            el => el.dataset.toolName === toolData.toolName && el.dataset.expanded === 'true'
        );

        const formattedName = this.formatToolName(toolData.toolName);
        const description = this.getToolDescription(toolData.toolName);

        const innerHTML = `
            <div class="flex items-start space-x-3">
                <span class="text-2xl">${this.getToolIcon(toolData.toolName)}</span>
                <div class="flex-1">
                    <div class="font-bold text-purple-900 text-base mb-1">${formattedName}</div>
                    <div class="text-sm text-purple-700 mb-2">${description}</div>
                    <div class="text-xs text-purple-600 mb-1">
                        <span class="font-semibold">使用原因：</span>${toolData.reason || '未提供'}
                    </div>
                    ${toolData.application ? `
                    <div class="text-xs text-purple-600">
                        <span class="font-semibold">应用方式：</span>${toolData.application}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (existingIndicator) {
            // Update the existing expanded card with full data
            existingIndicator.dataset.reason = toolData.reason;
            existingIndicator.dataset.application = toolData.application;
            existingIndicator.innerHTML = innerHTML;
        } else {
            // No placeholder found, create a new expanded card directly.
            const toolEl = document.createElement('div');
            toolEl.className = 'tool-indicator bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4 shadow-md transition-all duration-300';
            toolEl.dataset.toolName = toolData.toolName;
            toolEl.dataset.expanded = 'true';
            toolEl.dataset.reason = toolData.reason;
            toolEl.dataset.application = toolData.application;
            toolEl.innerHTML = innerHTML;
            toolsEl.appendChild(toolEl);
        }
    }

    collapseExpandedTools(messageEl) {
        const toolsEl = messageEl.querySelector('.message-tools');
        const expandedTools = Array.from(toolsEl.children).filter(
            el => el.dataset.expanded === 'true'
        );

        expandedTools.forEach(expandedTool => {
            const toolName = expandedTool.dataset.toolName;
            const reason = expandedTool.dataset.reason;
            const application = expandedTool.dataset.application;

            // Replace with collapsed tag version
            const collapsedEl = document.createElement('div');
            collapsedEl.className = 'tool-indicator bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all duration-200 inline-flex items-center space-x-2';
            collapsedEl.dataset.toolName = toolName;
            collapsedEl.dataset.reason = reason || '';
            collapsedEl.dataset.application = application || '';

            const formattedName = this.formatToolName(toolName);
            collapsedEl.innerHTML = `
                <span class="text-base">${this.getToolIcon(toolName)}</span>
                <span>${formattedName}</span>
            `;

            // Replace expanded with collapsed
            expandedTool.replaceWith(collapsedEl);
        });
    }

    formatToolName(toolName) {
        const names = {
            'FORD_method': 'F.O.R.D.技巧',
            'open_ended_question': '开放式提问',
            'active_listening_reflection': '积极倾听',
            'find_common_ground': '寻找共同点',
            'mirroring_technique': '镜像技巧',
            'emotional_labeling': '情感标记',
            'compliment_genuine': '真诚赞美',
            // 面试官工具
            'interview_questioning': '面试提问技巧',
            'behavioral_assessment': '行为面试评估',
            'pressure_testing': '压力测试',
            'company_culture_evaluation': '企业文化评估',
            // 求职者工具
            'STAR_storytelling': 'STAR故事叙述',
            'value_demonstration': '价值展示',
            'weakness_reframing': '弱点重构',
            'strategic_questioning': '战略性提问',
            // 物业经理工具
            'delay_tactics': '拖延战术',
            'emotional_appeal': '情感诉求',
            'procedural_deflection': '程序推诿',
            'responsibility_shifting': '责任转移',
            // 业主工具
            'evidence_based_argumentation': '证据论证',
            'regulatory_citation': '法规引用',
            'logical_dismantling': '逻辑拆解',
            'value_comparison': '价值对比'
        };
        return names[toolName] || toolName;
    }

    getToolIcon(toolName) {
        const icons = {
            'FORD_method': '👥',
            'open_ended_question': '💬',
            'active_listening_reflection': '👂',
            'find_common_ground': '🤝',
            'mirroring_technique': '🪞',
            'emotional_labeling': '❤️',
            'compliment_genuine': '👍',
            // 面试官工具
            'interview_questioning': '🎯',
            'behavioral_assessment': '📊',
            'pressure_testing': '⚡',
            'company_culture_evaluation': '🏢',
            // 求职者工具
            'STAR_storytelling': '⭐',
            'value_demonstration': '💎',
            'weakness_reframing': '🔄',
            'strategic_questioning': '🤔',
            // 物业经理工具
            'delay_tactics': '⏳',
            'emotional_appeal': '😢',
            'procedural_deflection': '📋',
            'responsibility_shifting': '👉',
            // 业主工具
            'evidence_based_argumentation': '📸',
            'regulatory_citation': '⚖️',
            'logical_dismantling': '🔍',
            'value_comparison': '📊'
        };
        return icons[toolName] || '🛠️';
    }

    updateAgentStatus(agent, status) {
        const agentId = agent.toLowerCase().replace(' ', '');
        const circleEl = document.getElementById(`${agentId}-circle`);
        const avatarEl = document.getElementById(`${agentId}-avatar`);

        // Since status elements don't exist in HTML, only update visual indicators
        if (circleEl) {
            // Remove existing status classes
            circleEl.className = 'avatar-circle';

            const statusConfig = {
                'thinking': {
                    circleClass: 'thinking'
                },
                'active': {
                    circleClass: 'active'
                },
                'waiting': {
                    circleClass: ''
                }
            };

            const config = statusConfig[status] || statusConfig['waiting'];

            // Update avatar circle animation
            if (config.circleClass) {
                circleEl.className += ` ${config.circleClass}`;
            }
        }

        console.log(`🎭 Agent ${agent} status updated to: ${status}`);
    }

    updateTurnIndicator(text) {
        document.getElementById('current-turn-text').textContent = text;
    }

    showTypingIndicator(show) {
        const indicator = document.getElementById('typing-indicator');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    updateStats() {
        document.getElementById('turn-count').textContent = this.stats.turns;
        document.getElementById('tools-count').textContent = this.stats.toolsUsed;
        document.getElementById('hints-count').textContent = this.stats.hints;
    }

    async togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');

        // Update backend pause state
        if (this.currentSession) {
            try {
                const response = await fetch(getApiUrl('/api/chat-stream/pause'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: this.currentSession,
                        isPaused: this.isPaused
                    })
                });
                const data = await response.json();
                if (!data.success) {
                    console.error('Failed to update pause state:', data.error);
                }
            } catch (error) {
                console.error('Failed to update pause state:', error);
            }
        }

        if (this.isPaused) {
            // User clicked pause
            pauseBtn.textContent = '▶️ Continue';
            pauseBtn.classList.add('secondary');
            this.showUserIntervention();

            // Cancel any pending auto-continue timer
            if (this.autoContinueTimer) {
                clearTimeout(this.autoContinueTimer);
                this.autoContinueTimer = null;
                console.log('🚫 Cancelled auto-continue timer due to user pause');
            }
        } else {
            // User clicked continue
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.classList.remove('secondary');
            this.hideUserIntervention();

            // Only continue if we're not already thinking
            if (!this.isThinking) {
                this.continueConversation();
            }
        }
    }

    showUserIntervention() {
        document.getElementById('intervention-panel').classList.remove('hidden');
        document.getElementById('user-hint').focus();
    }

    hideUserIntervention() {
        document.getElementById('intervention-panel').classList.add('hidden');
        document.getElementById('user-hint').value = '';
    }

    applyUserHint() {
        const hint = document.getElementById('user-hint').value.trim();
        if (!hint) {
            alert('Please enter some guidance for the conversation.');
            return;
        }

        this.stats.hints++;
        this.updateStats();

        // Continue conversation with user hint
        this.continueConversation(hint);
        this.togglePause(); // This will hide the intervention panel
    }

    cancelUserHint() {
        this.togglePause(); // This will hide the intervention panel and continue
    }

    continueConversation(userHint = null) {
        if (!this.currentSession) return;
        if (this.isThinking) return; // Prevent concurrent requests

        this.isThinking = true; // Set state lock

        const data = {
            sessionId: this.currentSession,
            action: 'continue'
        };

        if (userHint) {
            data.userHint = userHint;
        }

        this.startSSEConnection(data);
    }

    endConversation() {
        this.updateTurnIndicator('Conversation completed');
        document.getElementById('review-btn').disabled = false;

        // Update all agents to waiting status
        this.updateAgentStatus('Agent 1', 'waiting');
        this.updateAgentStatus('Agent 2', 'waiting');
    }

    async showReview() {
        if (!this.currentSession) return;

        try {
            // First, send termination request to backend
            const terminateResponse = await fetch(getApiUrl('/api/chat-stream/end'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.currentSession })
            });

            if (terminateResponse.ok) {
                // Immediately update UI to show conversation ended
                this.endConversation();
            }

            this.showLoading('Generating conversation review...');

            const response = await fetch(getApiUrl(`/api/review/${this.currentSession}`));
            const data = await response.json();

            if (data.success) {
                this.renderReview(data.review);
                document.getElementById('review-modal').classList.remove('hidden');
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            console.error('Failed to load review:', error);
            alert('Failed to load conversation review: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderReview(review) {
        const content = document.getElementById('review-content');

        content.innerHTML = `
            <div class="review-section mb-8">
                <h3 class="text-lg font-bold text-gray-800 mb-4">📊 对话总结</h3>
                <div class="summary-stats grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="stat-card bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <div class="stat-number text-2xl font-bold text-blue-600">${review.summary.duration}</div>
                        <div class="stat-description text-sm text-blue-500">持续时间</div>
                    </div>
                    <div class="stat-card bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <div class="stat-number text-2xl font-bold text-green-600">${review.summary.totalTurns}</div>
                        <div class="stat-description text-sm text-green-500">对话轮数</div>
                    </div>
                    <div class="stat-card bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <div class="stat-number text-2xl font-bold text-purple-600">${review.summary.principlesApplied}</div>
                        <div class="stat-description text-sm text-purple-500">工具使用</div>
                    </div>
                    <div class="stat-card bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <div class="stat-number text-2xl font-bold text-yellow-600">${review.summary.userInterventions}</div>
                        <div class="stat-description text-sm text-yellow-500">指导次数</div>
                    </div>
                </div>
            </div>

            ${review.principlesUsed.length > 0 ? `
                <div class="review-section mb-8">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">🛠️ 使用的沟通工具</h3>
                    <div class="principles-list space-y-3">
                        ${review.principlesUsed.map(p => `
                            <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                                <div class="principle-name font-semibold text-purple-800">${this.formatToolName(p.toolName) || '未知工具'}</div>
                                <div class="principle-reason text-sm text-purple-600 mt-1">${p.reason || '未提供使用原因'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${review.insights.length > 0 ? `
                <div class="review-section mb-8">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">💡 关键洞察</h3>
                    <ul class="insights-list space-y-2">
                        ${review.insights.map(insight => `<li class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">• ${insight}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${review.recommendations.length > 0 ? `
                <div class="review-section">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">🎯 改进建议</h3>
                    <ul class="recommendations-list space-y-2">
                        ${review.recommendations.map(rec => `<li class="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">• ${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    closeReview() {
        document.getElementById('review-modal').classList.add('hidden');
    }

    showToolTooltip(e) {
        const tooltip = document.getElementById('tool-tooltip');
        const toolData = e.target.dataset;

        document.getElementById('tooltip-title').textContent = this.formatToolName(toolData.toolName);
        document.getElementById('tooltip-description').textContent = this.getToolDescription(toolData.toolName);
        document.getElementById('tooltip-reason').textContent = `使用原因：${toolData.reason}`;

        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        tooltip.classList.remove('hidden');
    }

    hideToolTooltip() {
        document.getElementById('tool-tooltip').classList.add('hidden');
    }

    getToolDescription(toolName) {
        const descriptions = {
            'FORD_method': '通过询问家庭、职业、休闲和梦想等话题来寻找对话切入点',
            'open_ended_question': '提出需要详细回答而非简单是非的开放式问题',
            'active_listening_reflection': '通过复述和反馈来表现积极倾听，让对方感受到被理解',
            'find_common_ground': '识别并强调双方的共同经历、兴趣或观点',
            'mirroring_technique': '模仿对方的沟通风格和语调，建立亲和感',
            'emotional_labeling': '识别并准确表达对话中的情感状态',
            'compliment_genuine': '给予真诚、具体、有意义的赞美',
            // 面试官工具
            'interview_questioning': '运用结构化问题和追问技巧深入了解候选人能力',
            'behavioral_assessment': '通过STAR方法评估候选人的过往行为和决策能力',
            'pressure_testing': '通过适度的压力问题测试候选人的抗压能力和思维敏捷性',
            'company_culture_evaluation': '评估候选人与公司价值观和文化的契合度',
            // 求职者工具
            'STAR_storytelling': '使用情况-任务-行动-结果的结构化方式回答行为问题',
            'value_demonstration': '通过具体案例和数据展示自己能为公司带来的价值',
            'weakness_reframing': '诚实地承认弱点并展示改进努力和学习态度',
            'strategic_questioning': '提出深思熟虑的问题展示对公司和职位的理解和兴趣',
            // 物业经理工具
            'delay_tactics': '使用流程、审批等理由推迟问题解决，避免当场做出承诺',
            'emotional_appeal': '强调物业工作的辛苦和不易，试图获得同情和理解',
            'procedural_deflection': '将问题归咎于制度、流程或合同条款，规避直接责任',
            'responsibility_shifting': '将问题归咎于业主、上级或第三方，避免承担责任',
            // 业主工具
            'evidence_based_argumentation': '使用照片、录音、文件等证据支持论点，增强说服力',
            'regulatory_citation': '引用相关法律法规、行业标准或合同条款来支持诉求',
            'logical_dismantling': '分析对方论述中的逻辑漏洞，用理性思维反驳不合理说法',
            'value_comparison': '通过对比同类服务的价格和质量，突出现有服务的不合理性'
        };
        return descriptions[toolName] || '沟通技巧';
    }

    showToolDetail(toolElement) {
        const toolData = toolElement.dataset;
        const toolName = toolData.toolName;
        const reason = toolData.reason;
        const application = toolData.application;

        // Use the new header tool display instead of the old modal
        this.showHeaderToolDetail(toolName, reason, application);
    }

    showToolSelectionNotification(toolName, sender) {
        // Clear existing timeout
        if (this.toolDetailTimeout) {
            clearTimeout(this.toolDetailTimeout);
        }

        const agentName = this.getAgentDisplayName(sender);

        // Update header tool content with "selecting" state
        document.getElementById('header-tool-name').textContent = this.formatToolName(toolName);
        document.getElementById('header-tool-description').textContent = this.getToolDescription(toolName);
        document.getElementById('header-tool-reason').textContent = `${agentName} 正在使用此工具...`;
        document.getElementById('header-tool-icon').textContent = this.getToolIcon(toolName);

        // Show with smooth transition
        const headerToolEl = document.getElementById('header-tool-display');
        headerToolEl.classList.remove('hidden');
        headerToolEl.style.position = 'relative';

        // Don't auto-hide - will be updated when tool_use event arrives with full details
    }

    showHeaderToolDetail(toolName, reason, application) {
        // Clear existing timeout
        if (this.toolDetailTimeout) {
            clearTimeout(this.toolDetailTimeout);
        }

        // Update header tool content
        document.getElementById('header-tool-name').textContent = this.formatToolName(toolName);
        document.getElementById('header-tool-description').textContent = this.getToolDescription(toolName);
        document.getElementById('header-tool-reason').textContent = `使用原因：${reason || '未提供具体原因'}`;
        document.getElementById('header-tool-icon').textContent = this.getToolIcon(toolName);

        // Show with smooth transition
        const headerToolEl = document.getElementById('header-tool-display');
        headerToolEl.classList.remove('hidden');
        headerToolEl.style.position = 'relative';

        // Auto-hide after 5 seconds
        this.toolDetailTimeout = setTimeout(() => {
            this.hideHeaderToolDetail();
        }, 5000);
    }

    hideHeaderToolDetail() {
        // Clear timeout
        if (this.toolDetailTimeout) {
            clearTimeout(this.toolDetailTimeout);
            this.toolDetailTimeout = null;
        }

        // Hide with smooth transition
        const headerToolEl = document.getElementById('header-tool-display');
        headerToolEl.classList.add('hidden');
    }

    hideToolDetail() {
        document.getElementById('tool-detail-display').classList.add('hidden');
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        overlay.querySelector('p').textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    handleConnectionError(error) {
        console.error('Connection error:', error);
        this.hideLoading();

        // Show reconnection option
        if (confirm('Connection lost. Would you like to try reconnecting?')) {
            if (this.currentSession) {
                this.continueConversation();
            } else {
                location.reload();
            }
        }
    }

    // Custom scenario methods
    async showCustomScenarioModal() {
        // Hide scenario modal
        document.getElementById('scenario-modal').classList.add('hidden');

        // Show custom scenario modal
        document.getElementById('custom-scenario-modal').classList.remove('hidden');

        // Load available tools
        await this.loadToolsForCustomScenario();
    }

    hideCustomScenarioModal() {
        // Hide custom scenario modal
        document.getElementById('custom-scenario-modal').classList.add('hidden');

        // Show scenario modal
        document.getElementById('scenario-modal').classList.remove('hidden');

        // Clear form
        this.clearCustomScenarioForm();
    }

    async loadToolsForCustomScenario() {
        try {
            document.getElementById('custom-scenario-loading').classList.remove('hidden');

            const response = await fetch(getApiUrl('/api/scenarios/tools/list'));
            const data = await response.json();

            if (data.success) {
                this.renderToolCheckboxes(data.tools);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Failed to load tools:', error);
            alert('Failed to load communication tools: ' + error.message);
        } finally {
            document.getElementById('custom-scenario-loading').classList.add('hidden');
        }
    }

    renderToolCheckboxes(tools) {
        const agent1ToolsEl = document.getElementById('agent1-tools');
        const agent2ToolsEl = document.getElementById('agent2-tools');

        const createCheckboxHTML = (tool, agentId) => `
            <div class="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                <input type="checkbox"
                       id="${agentId}-${tool.name}"
                       name="${agentId}-tools"
                       value="${tool.name}"
                       class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <div class="flex-1">
                    <label for="${agentId}-${tool.name}" class="block text-sm font-medium text-gray-700 cursor-pointer">
                        <span class="mr-2">${tool.icon}</span>${tool.name}
                    </label>
                    <p class="text-xs text-gray-500 mt-1">${tool.description}</p>
                    <p class="text-xs text-blue-600 mt-1 font-mono">${tool.example}</p>
                </div>
            </div>
        `;

        agent1ToolsEl.innerHTML = tools.map(tool => createCheckboxHTML(tool, 'agent1')).join('');
        agent2ToolsEl.innerHTML = tools.map(tool => createCheckboxHTML(tool, 'agent2')).join('');
    }

    clearCustomScenarioForm() {
        document.getElementById('agent1-name').value = '';
        document.getElementById('agent1-role').value = '';
        document.getElementById('agent1-content').value = '';
        document.getElementById('agent2-name').value = '';
        document.getElementById('agent2-role').value = '';
        document.getElementById('agent2-content').value = '';

        // Clear tool selections
        document.querySelectorAll('#agent1-tools input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('#agent2-tools input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    validateCustomScenarioForm() {
        const agent1Name = document.getElementById('agent1-name').value.trim();
        const agent1Role = document.getElementById('agent1-role').value.trim();
        const agent1Content = document.getElementById('agent1-content').value.trim();
        const agent2Name = document.getElementById('agent2-name').value.trim();
        const agent2Role = document.getElementById('agent2-role').value.trim();
        const agent2Content = document.getElementById('agent2-content').value.trim();

        if (!agent1Name || !agent1Role || !agent1Content) {
            alert('请填写角色一的所有信息');
            return false;
        }

        if (!agent2Name || !agent2Role || !agent2Content) {
            alert('请填写角色二的所有信息');
            return false;
        }

        return true;
    }

    getSelectedTools(agentId) {
        const checkboxes = document.querySelectorAll(`#${agentId}-tools input[type="checkbox"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    async startCustomScenario() {
        try {
            // Validate form
            if (!this.validateCustomScenarioForm()) {
                return;
            }

            this.showLoading('Creating custom scenario...');

            // Collect form data
            const customScenario = {
                agents: {
                    'Agent 1': {
                        name: document.getElementById('agent1-name').value.trim(),
                        role: document.getElementById('agent1-role').value.trim(),
                        content: document.getElementById('agent1-content').value.trim(),
                        tools: this.getSelectedTools('agent1')
                    },
                    'Agent 2': {
                        name: document.getElementById('agent2-name').value.trim(),
                        role: document.getElementById('agent2-role').value.trim(),
                        content: document.getElementById('agent2-content').value.trim(),
                        tools: this.getSelectedTools('agent2')
                    }
                }
            };

            // Hide custom scenario modal and show main interface
            document.getElementById('custom-scenario-modal').classList.add('hidden');
            document.getElementById('main-interface').classList.remove('hidden');

            // Setup interface with custom scenario data
            this.setupInterface({
                name: '自定义场景',
                description: '用户创建的自定义对话场景',
                agents: customScenario.agents
            });

            // Initialize conversation with custom scenario
            await this.initializeCustomConversation(customScenario);

        } catch (error) {
            console.error('Failed to start custom scenario:', error);
            alert('Failed to start custom scenario: ' + error.message);

            // Reset UI state on error
            document.getElementById('custom-scenario-modal').classList.remove('hidden');
            document.getElementById('main-interface').classList.add('hidden');
            this.hideLoading();
        }
    }

    async initializeCustomConversation(customScenario) {
        try {
            console.log('🎭 Starting custom conversation with scenario:', customScenario);
            this.showLoading('Initializing custom conversation...');

            const data = {
                customScenario: customScenario,
                action: 'start'
            };

            this.startSSEConnection(data);
        } catch (error) {
            console.error('Failed to initialize custom conversation:', error);
            this.hideLoading();
            throw error;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        new ConversationApp();
    }, 100);
});