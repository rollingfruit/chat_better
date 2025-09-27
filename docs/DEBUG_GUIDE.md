# 调试指南 - Agent 2 不回应问题

## 🐛 问题分析

根据用户反馈，Agent 1 输出回复后，Agent 2 没有继续显示内容。从错误日志看到以下问题：

1. **SSE 解析错误**: `Failed to parse SSE message`
2. **DOM 错误**: `Cannot read properties of undefined (reading 'contains')`
3. **对话中断**: Agent 2 没有自动继续对话

## 🔧 已实施的修复

### 1. SSE 消息解析优化
```javascript
// 修复前
const data = JSON.parse(line.slice(6));

// 修复后
const dataStr = line.slice(6).trim();
if (dataStr === '[DONE]' || dataStr === '') continue;
const data = JSON.parse(dataStr);
```

### 2. DOM 安全检查
```javascript
// 修复前
if (e.target.classList.contains('tool-indicator')) {

// 修复后
if (e.target && e.target.classList && e.target.classList.contains('tool-indicator')) {
```

### 3. 后端调试日志
添加了详细的调试信息：
```
🎭 Starting conversation for Agent 2
📝 Session history length: X
🎯 User hint: none
💬 Built X messages for Agent 2
📡 Calling OpenRouter API for Agent 2...
✅ OpenRouter response received for Agent 2
```

### 4. 自动继续逻辑增强
```javascript
case 'turn_end':
    console.log(`🔄 Turn ended: ${data.sender} → ${data.nextTurn}`);
    setTimeout(() => {
        if (!this.isPaused && this.currentSession) {
            console.log(`🚀 Auto-continuing conversation for ${data.nextTurn}`);
            this.continueConversation();
        }
    }, 2000);
```

## 🔍 调试方法

### 方法1: 使用调试监控器
1. 打开 http://localhost:3001/debug.html
2. 点击 "Connect to Stream"
3. 在另一个标签页打开主应用
4. 开始对话并观察调试信息

### 方法2: 浏览器控制台
1. 打开开发者工具 (F12)
2. 查看 Console 标签页
3. 寻找以下关键日志：
   - `🔄 Loading scenarios from:`
   - `🔄 Turn ended: Agent 1 → Agent 2`
   - `🚀 Auto-continuing conversation for Agent 2`

### 方法3: 后端终端日志
观察运行服务器的终端，寻找：
```
🎭 Starting conversation for Agent 2
📡 Calling OpenRouter API for Agent 2...
✅ OpenRouter response received for Agent 2, status: 200
```

## 🚨 常见问题排查

### 问题1: Agent 2 完全不回应
**检查步骤：**
1. 确认 `🔄 Turn ended` 日志出现
2. 确认 `🚀 Auto-continuing` 日志出现
3. 确认后端 `🎭 Starting conversation for Agent 2` 日志
4. 检查 OpenRouter API 调用是否成功

### 问题2: SSE 连接中断
**检查步骤：**
1. 浏览器控制台是否有网络错误
2. 后端是否显示 API 错误
3. OPENROUTER_API_KEY 是否正确配置

### 问题3: 工具调用格式错误
**检查步骤：**
1. 寻找 `tool_use_id` 相关错误
2. 检查消息历史格式是否正确
3. 确认工具调用ID匹配

## 🛠️ 立即可用的调试工具

### 1. 主应用
- **地址**: http://localhost:3001
- **功能**: 完整的对话界面，可以直接测试问题

### 2. API 测试页面
- **地址**: http://localhost:3001/test-api.html
- **功能**: 测试后端 API 连接状态

### 3. 调试监控器
- **地址**: http://localhost:3001/debug.html
- **功能**: 实时监控 SSE 事件和系统状态

### 4. 连接测试脚本
```bash
npm test                    # 快速连接测试
node test-connection.js     # 详细连接测试
```

## 🔄 当前状态

✅ **已修复的问题:**
- SSE 消息解析错误
- DOM 访问安全检查
- 中文对话强制实现
- 工具调用格式错误

🔄 **正在测试的功能:**
- Agent 2 自动继续逻辑
- 实时调试监控
- 错误恢复机制

⏳ **待确认的问题:**
- Agent 2 是否能正常接收 Agent 1 的消息
- OpenRouter API 调用是否稳定
- 对话历史是否正确构建

## 📞 下一步调试建议

1. **先运行基础测试:**
   ```bash
   npm test
   curl -s http://localhost:3000/api/health
   ```

2. **开启调试模式:**
   - 打开 debug.html 页面
   - 在控制台中启用详细日志
   - 观察完整的对话流程

3. **逐步测试:**
   - 选择简单场景（如技术聚会）
   - 等待 Agent 1 完成回复
   - 观察是否出现 "等待 Agent 2 回应..."
   - 检查 2 秒后是否自动继续

4. **记录问题:**
   - 截图/复制控制台错误
   - 记录后端终端日志
   - 导出调试监控器的日志