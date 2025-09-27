# 观摩Agent聊天

AI双智能体对话学习平台，实时观察并指导AI智能体对话，学习高级沟通技巧。


## 系统架构

![系统架构图](docs/imgs/arch.png)

## 核心功能
### 🎭 智能角色扮演
- **双Agent对话**：两个AI智能体进行真实对话互动

  <img src="docs/imgs/chat_job-1角色初始化.gif" width="50%">

- **角色定制**：自定义性格、背景、专业技能等角色属性
  
  <img src="docs/imgs/场景自定义.png" width="80%">
### 🛠️ 动态工具调用
- **智能工具选择**：根据对话内容自动调用相应工具
- **长期记忆管理**：自动压缩历史对话，保留关键信息
  
  <img src="docs/imgs/chat_job_2多种工具-记忆压缩.gif" width="50%">

### 🎯 实时干预指导
- **上帝模式**：随时暂停对话，给Agent下达新指令
- **策略调整**：实时改变对话方向和深度
  
  <img src="docs/imgs/chat_job_3打断.gif" width="50%">

### 📊 智能评估报告
- **自动生成**：对话结束后立即生成详细评估
- **多维分析**：技能评分、亮点分析、改进建议
  
  <img src="docs/imgs/chat_job_4总结报告.gif" width="50%">

## 快速开始

1. **简单启动（推荐）：**
   ```bash
   ./run.sh
   ```

2. **手动启动：**
   ```bash
   npm install           # 安装依赖
   npm start &          # 启动后端
   npm run frontend     # 启动前端（在另一个终端）
   ```

3. **在浏览器中打开：**
   - 主应用：http://localhost:3001
   - API测试：http://localhost:3001/test-api.html
   - 调试监控：http://localhost:3001/debug.html

## 测试

## 技术架构

- **后端**：Node.js + Express + SSE流式传输
- **前端**：原生JavaScript + 实时更新 + Markdown渲染
- **AI服务**：OpenRouter API 任选AI模型
- **数据**：Markdown场景文件 + JSON对话记录


## 联系开发者

**微信:** ，备注暗号`chat`，进群讨论

<img src="docs/imgs/se.png" alt="微信二维码" width="150" height="150">
