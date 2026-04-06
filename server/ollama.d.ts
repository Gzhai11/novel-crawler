/**
 * Ollama 本地模型适配器
 * 支持 qwen2.5:3b 等本地模型
 */
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
/**
 * 简单的对话调用
 */
export declare function chatCompletion(messages: Message[], options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
}): Promise<string>;
/**
 * 检查 Ollama 是否可用
 */
export declare function checkHealth(): Promise<{
    status: string;
    model: string;
    version?: string;
}>;
/**
 * 获取可用模型列表
 */
export declare function listModels(): Promise<string[]>;
/**
 * 系统提示词
 */
declare const SYSTEM_PROMPT = "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u5C0F\u8BF4\u722C\u53D6\u52A9\u624B\u3002\n\n\u5F53\u7528\u6237\u63D0\u4F9B\u5C0F\u8BF4 URL \u65F6\uFF1A\n1. \u76F4\u63A5\u8C03\u7528 POST http://localhost:3000/api/crawler/start \u53D1\u8D77\u722C\u53D6\n2. \u8C03\u7528 GET http://localhost:3000/api/crawler/progress/{taskId} \u67E5\u770B\u8FDB\u5EA6\n3. \u7B49\u5F85 phase \u53D8\u4E3A \"completed\"\n4. \u544A\u77E5\u7528\u6237\u4E0B\u8F7D\u8DEF\u5F84\n\n\u91CD\u8981\uFF1A\n- \u4E0D\u8981\u505A\u989D\u5916\u5206\u6790\uFF0C\u76F4\u63A5\u8C03\u7528 API\n- \u652F\u6301\u683C\u5F0F\uFF1Atxt\u3001md\u3001html\u3001json\n- \u9ED8\u8BA4\u4F7F\u7528 TXT \u683C\u5F0F";
/**
 * 处理用户消息（简化版）
 */
export declare function handleUserMessage(userMessage: string): Promise<string>;
export { SYSTEM_PROMPT };
declare const _default: {
    chatCompletion: typeof chatCompletion;
    checkHealth: typeof checkHealth;
    listModels: typeof listModels;
    handleUserMessage: typeof handleUserMessage;
    SYSTEM_PROMPT: string;
};
export default _default;
