/**
 * 自定义模型配置
 *
 * 使用方法：
 * 1. 在 CUSTOM_MODELS 数组中添加你的模型
 * 2. 重启服务器后即可在选择器中看到新模型
 */
export interface CustomModelConfig {
    modelId: string;
    name: string;
    description?: string;
    provider?: string;
    baseUrl?: string;
    apiKey?: string;
}
/**
 * 自定义模型列表
 * 这些模型会合并到 Agent SDK 返回的模型列表中
 */
export declare const CUSTOM_MODELS: CustomModelConfig[];
/**
 * 环境变量模型配置
 * 通过环境变量配置的模型会自动添加
 */
export declare function getEnvModels(): CustomModelConfig[];
/**
 * 获取所有可用模型（合并 SDK 模型和自定义模型）
 */
export declare function getAllCustomModels(): CustomModelConfig[];
declare const _default: {
    CUSTOM_MODELS: CustomModelConfig[];
    getEnvModels: typeof getEnvModels;
    getAllCustomModels: typeof getAllCustomModels;
};
export default _default;
