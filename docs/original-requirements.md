

## **双 Agent 对话学习平台 - 开发文档 (v2.0)**

### **1.0 项目概述**

#### **1.1 项目目标**

本项目旨在创建一个高级的、交互式的双 Agent 聊天模拟网站。用户通过观察、引导和复盘两个 AI Agent（“用户视角”与“陌生人”）的对话，学习和内化高级沟通技巧与策略。

#### **1.2 核心特性**

1.  **多场景选择 (Multi-Scenario)**: 用户可以从多个预设的社交场景（如技术会议、咖啡馆偶遇、职场破冰）中选择一个开始模拟，每个场景都有独特的角色和对话目标。
2.  **ReAct & 工具调用 (ReAct & Tool Use)**: Agent 基于 ReAct (Reason-Act) 模式进行思考和行动。Agent 可以决定调用预定义的“沟通工具”（如 F.O.R.D. 法则），并在界面上进行可视化展示。
3.  **流式输出与 SSE (Streaming with SSE)**: Agent 的回复将以打字机效果逐字流式传输到前端，提供更真实的实时感。这通过后端的 Server-Sent Events (SSE) 实现。
4.  **用户实时干预 (User Intervention)**: 用户可以随时暂停对话，为“用户视角”的 Agent 提供文本提示，以引导对话走向。
5.  **对话复盘 (Conversation Review)**: 对话结束后，系统会生成一份复盘报告，分析对话的关键指标、高光时刻、以及用户干预的影响。

#### **1.3 技术栈**

  * **前端**: HTML, CSS, JavaScript (Vanilla JS 或轻量级框架)
  * **后端**: Node.js + Express
  * **LLM 服务**: OpenRouter (支持流式和工具调用的模型，如 `anthropic/claude-3.5-sonnet`)
  * **数据存储**: Markdown 文件 (用于场景和角色定义), JSON (用于对话历史和复盘数据)
  * **实时通信**: Server-Sent Events (SSE)

-----

### **2.0 系统架构**

系统由四个核心部分组成：前端客户端、Node.js 后端、OpenRouter LLM 服务和数据文件。

```mermaid
graph TD
    A[前端客户端 (Browser)]
    B[Node.js 后端 (Express)]
    C[OpenRouter API]
    D[数据存储 (Markdown/JSON)]

    A -- HTTP Request --> B;
    B -- 读取 --> D[场景/角色定义 .md];

    subgraph "对话进行中"
        A -- (1) POST /api/chat-stream (发起对话/发送提示) --> B;
        B -- (2) SSE Connection --> A;
        B -- (3) POST /api/chat/completions (stream:true) --> C;
        C -- (4) Stream Chunks --> B;
        B -- (5)
        B -- (6) Stream Parsed Data via SSE --> A;
    end
    
    A -- (7) GET /api/review/:sessionId --> B;
    B -- 读取 --> D[对话历史/复盘 .json];
    B -- 返回复盘数据 --> A;


    style B fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px
```

**架构流程说明**:

1.  前端向后端发起一个对话流请求。
2.  后端与前端建立一个持久化的 SSE 连接。
3.  后端构建好 Prompt（包含历史、角色、工具定义）后，向 OpenRouter 发起一个**流式** API 请求。
4.  OpenRouter 开始返回数据流 (chunks)。
5.  后端**实时解析**这些数据块，区分是内容增量 (delta.content) 还是工具调用 (delta.tool\_calls)。
6.  后端将解析后的结构化数据（如 `{type: 'token', value: '你'}` 或 `{type: 'tool_use', toolName: 'F.O.R.D.'}`）通过 SSE 通道推送给前端。
7.  前端根据接收到的数据类型，动态渲染界面（逐字显示或展示工具图标）。
8.  对话结束后，前端可以通过唯一会话 ID 请求复盘数据。

-----

### **3.0 数据结构与模型**

#### **3.1 场景定义 (`/scenarios/*.md`)**

每个场景是一个文件夹，包含两个角色的 Markdown 文件。

