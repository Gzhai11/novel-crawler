var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import 'dotenv/config'; // 加载 .env 文件，必须在最前面
import express from "express";
import { query, unstable_v2_createSession, unstable_v2_authenticate } from "@tencent-ai/agent-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import * as db from "./db.js";
import * as crawler from "./crawler.js";
import * as analyzer from "./analyzer.js";
import * as robots from "./robots.js";
import * as specGenerator from "./spec-generator.js";
import * as ollama from "./ollama.js";
import { getAllCustomModels } from "./models.config.js";
var execAsync = promisify(exec);
var pendingPermissions = new Map();
// 权限请求超时时间（5分钟）
var PERMISSION_TIMEOUT = 5 * 60 * 1000;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
// 缓存可用模型列表
var cachedModels = [];
var defaultModel = "claude-sonnet-4";
// 健康检查
app.get("/api/health", function (req, res) {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Ollama 健康检查
app.get("/api/ollama/health", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ollama.checkHealth()];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.json({ status: 'error', model: 'qwen2.5:3b' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Ollama 模型列表
app.get("/api/ollama/models", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var models, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ollama.listModels()];
            case 1:
                models = _a.sent();
                res.json({ models: models });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: error_2.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Ollama 对话接口
app.post("/api/ollama/chat", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, reply, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                message = req.body.message;
                if (!message) {
                    return [2 /*return*/, res.status(400).json({ error: "消息不能为空" })];
                }
                console.log("[Ollama] \u6536\u5230\u6D88\u606F: ".concat(message));
                return [4 /*yield*/, ollama.handleUserMessage(message)];
            case 1:
                reply = _a.sent();
                res.json({ reply: reply });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("[Ollama] \u9519\u8BEF:", error_3);
                res.status(500).json({ error: error_3.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Ollama 流式对话接口
app.post("/api/ollama/chat/stream", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                message = req.body.message;
                if (!message) {
                    return [2 /*return*/, res.status(400).json({ error: "消息不能为空" })];
                }
                console.log("[Ollama] \u6D41\u5F0F\u6D88\u606F: ".concat(message));
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                // 调用 Ollama 处理（流式）
                return [4 /*yield*/, ollama.chatCompletion([
                        { role: 'system', content: ollama.SYSTEM_PROMPT },
                        { role: 'user', content: message }
                    ], {
                        stream: true,
                        onChunk: function (chunk) {
                            res.write("data: ".concat(JSON.stringify({ content: chunk }), "\n\n"));
                        }
                    })];
            case 1:
                // 调用 Ollama 处理（流式）
                _a.sent();
                res.write("data: ".concat(JSON.stringify({ done: true }), "\n\n"));
                res.end();
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error("[Ollama] \u6D41\u5F0F\u9519\u8BEF:", error_4);
                res.status(500).json({ error: error_4.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ==================== 小说爬取 API ====================
// 存储爬取任务的进度
var crawlTasks = new Map();
// ==================== 网站结构分析 API ====================
// 深度分析网站结构
app.post("/api/crawler/analyze-structure", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url_1, robotsResult, html, _a, analysis, spec, specPath, error_5;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 8, , 9]);
                url_1 = req.body.url;
                if (!url_1) {
                    return [2 /*return*/, res.status(400).json({ error: "请提供网站 URL" })];
                }
                console.log("[Analyzer] \u6DF1\u5EA6\u5206\u6790\u7F51\u7AD9: ".concat(url_1));
                return [4 /*yield*/, robots.checkRobotsTxt(url_1)];
            case 1:
                robotsResult = _c.sent();
                console.log("[Analyzer] Robots.txt: ".concat(robotsResult.allowed ? '允许' : '禁止'));
                if (!robotsResult.allowed) {
                    return [2 /*return*/, res.json({
                            success: false,
                            error: '网站 robots.txt 禁止爬取',
                            robots: robotsResult
                        })];
                }
                return [4 /*yield*/, crawler.fetchPage];
            case 2:
                if (!(_c.sent())) return [3 /*break*/, 4];
                return [4 /*yield*/, crawler.fetchPage(url_1)];
            case 3:
                _a = _c.sent();
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, fetch(url_1).then(function (r) { return r.text(); }).then(function (html) { return ({ html: html, url: url_1, statusCode: 200 }); })];
            case 5:
                _a = _c.sent();
                _c.label = 6;
            case 6:
                html = (_a).html;
                return [4 /*yield*/, analyzer.analyzeWebsite(url_1, html)];
            case 7:
                analysis = _c.sent();
                console.log("[Analyzer] \u7F51\u7AD9\u7C7B\u578B: ".concat(analysis.type));
                console.log("[Analyzer] \u76EE\u5F55\u9009\u62E9\u5668: ".concat(((_b = analysis.catalog) === null || _b === void 0 ? void 0 : _b.selectors.length) || 0, " \u4E2A"));
                spec = specGenerator.generateCrawlSpec(analysis);
                specPath = specGenerator.saveSpecFile(spec);
                res.json({
                    success: true,
                    analysis: analysis,
                    spec: {
                        websiteName: spec.websiteName,
                        generatedAt: spec.generatedAt,
                        filepath: specPath
                    },
                    robots: robotsResult
                });
                return [3 /*break*/, 9];
            case 8:
                error_5 = _c.sent();
                console.error("[Analyzer] 分析错误:", error_5);
                res.status(500).json({ error: error_5.message || "分析失败" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// 获取爬取规范文件
app.get("/api/crawler/spec/:filename", function (req, res) {
    var filename = req.params.filename;
    var specDir = '/tmp/novels/specs';
    var filepath = path.join(specDir, filename);
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "规范文件不存在" });
    }
    res.download(filepath);
});
// 检查 robots.txt
app.get("/api/crawler/robots", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url, result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                url = req.query.url;
                if (!url || typeof url !== 'string') {
                    return [2 /*return*/, res.status(400).json({ error: "请提供网站 URL" })];
                }
                return [4 /*yield*/, robots.checkRobotsTxt(url)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res.status(500).json({ error: error_6.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 分析小说页面
app.post("/api/crawler/analyze", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url, result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                url = req.body.url;
                if (!url) {
                    return [2 /*return*/, res.status(400).json({ error: "请提供小说页面 URL" })];
                }
                console.log("[Crawler] \u5206\u6790\u9875\u9762: ".concat(url));
                return [4 /*yield*/, crawler.analyzeNovelPage(url, function (progress) {
                        console.log("[Crawler] \u8FDB\u5EA6:", progress.message);
                    })];
            case 1:
                result = _a.sent();
                if (!result.success) {
                    return [2 /*return*/, res.status(400).json({ error: result.error || "分析失败" })];
                }
                res.json({
                    success: true,
                    novel: result.novel,
                    chapters: result.chapters,
                    totalChapters: result.totalChapters
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                console.error("[Crawler] 分析错误:", error_7);
                res.status(500).json({ error: error_7.message || "分析失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// 开始爬取
app.post("/api/crawler/start", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, url_2, _b, startChapter_1, endChapter_1, _c, format_1, taskId_1;
    return __generator(this, function (_d) {
        try {
            _a = req.body, url_2 = _a.url, _b = _a.startChapter, startChapter_1 = _b === void 0 ? 0 : _b, endChapter_1 = _a.endChapter, _c = _a.format, format_1 = _c === void 0 ? 'txt' : _c;
            taskId_1 = uuidv4();
            if (!url_2) {
                return [2 /*return*/, res.status(400).json({ error: "请提供小说页面 URL" })];
            }
            console.log("[Crawler] \u5F00\u59CB\u722C\u53D6\u4EFB\u52A1: ".concat(taskId_1));
            console.log("[Crawler] URL: ".concat(url_2, ", \u7AE0\u8282: ").concat(startChapter_1, "-").concat(endChapter_1, ", \u683C\u5F0F: ").concat(format_1));
            // 初始化任务状态
            crawlTasks.set(taskId_1, {
                progress: { phase: 'fetching_list', message: '正在初始化...' }
            });
            res.json({ taskId: taskId_1, message: "爬取任务已开始" });
            // 异步执行爬取
            (function () { return __awaiter(void 0, void 0, void 0, function () {
                var result, task, error_8, task;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, crawler.crawlNovel({ url: url_2, startChapter: startChapter_1, endChapter: endChapter_1, format: format_1 }, function (progress) {
                                    var task = crawlTasks.get(taskId_1);
                                    if (task) {
                                        task.progress = progress;
                                    }
                                })];
                        case 1:
                            result = _a.sent();
                            task = crawlTasks.get(taskId_1);
                            if (task) {
                                task.progress = { phase: 'completed', message: '爬取完成' };
                                task.result = result;
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_8 = _a.sent();
                            task = crawlTasks.get(taskId_1);
                            if (task) {
                                task.progress = { phase: 'error', message: error_8.message };
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })();
        }
        catch (error) {
            console.error("[Crawler] 启动错误:", error);
            res.status(500).json({ error: error.message || "启动爬取失败" });
        }
        return [2 /*return*/];
    });
}); });
// 获取爬取进度
app.get("/api/crawler/progress/:taskId", function (req, res) {
    var taskId = req.params.taskId;
    var task = crawlTasks.get(taskId);
    if (!task) {
        return res.status(404).json({ error: "任务不存在" });
    }
    res.json({
        progress: task.progress,
        result: task.result
    });
});
// 下载文件
app.get("/api/crawler/download/:filename", function (req, res) {
    var filename = req.params.filename;
    var outputDir = '/tmp/novels';
    var filepath = path.join(outputDir, filename);
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "文件不存在" });
    }
    res.download(filepath);
});
// 列出已爬取的文件
app.get("/api/crawler/files", function (req, res) {
    try {
        var outputDir_1 = '/tmp/novels';
        if (!fs.existsSync(outputDir_1)) {
            return res.json({ files: [] });
        }
        var files = fs.readdirSync(outputDir_1)
            .filter(function (f) { return fs.statSync(path.join(outputDir_1, f)).isFile(); })
            .map(function (f) {
            var stat = fs.statSync(path.join(outputDir_1, f));
            return {
                name: f,
                size: stat.size,
                createdAt: stat.birthtime,
                path: "/api/crawler/download/".concat(f)
            };
        })
            .sort(function (a, b) { return b.createdAt.getTime() - a.createdAt.getTime(); });
        res.json({ files: files });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 删除文件
app.delete("/api/crawler/files/:filename", function (req, res) {
    var filename = req.params.filename;
    var outputDir = '/tmp/novels';
    var filepath = path.join(outputDir, filename);
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: "文件不存在" });
    }
    fs.unlinkSync(filepath);
    res.json({ success: true });
});
import fs from "fs";
// 检查 CodeBuddy CLI 登录状态
app.get("/api/check-login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var response, apiKey, authToken, internetEnv, baseUrl, needsLogin_1, result, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                response = {
                    isLoggedIn: false,
                    envConfigured: false,
                    cliConfigured: false,
                    envVars: {},
                };
                apiKey = process.env.CODEBUDDY_API_KEY;
                authToken = process.env.CODEBUDDY_AUTH_TOKEN;
                internetEnv = process.env.CODEBUDDY_INTERNET_ENVIRONMENT;
                baseUrl = process.env.CODEBUDDY_BASE_URL;
                if (apiKey || authToken) {
                    response.envConfigured = true;
                    // 脱敏显示
                    if (apiKey) {
                        response.envVars.apiKey = apiKey.slice(0, 8) + '****' + apiKey.slice(-4);
                        response.apiKey = response.envVars.apiKey;
                    }
                    if (authToken) {
                        response.envVars.authToken = authToken.slice(0, 8) + '****' + authToken.slice(-4);
                    }
                    if (internetEnv) {
                        response.envVars.internetEnv = internetEnv;
                    }
                    if (baseUrl) {
                        response.envVars.baseUrl = baseUrl;
                    }
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                needsLogin_1 = false;
                return [4 /*yield*/, unstable_v2_authenticate({
                        environment: 'external',
                        onAuthUrl: function (authState) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                // 如果执行到这个回调，说明未登录
                                needsLogin_1 = true;
                                console.log('[Check Login] 需要登录，认证 URL:', authState.authUrl);
                                // 将认证 URL 返回给前端（如果需要）
                                response.error = '未登录，请先登录 CodeBuddy CLI';
                                return [2 /*return*/];
                            });
                        }); }
                    })];
            case 2:
                result = _a.sent();
                // 如果没有触发 onAuthUrl 回调，说明已登录
                if (!needsLogin_1 && (result === null || result === void 0 ? void 0 : result.userinfo)) {
                    response.isLoggedIn = true;
                    response.cliConfigured = true;
                    // 判断登录方式
                    if (response.envConfigured) {
                        response.method = 'env';
                    }
                    else {
                        response.method = 'cli';
                    }
                    console.log('[Check Login] 已登录用户:', result.userinfo.userName);
                }
                else if (!needsLogin_1) {
                    // result 存在但没有 userinfo，仍然认为已登录
                    response.isLoggedIn = true;
                    response.cliConfigured = true;
                    response.method = response.envConfigured ? 'env' : 'cli';
                }
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                console.error("[Check Login] SDK Error:", error_9);
                // 如果有环境变量配置，仍然认为是登录状态
                if (response.envConfigured) {
                    response.isLoggedIn = true;
                    response.method = 'env';
                }
                else {
                    response.error = (error_9 === null || error_9 === void 0 ? void 0 : error_9.message) || String(error_9);
                    response.method = 'none';
                }
                return [3 /*break*/, 4];
            case 4:
                res.json(response);
                return [2 /*return*/];
        }
    });
}); });
// 保存环境变量配置
app.post("/api/save-env-config", function (req, res) {
    var _a = req.body, apiKey = _a.apiKey, authToken = _a.authToken, internetEnv = _a.internetEnv, baseUrl = _a.baseUrl;
    if (!apiKey && !authToken) {
        return res.status(400).json({ error: '请至少配置 API Key 或 Auth Token' });
    }
    var configuredVars = [];
    // 设置环境变量（仅在当前进程有效）
    if (apiKey) {
        process.env.CODEBUDDY_API_KEY = apiKey;
        configuredVars.push('CODEBUDDY_API_KEY');
    }
    if (authToken) {
        process.env.CODEBUDDY_AUTH_TOKEN = authToken;
        configuredVars.push('CODEBUDDY_AUTH_TOKEN');
    }
    if (internetEnv) {
        process.env.CODEBUDDY_INTERNET_ENVIRONMENT = internetEnv;
        configuredVars.push('CODEBUDDY_INTERNET_ENVIRONMENT');
    }
    if (baseUrl) {
        process.env.CODEBUDDY_BASE_URL = baseUrl;
        configuredVars.push('CODEBUDDY_BASE_URL');
    }
    // 清除模型缓存，以便重新获取
    cachedModels = [];
    res.json({
        success: true,
        message: "\u5DF2\u8BBE\u7F6E: ".concat(configuredVars.join(', ')),
        note: '环境变量仅在当前服务器进程有效，重启后需要重新设置'
    });
});
// 获取可用模型列表
app.get("/api/models", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var customModels, session, models, sdkError_1, allModels, _loop_1, _i, customModels_1, custom, finalModels, error_10, customModels;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                customModels = getAllCustomModels();
                console.log("[Models] Custom models:", customModels.length);
                if (!(cachedModels.length === 0)) return [3 /*break*/, 5];
                console.log("[Models] Creating session to fetch available models...");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, unstable_v2_createSession({
                        cwd: process.cwd()
                    })];
            case 2:
                session = _a.sent();
                console.log("[Models] Session created, calling getAvailableModels()...");
                return [4 /*yield*/, session.getAvailableModels()];
            case 3:
                models = _a.sent();
                console.log("[Models] Got", models.length, "models from SDK");
                if (models && Array.isArray(models)) {
                    cachedModels = models;
                }
                return [3 /*break*/, 5];
            case 4:
                sdkError_1 = _a.sent();
                console.log("[Models] SDK error, using fallback models:", sdkError_1.message);
                return [3 /*break*/, 5];
            case 5:
                allModels = __spreadArray([], cachedModels, true);
                _loop_1 = function (custom) {
                    if (!allModels.some(function (m) { return m.modelId === custom.modelId; })) {
                        allModels.push({
                            modelId: custom.modelId,
                            name: custom.name,
                            description: custom.description,
                        });
                    }
                };
                for (_i = 0, customModels_1 = customModels; _i < customModels_1.length; _i++) {
                    custom = customModels_1[_i];
                    _loop_1(custom);
                }
                finalModels = allModels.length > 0 ? allModels : [
                    { modelId: "claude-sonnet-4", name: "Claude Sonnet 4" },
                    { modelId: "claude-opus-4", name: "Claude Opus 4" }
                ];
                res.json({
                    models: finalModels,
                    customModels: customModels.map(function (m) { return m.modelId; }), // 标记哪些是自定义模型
                    defaultModel: defaultModel
                });
                return [3 /*break*/, 7];
            case 6:
                error_10 = _a.sent();
                console.error("[Models] Error:", error_10);
                customModels = getAllCustomModels();
                res.json({
                    models: __spreadArray([
                        { modelId: "claude-sonnet-4", name: "Claude Sonnet 4" },
                        { modelId: "claude-opus-4", name: "Claude Opus 4" }
                    ], customModels.map(function (m) { return ({
                        modelId: m.modelId,
                        name: m.name,
                        description: m.description,
                    }); }), true),
                    defaultModel: defaultModel,
                    error: (error_10 === null || error_10 === void 0 ? void 0 : error_10.message) || String(error_10)
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// ============= 会话 API =============
// 获取所有会话（包含消息数量）
app.get("/api/sessions", function (req, res) {
    try {
        var sessions = db.getAllSessions();
        var sessionsWithMessages = sessions.map(function (session) {
            var messages = db.getMessagesBySession(session.id);
            return __assign(__assign({}, session), { messageCount: messages.length });
        });
        res.json({ sessions: sessionsWithMessages });
    }
    catch (error) {
        console.error("[Sessions] Error:", error);
        res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "获取会话失败" });
    }
});
// 获取单个会话及其消息
app.get("/api/sessions/:sessionId", function (req, res) {
    try {
        var sessionId = req.params.sessionId;
        var session = db.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: "会话不存在" });
        }
        var messages = db.getMessagesBySession(sessionId);
        // 解析 tool_calls JSON
        var parsedMessages = messages.map(function (msg) { return (__assign(__assign({}, msg), { tool_calls: msg.tool_calls ? JSON.parse(msg.tool_calls) : null })); });
        res.json({ session: session, messages: parsedMessages });
    }
    catch (error) {
        console.error("[Session] Error:", error);
        res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "获取会话失败" });
    }
});
// 创建新会话
app.post("/api/sessions", function (req, res) {
    try {
        var _a = req.body, _b = _a.model, model = _b === void 0 ? defaultModel : _b, _c = _a.title, title = _c === void 0 ? "新对话" : _c;
        var now = new Date().toISOString();
        var session = db.createSession({
            id: uuidv4(),
            title: title,
            model: model,
            sdk_session_id: null,
            created_at: now,
            updated_at: now
        });
        res.json({ session: session });
    }
    catch (error) {
        console.error("[Create Session] Error:", error);
        res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "创建会话失败" });
    }
});
// 更新会话
app.patch("/api/sessions/:sessionId", function (req, res) {
    try {
        var sessionId = req.params.sessionId;
        var _a = req.body, title = _a.title, model = _a.model;
        var success = db.updateSession(sessionId, { title: title, model: model });
        if (!success) {
            return res.status(404).json({ error: "会话不存在" });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("[Update Session] Error:", error);
        res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "更新会话失败" });
    }
});
// 删除会话
app.delete("/api/sessions/:sessionId", function (req, res) {
    try {
        var sessionId = req.params.sessionId;
        var success = db.deleteSession(sessionId);
        if (!success) {
            return res.status(404).json({ error: "会话不存在" });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("[Delete Session] Error:", error);
        res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || "删除会话失败" });
    }
});
// ============= 聊天 API =============
// 权限响应 API
app.post("/api/permission-response", function (req, res) {
    var _a = req.body, requestId = _a.requestId, behavior = _a.behavior, message = _a.message;
    console.log("[Permission] Response received: requestId=".concat(requestId, ", behavior=").concat(behavior));
    var pending = pendingPermissions.get(requestId);
    if (!pending) {
        console.log("[Permission] Request not found: ".concat(requestId));
        return res.status(404).json({ error: "权限请求不存在或已超时" });
    }
    // 清除请求
    pendingPermissions.delete(requestId);
    if (behavior === 'allow') {
        pending.resolve({
            behavior: 'allow',
            updatedInput: pending.input
        });
    }
    else {
        pending.resolve({
            behavior: 'deny',
            message: message || '用户拒绝了此操作'
        });
    }
    res.json({ success: true });
});
// 发送消息并获取流式响应
app.post("/api/chat", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sessionId, message, model, systemPrompt, cwd, permissionMode, session, now, selectedModel, sdkSessionId, userMessageId, assistantMessageId, defaultSystemPrompt, workingDir, canUseTool, stream, fullResponse, toolCalls, newSdkSessionId, currentToolId, _b, stream_1, stream_1_1, msg, content, _i, content_1, block, toolInput, toolCall, msgAny, e_1_1, messages, error_11, errorMessage;
    var _c, e_1, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _a = req.body, sessionId = _a.sessionId, message = _a.message, model = _a.model, systemPrompt = _a.systemPrompt, cwd = _a.cwd, permissionMode = _a.permissionMode;
                // 请求日志
                console.log("\n[Chat] ========== \u65B0\u8BF7\u6C42 ==========");
                console.log("[Chat] SessionId: ".concat(sessionId));
                console.log("[Chat] Model: ".concat(model));
                console.log("[Chat] Message: ".concat(message === null || message === void 0 ? void 0 : message.slice(0, 100)).concat((message === null || message === void 0 ? void 0 : message.length) > 100 ? '...' : ''));
                console.log("[Chat] CWD: ".concat(cwd || 'default'));
                if (!message) {
                    console.log("[Chat] \u9519\u8BEF: \u6D88\u606F\u4E3A\u7A7A");
                    return [2 /*return*/, res.status(400).json({ error: "消息不能为空" })];
                }
                session = sessionId ? db.getSession(sessionId) : null;
                now = new Date().toISOString();
                if (!session) {
                    // 创建新会话
                    console.log("[Chat] \u521B\u5EFA\u65B0\u4F1A\u8BDD");
                    session = db.createSession({
                        id: sessionId || uuidv4(),
                        title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
                        model: model || defaultModel,
                        sdk_session_id: null, // 稍后从 SDK 获取
                        created_at: now,
                        updated_at: now
                    });
                }
                else {
                    console.log("[Chat] \u4F7F\u7528\u73B0\u6709\u4F1A\u8BDD, SDK Session: ".concat(session.sdk_session_id || 'none'));
                }
                selectedModel = model || session.model;
                sdkSessionId = session.sdk_session_id;
                userMessageId = uuidv4();
                assistantMessageId = uuidv4();
                // 保存用户消息到数据库
                try {
                    db.createMessage({
                        id: userMessageId,
                        session_id: session.id,
                        role: 'user',
                        content: message,
                        model: null,
                        created_at: now,
                        tool_calls: null
                    });
                    console.log("[Chat] \u7528\u6237\u6D88\u606F\u5DF2\u4FDD\u5B58: ".concat(userMessageId));
                }
                catch (dbError) {
                    console.error("[Chat] \u4FDD\u5B58\u7528\u6237\u6D88\u606F\u5931\u8D25:", dbError);
                    return [2 /*return*/, res.status(500).json({ error: "保存消息失败", detail: dbError === null || dbError === void 0 ? void 0 : dbError.message })];
                }
                // 设置 SSE 头
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
                defaultSystemPrompt = "你是一个专业的AI助手，善于帮助用户解决各种问题。请用简洁清晰的方式回答问题。";
                workingDir = cwd || process.cwd();
                _f.label = 1;
            case 1:
                _f.trys.push([1, 14, , 15]);
                console.log("[Chat] \u8C03\u7528 SDK query...");
                console.log("[Chat] - Model: ".concat(selectedModel));
                console.log("[Chat] - Resume: ".concat(sdkSessionId || 'none'));
                console.log("[Chat] - CWD: ".concat(workingDir));
                console.log("[Chat] - PermissionMode: ".concat(permissionMode || 'default'));
                canUseTool = function (toolName, input, options) { return __awaiter(void 0, void 0, void 0, function () {
                    var requestId, permissionRequest;
                    return __generator(this, function (_a) {
                        console.log("[Permission] Tool request: ".concat(toolName));
                        console.log("[Permission] Input:", JSON.stringify(input, null, 2));
                        // bypassPermissions 模式直接放行
                        if (permissionMode === 'bypassPermissions') {
                            console.log("[Permission] Bypassing permissions for ".concat(toolName));
                            return [2 /*return*/, { behavior: 'allow', updatedInput: input }];
                        }
                        requestId = uuidv4();
                        permissionRequest = {
                            requestId: requestId,
                            toolUseId: options.toolUseID,
                            toolName: toolName,
                            input: input,
                            sessionId: session.id,
                            timestamp: Date.now()
                        };
                        // 发送权限请求到前端
                        res.write("data: ".concat(JSON.stringify(__assign({ type: "permission_request" }, permissionRequest)), "\n\n"));
                        // 创建 Promise 等待用户响应
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var pending = {
                                    resolve: resolve,
                                    reject: reject,
                                    toolName: toolName,
                                    input: input,
                                    sessionId: session.id,
                                    timestamp: Date.now()
                                };
                                pendingPermissions.set(requestId, pending);
                                // 设置超时
                                setTimeout(function () {
                                    if (pendingPermissions.has(requestId)) {
                                        pendingPermissions.delete(requestId);
                                        console.log("[Permission] Request timeout: ".concat(requestId));
                                        resolve({
                                            behavior: 'deny',
                                            message: '权限请求超时'
                                        });
                                    }
                                }, PERMISSION_TIMEOUT);
                            })];
                    });
                }); };
                stream = query({
                    prompt: message,
                    options: __assign({ cwd: workingDir, model: selectedModel, maxTurns: 10, systemPrompt: systemPrompt || defaultSystemPrompt, permissionMode: permissionMode || 'default', canUseTool: canUseTool }, (sdkSessionId ? { resume: sdkSessionId } : {}) // 使用 resume 恢复对话
                    )
                });
                fullResponse = "";
                toolCalls = [];
                newSdkSessionId = null;
                // 发送会话ID和消息ID
                res.write("data: ".concat(JSON.stringify({
                    type: "init",
                    sessionId: session.id,
                    userMessageId: userMessageId,
                    assistantMessageId: assistantMessageId,
                    model: selectedModel
                }), "\n\n"));
                currentToolId = null;
                _f.label = 2;
            case 2:
                _f.trys.push([2, 7, 8, 13]);
                _b = true, stream_1 = __asyncValues(stream);
                _f.label = 3;
            case 3: return [4 /*yield*/, stream_1.next()];
            case 4:
                if (!(stream_1_1 = _f.sent(), _c = stream_1_1.done, !_c)) return [3 /*break*/, 6];
                _e = stream_1_1.value;
                _b = false;
                msg = _e;
                console.log("[Stream] Message type:", msg.type, msg);
                // 处理 system 消息，获取 SDK 的 session_id
                if (msg.type === "system" && msg.subtype === "init") {
                    newSdkSessionId = msg.session_id;
                    console.log("[Stream] Got SDK session_id: ".concat(newSdkSessionId));
                    // 保存 SDK session_id 到数据库（如果是新的）
                    if (newSdkSessionId && newSdkSessionId !== sdkSessionId) {
                        db.updateSession(session.id, { sdk_session_id: newSdkSessionId });
                        console.log("[Stream] Saved SDK session_id to database");
                    }
                }
                else if (msg.type === "assistant") {
                    content = msg.message.content;
                    if (typeof content === "string") {
                        fullResponse += content;
                        res.write("data: ".concat(JSON.stringify({ type: "text", content: content }), "\n\n"));
                    }
                    else if (Array.isArray(content)) {
                        for (_i = 0, content_1 = content; _i < content_1.length; _i++) {
                            block = content_1[_i];
                            if (block.type === "text") {
                                fullResponse += block.text;
                                res.write("data: ".concat(JSON.stringify({ type: "text", content: block.text }), "\n\n"));
                            }
                            else if (block.type === "tool_use") {
                                currentToolId = block.id || uuidv4();
                                toolInput = block.input || {};
                                console.log("[Stream] Tool use: id=".concat(currentToolId, ", name=").concat(block.name));
                                console.log("[Stream] Tool input:", JSON.stringify(toolInput, null, 2));
                                toolCall = {
                                    id: currentToolId,
                                    name: block.name,
                                    input: toolInput,
                                    status: "running"
                                };
                                toolCalls.push(toolCall);
                                res.write("data: ".concat(JSON.stringify({
                                    type: "tool",
                                    id: toolCall.id,
                                    name: toolCall.name,
                                    input: toolCall.input,
                                    status: toolCall.status
                                }), "\n\n"));
                            }
                        }
                    }
                }
                else if (msg.type === "result") {
                    // 完成时确保所有工具都标记为完成
                    toolCalls.forEach(function (tool) {
                        if (tool.status === "running") {
                            tool.status = "completed";
                            res.write("data: ".concat(JSON.stringify({ type: "tool_result", toolId: tool.id, content: tool.result || "已完成" }), "\n\n"));
                        }
                    });
                    msgAny = msg;
                    res.write("data: ".concat(JSON.stringify({ type: "done", duration: msgAny.duration_ms, cost: msgAny.total_cost_usd }), "\n\n"));
                }
                _f.label = 5;
            case 5:
                _b = true;
                return [3 /*break*/, 3];
            case 6: return [3 /*break*/, 13];
            case 7:
                e_1_1 = _f.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 13];
            case 8:
                _f.trys.push([8, , 11, 12]);
                if (!(!_b && !_c && (_d = stream_1.return))) return [3 /*break*/, 10];
                return [4 /*yield*/, _d.call(stream_1)];
            case 9:
                _f.sent();
                _f.label = 10;
            case 10: return [3 /*break*/, 12];
            case 11:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 12: return [7 /*endfinally*/];
            case 13:
                // 保存助手消息到数据库
                db.createMessage({
                    id: assistantMessageId,
                    session_id: session.id,
                    role: 'assistant',
                    content: fullResponse,
                    model: selectedModel,
                    created_at: new Date().toISOString(),
                    tool_calls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : null
                });
                messages = db.getMessagesBySession(session.id);
                if (messages.length <= 2) {
                    db.updateSession(session.id, {
                        title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
                        model: selectedModel
                    });
                }
                console.log("[Chat] \u8BF7\u6C42\u5B8C\u6210 \u2713");
                res.end();
                return [3 /*break*/, 15];
            case 14:
                error_11 = _f.sent();
                console.error("\n[Chat] ========== \u9519\u8BEF ==========");
                console.error("[Chat] Error Name:", error_11 === null || error_11 === void 0 ? void 0 : error_11.name);
                console.error("[Chat] Error Message:", error_11 === null || error_11 === void 0 ? void 0 : error_11.message);
                console.error("[Chat] Error Code:", error_11 === null || error_11 === void 0 ? void 0 : error_11.code);
                console.error("[Chat] Error Stack:", error_11 === null || error_11 === void 0 ? void 0 : error_11.stack);
                console.error("[Chat] Full Error:", JSON.stringify(error_11, null, 2));
                errorMessage = (error_11 === null || error_11 === void 0 ? void 0 : error_11.message) || "处理请求时发生错误";
                res.write("data: ".concat(JSON.stringify({ type: "error", message: errorMessage }), "\n\n"));
                res.end();
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); });
// 启动服务器
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // 等待数据库初始化
                    return [4 /*yield*/, db.dbReady];
                case 1:
                    // 等待数据库初始化
                    _a.sent();
                    console.log("[DB] 数据库初始化完成");
                    app.listen(PORT, function () {
                        console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n\u2551                                            \u2551\n\u2551     \u25C9 API \u670D\u52A1\u5668\u5DF2\u542F\u52A8                      \u2551\n\u2551                                            \u2551\n\u2551     \u5730\u5740: http://localhost:".concat(PORT, "            \u2551\n\u2551     \u6570\u636E\u5E93: SQLite (data/chat.db)          \u2551\n\u2551                                            \u2551\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n      "));
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_12 = _a.sent();
                    console.error("[Server] 启动失败:", error_12);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
startServer();
