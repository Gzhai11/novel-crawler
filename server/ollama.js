/**
 * Ollama 本地模型适配器
 * 支持 qwen2.5:3b 等本地模型
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import OpenAI from 'openai';
// Ollama 配置
var OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
var OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
// 初始化 OpenAI 客户端（兼容 Ollama）
var openai = new OpenAI({
    baseURL: OLLAMA_BASE_URL,
    apiKey: 'ollama', // Ollama 不需要真实 API Key
    dangerouslyAllowBrowser: true,
});
/**
 * 简单的对话调用
 */
export function chatCompletion(messages, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, temperature, _c, maxTokens, _d, stream, stream_2, fullContent, _e, stream_1, stream_1_1, chunk, content, e_1_1, response, error_1;
        var _f, e_1, _g, _h;
        var _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    _a = options || {}, _b = _a.temperature, temperature = _b === void 0 ? 0.7 : _b, _c = _a.maxTokens, maxTokens = _c === void 0 ? 4096 : _c, _d = _a.stream, stream = _d === void 0 ? false : _d;
                    _p.label = 1;
                case 1:
                    _p.trys.push([1, 18, , 19]);
                    if (!stream) return [3 /*break*/, 15];
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: OLLAMA_MODEL,
                            messages: messages.map(function (m) { return ({ role: m.role, content: m.content }); }),
                            temperature: temperature,
                            max_tokens: maxTokens,
                            stream: true,
                        })];
                case 2:
                    stream_2 = _p.sent();
                    fullContent = '';
                    _p.label = 3;
                case 3:
                    _p.trys.push([3, 8, 9, 14]);
                    _e = true, stream_1 = __asyncValues(stream_2);
                    _p.label = 4;
                case 4: return [4 /*yield*/, stream_1.next()];
                case 5:
                    if (!(stream_1_1 = _p.sent(), _f = stream_1_1.done, !_f)) return [3 /*break*/, 7];
                    _h = stream_1_1.value;
                    _e = false;
                    chunk = _h;
                    content = ((_k = (_j = chunk.choices[0]) === null || _j === void 0 ? void 0 : _j.delta) === null || _k === void 0 ? void 0 : _k.content) || '';
                    if (content) {
                        fullContent += content;
                        (_l = options === null || options === void 0 ? void 0 : options.onChunk) === null || _l === void 0 ? void 0 : _l.call(options, content);
                    }
                    _p.label = 6;
                case 6:
                    _e = true;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 14];
                case 8:
                    e_1_1 = _p.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 14];
                case 9:
                    _p.trys.push([9, , 12, 13]);
                    if (!(!_e && !_f && (_g = stream_1.return))) return [3 /*break*/, 11];
                    return [4 /*yield*/, _g.call(stream_1)];
                case 10:
                    _p.sent();
                    _p.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 13: return [7 /*endfinally*/];
                case 14: return [2 /*return*/, fullContent];
                case 15: return [4 /*yield*/, openai.chat.completions.create({
                        model: OLLAMA_MODEL,
                        messages: messages.map(function (m) { return ({ role: m.role, content: m.content }); }),
                        temperature: temperature,
                        max_tokens: maxTokens,
                    })];
                case 16:
                    response = _p.sent();
                    return [2 /*return*/, ((_o = (_m = response.choices[0]) === null || _m === void 0 ? void 0 : _m.message) === null || _o === void 0 ? void 0 : _o.content) || ''];
                case 17: return [3 /*break*/, 19];
                case 18:
                    error_1 = _p.sent();
                    console.error('[Ollama] API 错误:', error_1.message);
                    throw new Error("Ollama \u8C03\u7528\u5931\u8D25: ".concat(error_1.message));
                case 19: return [2 /*return*/];
            }
        });
    });
}
/**
 * 检查 Ollama 是否可用
 */
export function checkHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, models, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('http://localhost:11434/api/tags', {
                            method: 'GET',
                        })];
                case 1:
                    response = _b.sent();
                    if (!response.ok) {
                        return [2 /*return*/, { status: 'error', model: OLLAMA_MODEL }];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _b.sent();
                    models = data.models || [];
                    return [2 /*return*/, {
                            status: 'ok',
                            model: OLLAMA_MODEL,
                            version: (_a = models.find(function (m) { return m.name === OLLAMA_MODEL; })) === null || _a === void 0 ? void 0 : _a.modified_at,
                        }];
                case 3:
                    error_2 = _b.sent();
                    return [2 /*return*/, {
                            status: 'error',
                            model: OLLAMA_MODEL,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 获取可用模型列表
 */
export function listModels() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('http://localhost:11434/api/tags', {
                            method: 'GET',
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, (data.models || []).map(function (m) { return m.name; })];
                case 3:
                    error_3 = _a.sent();
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 系统提示词
 */
var SYSTEM_PROMPT = "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u5C0F\u8BF4\u722C\u53D6\u52A9\u624B\u3002\n\n\u5F53\u7528\u6237\u63D0\u4F9B\u5C0F\u8BF4 URL \u65F6\uFF1A\n1. \u76F4\u63A5\u8C03\u7528 POST http://localhost:3000/api/crawler/start \u53D1\u8D77\u722C\u53D6\n2. \u8C03\u7528 GET http://localhost:3000/api/crawler/progress/{taskId} \u67E5\u770B\u8FDB\u5EA6\n3. \u7B49\u5F85 phase \u53D8\u4E3A \"completed\"\n4. \u544A\u77E5\u7528\u6237\u4E0B\u8F7D\u8DEF\u5F84\n\n\u91CD\u8981\uFF1A\n- \u4E0D\u8981\u505A\u989D\u5916\u5206\u6790\uFF0C\u76F4\u63A5\u8C03\u7528 API\n- \u652F\u6301\u683C\u5F0F\uFF1Atxt\u3001md\u3001html\u3001json\n- \u9ED8\u8BA4\u4F7F\u7528 TXT \u683C\u5F0F";
/**
 * 处理用户消息（简化版）
 */
export function handleUserMessage(userMessage) {
    return __awaiter(this, void 0, void 0, function () {
        var messages;
        return __generator(this, function (_a) {
            messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ];
            return [2 /*return*/, chatCompletion(messages)];
        });
    });
}
export { SYSTEM_PROMPT };
export default {
    chatCompletion: chatCompletion,
    checkHealth: checkHealth,
    listModels: listModels,
    handleUserMessage: handleUserMessage,
    SYSTEM_PROMPT: SYSTEM_PROMPT,
};
