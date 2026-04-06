/**
 * 自定义模型配置
 *
 * 使用方法：
 * 1. 在 CUSTOM_MODELS 数组中添加你的模型
 * 2. 重启服务器后即可在选择器中看到新模型
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * 自定义模型列表
 * 这些模型会合并到 Agent SDK 返回的模型列表中
 */
export var CUSTOM_MODELS = [
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
export function getEnvModels() {
    var models = [];
    // Ollama 配置
    var ollamaUrl = process.env.OLLAMA_BASE_URL;
    var ollamaModel = process.env.OLLAMA_MODEL;
    if (ollamaUrl && ollamaModel) {
        models.push({
            modelId: ollamaModel,
            name: "Ollama: ".concat(ollamaModel),
            description: '本地 Ollama 模型',
            provider: 'ollama',
            baseUrl: ollamaUrl,
        });
    }
    // OpenAI 配置
    var openaiKey = process.env.OPENAI_API_KEY;
    var openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
    if (openaiKey) {
        models.push({
            modelId: openaiModel,
            name: "OpenAI: ".concat(openaiModel),
            description: 'OpenAI 模型',
            provider: 'openai',
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        });
    }
    // 自定义模型（通过环境变量）
    var customModelId = process.env.CUSTOM_MODEL_ID;
    var customModelName = process.env.CUSTOM_MODEL_NAME;
    var customBaseUrl = process.env.CUSTOM_MODEL_BASE_URL;
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
export function getAllCustomModels() {
    return __spreadArray(__spreadArray([], CUSTOM_MODELS, true), getEnvModels(), true);
}
export default {
    CUSTOM_MODELS: CUSTOM_MODELS,
    getEnvModels: getEnvModels,
    getAllCustomModels: getAllCustomModels,
};
