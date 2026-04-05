/**
 * Ollama 本地模型适配器
 * 支持 qwen2.5:3b 等本地模型
 */

import { Configuration, OpenAIApi } from 'openai';
import * as fs from 'fs';

// Ollama 配置
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// 初始化 OpenAI 客户端（兼容 Ollama）
const configuration = new Configuration({
  basePath: OLLAMA_BASE_URL,
  apiKey: 'ollama', // Ollama 不需要真实 API Key
});

const openai = new OpenAIApi(configuration);

// 消息格式转换
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OllamaResponse {
  content: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

/**
 * 简单的对话调用
 */
export async function chatCompletion(
  messages: Message[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
  }
): Promise<string> {
  const { temperature = 0.7, maxTokens = 4096, stream = false } = options || {};

  try {
    if (stream) {
      // 流式响应
      const response = await openai.createChatCompletion(
        {
          model: OLLAMA_MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      let fullContent = '';
      const stream = response.data as any;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: any) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                const content = data.choices[0].delta.content;
                fullContent += content;
                options?.onChunk?.(content);
              }
            }
          }
        });

        stream.on('end', () => {
          resolve(fullContent);
        });

        stream.on('error', (err: Error) => {
          reject(err);
        });
      });
    } else {
      // 非流式响应
      const response = await openai.createChatCompletion({
        model: OLLAMA_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      return response.data.choices[0]?.message?.content || '';
    }
  } catch (error: any) {
    console.error('[Ollama] API 错误:', error.message);
    throw new Error(`Ollama 调用失败: ${error.message}`);
  }
}

/**
 * 检查 Ollama 是否可用
 */
export async function checkHealth(): Promise<{ status: string; model: string; version?: string }> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
    });

    if (!response.ok) {
      return { status: 'error', model: OLLAMA_MODEL };
    }

    const data = await response.json();
    const models = data.models || [];

    return {
      status: 'ok',
      model: OLLAMA_MODEL,
      version: models.find((m: any) => m.name === OLLAMA_MODEL)?.modified_at,
    };
  } catch (error: any) {
    return {
      status: 'error',
      model: OLLAMA_MODEL,
    };
  }
}

/**
 * 获取可用模型列表
 */
export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.models || []).map((m: any) => m.name);
  } catch (error) {
    return [];
  }
}

/**
 * 系统提示词
 */
const SYSTEM_PROMPT = `你是一个专业的小说爬取助手。

当用户提供小说 URL 时：
1. 直接调用 POST http://localhost:3000/api/crawler/start 发起爬取
2. 调用 GET http://localhost:3000/api/crawler/progress/{taskId} 查看进度
3. 等待 phase 变为 "completed"
4. 告知用户下载路径

重要：
- 不要做额外分析，直接调用 API
- 支持格式：txt、md、html、json
- 默认使用 TXT 格式`;

/**
 * 处理用户消息（简化版）
 */
export async function handleUserMessage(userMessage: string): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  return chatCompletion(messages);
}

export default {
  chatCompletion,
  checkHealth,
  listModels,
  handleUserMessage,
};