```
/scenarios
|-- /tech_meetup
|   |-- agent_1.md
|   |-- agent_2.md
|-- /coffee_shop
|   |-- agent_1.md
|   |-- agent_2.md
```

#### **3.2 角色定义 (`agent_1.md`)**

使用 YAML Front Matter 格式。

```markdown
---
id: "tech_meetup_user"
name: "小张"
role: "用户视角 (Agent 1)"
avatar: "user_avatar.png"
---

# 背景与性格
你是一名软件工程师，性格偏内向但渴望学习。今天是你第一次参加线下技术分享会。

# 对话目标
1.  主动与至少一位陌生人建立联系。
2.  尝试了解对方的技术背景和兴趣点。
3.  在对话中至少应用一次 "开放式问题" 原则。
```

#### **3.3 工具定义 (Backend-defined JSON)**

在后端定义，并在每次调用 LLM 时注入到 `tools` 参数中。

```json
[
  {
    "type": "function",
    "function": {
      "name": "apply_conversational_principle",
      "description": "当对话陷入僵局或需要深化时，应用一个指定的沟通法则或技巧。",
      "parameters": {
        "type": "object",
        "properties": {
          "principle_name": {
            "type": "string",
            "description": "要应用的沟通法则名称",
            "enum": ["FORD_method", "open_ended_question", "active_listening_reflection"]
          },
          "reason": {
            "type": "string",
            "description": "解释为什么此时选择应用这个法则。"
          }
        },
        "required": ["principle_name", "reason"]
      }
    }
  }
]
```

#### **3.4 对话状态 (Backend Memory)**

服务器为每个活动会话维护一个状态对象。

```json
{
  "sessionId": "unique_session_id_123",
  "scenarioId": "tech_meetup",
  "agents": { "Agent 1": { ... }, "Agent 2": { ... } },
  "history": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "你好啊！" },
    { "role": "assistant", "tool_calls": [ ... ] },
    { "role": "tool", "tool_call_id": "...", "content": "..."}
  ],
  "turn": "Agent 1",
  "isPaused": false,
  "userHint": null,
  "reviewData": {
    "startTime": "timestamp",
    "turnCount": 0,
    "userInterventions": 0,
    "principlesUsed": []
  }
}
```

#### **3.5 SSE 数据包格式**

后端通过 SSE 发送 JSON 字符串。前端需解析。

```
// Token增量
data: {"type": "token", "sender": "Agent 1", "value": "我"}
data: {"type": "token", "sender": "Agent 1", "value": "是"}

// 思考过程开始
data: {"type": "thought_start", "sender": "Agent 1"}

// 思考过程 Token
data: {"type": "thought_token", "sender": "Agent 1", "value": "对方..."}

// 工具使用可视化事件
data: {"type": "tool_visualization", "sender": "Agent 1", "toolName": "FORD_method", "reason": "我想了解对方的背景。"}

// 消息结束
data: {"type": "message_end", "sender": "Agent 1", "fullMessage": "我是小张。"}

// 对话结束
data: {"type": "session_end", "sessionId": "unique_session_id_123"}
```

-----

### **4.0 后端设计 (Node.js)**

#### **4.1 API 端点 (Endpoints)**

| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| `GET` | `/api/scenarios` | 获取所有可用的场景列表（ID 和名称）。 |
| `POST` | `/api/chat-stream` | **核心接口**。建立 SSE 连接以开始或继续对话。Request Body 包含 `scenarioId`（首次）或 `sessionId` 及 `userHint`（后续）。 |
| `GET` | `/api/review/:sessionId` | 获取指定会话的复盘数据。 |

#### **4.2 SSE 流式处理核心逻辑 (`/api/chat-stream`)**

1.  **初始化**:
      * 设置 HTTP Header 为 `text/event-stream`。
      * 为该会话创建一个对话状态对象。
2.  **调用 LLM**:
      * 构建 `messages` 数组和 `tools` 定义。
      * 使用 `fetch` 向 OpenRouter 发起流式请求。
3.  **循环读取 Stream**:
      * 使用 `stream.body.getReader()` 循环读取数据块。
      * 解码 `chunk` 并按行分割。
