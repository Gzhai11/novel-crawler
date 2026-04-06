/**
 * 自定义模型配置
 * 
 * 使用方法：
 * 1. 在 CUSTOM_MODELS 数组中添加你的模型
 * 2. 重启服务器后即可在选择器中看到新模型
 */

export interface CustomModelConfig {
  modelId: string;      // 模型 ID（调用时使用）
  name: string;         // 显示名称
  description?: string; // 描述
  provider?: string;    // 提供商（如 'openai', 'anthropic', 'ollama'）
  baseUrl?: string;     // API 地址（可选，用于自定义端点）
  apiKey?: string;      // API Key（可选，建议通过环境变量设置）
}

/**
 * 自定义模型列表
 * 这些模型会合并到 Agent SDK 返回的模型列表中
 */
export const CUSTOM_MODELS: CustomModelConfig[] = [
  // 示例：添加 OpenAI 模型
  // {
  //   modelId: 'gpt-4o',
  //   name: 'GPT-4o',
  //   description: 'OpenAI GPT-4o',
  //   provider: 'openai',
  //   baseUrl: 'https://api.openai.com/v1',
  // },
  
  // 示例：添加本地 Ollama 模型
  // {
  //   modelId: 'llama3:latest',
  //   name: 'Llama 3',
  //   description: '本地 Ollama Llama 3 模型',
  //   provider: 'ollama',
  //   baseUrl: 'http://localhost:11434/v1',
  // },
  
  // 示例：添加其他兼容 OpenAI API 的模型
  // {
  //   modelId: 'deepseek-chat',
  //   name: 'DeepSeek Chat',
  //   description: 'DeepSeek 对话模型',
  //   provider: 'deepseek',
  //   baseUrl: 'https://api.deepseek.com/v1',
  // },
];

/**
 * 环境变量模型配置
 * 通过环境变量配置的模型会自动添加
 */
export function getEnvModels(): CustomModelConfig[] {
  const models: CustomModelConfig[] = [];
  
  // Ollama 配置
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  const ollamaModel = process.env.OLLAMA_MODEL;
  if (ollamaUrl && ollamaModel) {
    models.push({
      modelId: ollamaModel,
      name: `Ollama: ${ollamaModel}`,
      description: '本地 Ollama 模型',
      provider: 'ollama',
      baseUrl: ollamaUrl,
    });
  }
  
  // OpenAI 配置
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
  if (openaiKey) {
    models.push({
      modelId: openaiModel,
      name: `OpenAI: ${openaiModel}`,
      description: 'OpenAI 模型',
      provider: 'openai',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }
  
  // 自定义模型（通过环境变量）
  const customModelId = process.env.CUSTOM_MODEL_ID;
  const customModelName = process.env.CUSTOM_MODEL_NAME;
  const customBaseUrl = process.env.CUSTOM_MODEL_BASE_URL;
  if (customModelId && customBaseUrl) {
    models.push({
      modelId: customModelId,
      name: customModelName || customModelId,
      description: '自定义模型',
      provider: 'custom',
      baseUrl: customBaseUrl,
    });
  }
  
  return models;
}

/**
 * 获取所有可用模型（合并 SDK 模型和自定义模型）
 */
export function getAllCustomModels(): CustomModelConfig[] {
  return [...CUSTOM_MODELS, ...getEnvModels()];
}

export default {
  CUSTOM_MODELS,
  getEnvModels,
  getAllCustomModels,
};