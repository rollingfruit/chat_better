const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

class OpenRouterClient {
  constructor(apiKey, defaultModel = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async createChatStream(messages, tools = null, model = null) {
    const requestBody = {
      model: model || this.defaultModel,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Dual Agent Conversation Platform'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
      }

      return response;
    } catch (error) {
      console.error('OpenRouter API request failed:', error);
      throw error;
    }
  }

  async createChat(messages, model = null) {
    const requestBody = {
      model: model || this.defaultModel,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 500
    };

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Dual Agent Conversation Platform'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API request failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await this.createChatStream([
        { role: 'user', content: 'Hello, please respond with just "OK" to test the connection.' }
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let testResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                testResponse += parsed.choices[0].delta.content;
              }
            } catch (e) {
              // Ignore parsing errors for test
            }
          }
        }
      }

      return { success: true, response: testResponse.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = OpenRouterClient;