4.  **解析与推送**:
      * 遍历每一行，解析 `data:` 后的 JSON。
      * **如果是内容增量 (`delta.content`)**: 通过 SSE 发送 `{"type": "token", ...}`。
      * **如果是工具调用增量 (`delta.tool_calls`)**: 在后端累积 `toolCalls` 对象。不立即推送。
      * **如果 `finish_reason` 是 `tool_calls`**:
          * 标记工具调用开始。通过 SSE 发送 `{"type": "tool_visualization", ...}` 事件，以便前端可以立即显示图标。
          * **在后端执行工具逻辑**（注意：此处的“执行”可能只是生成一条描述性文本，如 `{"role": "tool", "content": "Tool 'FORD_method' was applied to guide the next question."}`）。
          * 将原始的 `tool_calls` 和工具执行结果的 `tool` 消息都追加到 `history` 中。
          * **再次调用 OpenRouter LLM**，传入更新后的 `history`，让 LLM 根据工具执行结果生成最终回复。
          * 继续从此新的 stream 中读取并推送 `token`。
      * **如果 `finish_reason` 是 `stop`**: 发送 `{"type": "message_end", ...}`，然后切换 `turn`，等待下一次触发。
5.  **连接管理**: 监听 `close` 事件，清理会话资源。

-----

### **5.0 前端设计**

#### **5.1 页面组件**

1.  **场景选择器 (Scenario Selector)**:
      * 应用启动时的模态框或初始页面。
      * 通过调用 `GET /api/scenarios` 动态加载场景列表。
2.  **聊天窗口 (Chat Window)**:
      * 对话消息的主显示区域。
      * 能够渲染来自不同 Agent 的消息气泡。
      * **能够处理流式 `token`**，将它们追加到最后一个消息气泡中，实现打字机效果。
      * **工具调用可视化**: 当收到 `tool_visualization` 事件时，在对应的消息气泡旁边渲染一个可交互的图标（如 📖）。鼠标悬停时，显示工具名称和使用原因。
3.  **控制面板 (Control Panel)**:
      * 包含“暂停/继续”按钮和“用户提示”输入框。
      * 管理 `isPaused` 状态。
4.  **对话复盘模态框 (Review Modal)**:
      * 当收到 `session_end` 事件时，显示一个“查看复盘”按钮。
      * 点击后，调用 `GET /api/review/:sessionId` 并展示复盘数据。

#### **5.2 客户端逻辑**

1.  **状态管理**: 维护一个客户端状态对象，包含 `currentSessionId`, `isPaused`, `isThinking` 等。
2.  **SSE 客户端**:
      * 使用 `const eventSource = new EventSource('/api/chat-stream?sessionId=...')` 来创建和管理连接。
      * `eventSource.onmessage`: 注册核心监听器，处理从后端收到的各类 SSE 数据包。
      * 根据 `data.type` 更新相应的 UI 组件（追加文字、显示图标、更新状态等）。
      * `eventSource.onerror`: 处理连接错误和重连逻辑。

-----

### **6.0 功能详述**

#### **6.1 对话复盘 (Conversation Review)**

  * **收集数据**: 后端在对话过程中持续更新 `reviewData` 对象（开始/结束时间、总轮次、用户干预次数、使用的工具列表）。
  * **展示内容**:
      * **关键指标**: 对话时长、总轮次。
      * **用户影响**: 显示用户干预的次数。可以高亮显示用户提示后的那轮对话，让用户对比效果。
      * **策略应用**: 以时间线或列表形式展示所有被调用的沟通法则，例如：“第 3 轮: 应用了 F.O.R.D. 法则”。
      * **完整对话记录**: 提供可滚动的完整对话历史记录。

-----

### **7.0 部署与环境**

  * **环境变量**: 必须使用环境变量 (`.env` 文件) 来管理 `OPENROUTER_API_KEY` 等敏感信息。
  * **进程管理**: 在生产环境中，应使用 PM2 或类似的工具来管理 Node.js 进程。
  * **CORS**: 需要在 Express 中配置 CORS 策略, 后端dev启动后拉起前端。