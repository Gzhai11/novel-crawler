import 'dotenv/config';  // 加载 .env 文件，必须在最前面
import express from "express";
import { query, unstable_v2_createSession, unstable_v2_authenticate, PermissionResult, CanUseTool } from "@tencent-ai/agent-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import * as db from "./db.js";
import * as crawler from "./crawler.js";
import type { CrawlProgress } from "./crawler.js";
import * as analyzer from "./analyzer.js";
import * as robots from "./robots.js";
import * as specGenerator from "./spec-generator.js";
import * as ollama from "./ollama.js";
import { getAllCustomModels } from "./models.config.js";

const execAsync = promisify(exec);

// 待处理的权限请求
interface PendingPermission {
  resolve: (result: PermissionResult) => void;
  reject: (error: Error) => void;
  toolName: string;
  input: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
}

const pendingPermissions = new Map<string, PendingPermission>();

// 权限请求超时时间（5分钟）
const PERMISSION_TIMEOUT = 5 * 60 * 1000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// 缓存可用模型列表
let cachedModels: Array<{ modelId: string; name: string; description?: string }> = [];
const defaultModel = "claude-sonnet-4";

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Ollama 健康检查
app.get("/api/ollama/health", async (req, res) => {
  try {
    const result = await ollama.checkHealth();
    res.json(result);
  } catch (error: any) {
    res.json({ status: 'error', model: 'qwen2.5:3b' });
  }
});

// Ollama 模型列表
app.get("/api/ollama/models", async (req, res) => {
  try {
    const models = await ollama.listModels();
    res.json({ models });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ollama 对话接口
app.post("/api/ollama/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    console.log(`[Ollama] 收到消息: ${message}`);

    // 调用 Ollama 处理
    const reply = await ollama.handleUserMessage(message);

    res.json({ reply });
  } catch (error: any) {
    console.error(`[Ollama] 错误:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Ollama 流式对话接口
app.post("/api/ollama/chat/stream", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    console.log(`[Ollama] 流式消息: ${message}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 调用 Ollama 处理（流式）
    await ollama.chatCompletion(
      [
        { role: 'system', content: ollama.SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      {
        stream: true,
        onChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      }
    );

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error(`[Ollama] 流式错误:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 小说爬取 API ====================

// 存储爬取任务的进度
const crawlTasks = new Map<string, { progress: CrawlProgress; result?: any }>();

// ==================== 网站结构分析 API ====================

// 深度分析网站结构
app.post("/api/crawler/analyze-structure", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "请提供网站 URL" });
    }
    
    console.log(`[Analyzer] 深度分析网站: ${url}`);
    
    // 1. 检查 robots.txt
    const robotsResult = await robots.checkRobotsTxt(url);
    console.log(`[Analyzer] Robots.txt: ${robotsResult.allowed ? '允许' : '禁止'}`);
    
    if (!robotsResult.allowed) {
      return res.json({
        success: false,
        error: '网站 robots.txt 禁止爬取',
        robots: robotsResult
      });
    }
    
    // 2. 获取页面 HTML
    const { html } = await crawler.fetchPage ? 
      await crawler.fetchPage(url) : 
      await fetch(url).then(r => r.text()).then(html => ({ html, url, statusCode: 200 }));
    
    // 3. 分析网站结构
    const analysis = await analyzer.analyzeWebsite(url, html);
    console.log(`[Analyzer] 网站类型: ${analysis.type}`);
    console.log(`[Analyzer] 目录选择器: ${analysis.catalog?.selectors.length || 0} 个`);
    
    // 4. 生成爬取规范
    const spec = specGenerator.generateCrawlSpec(analysis);
    const specPath = specGenerator.saveSpecFile(spec);
    
    res.json({
      success: true,
      analysis,
      spec: {
        websiteName: spec.websiteName,
        generatedAt: spec.generatedAt,
        filepath: specPath
      },
      robots: robotsResult
    });
  } catch (error: any) {
    console.error("[Analyzer] 分析错误:", error);
    res.status(500).json({ error: error.message || "分析失败" });
  }
});

// 获取爬取规范文件
app.get("/api/crawler/spec/:filename", (req, res) => {
  const { filename } = req.params;
  const specDir = '/tmp/novels/specs';
  const filepath = path.join(specDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "规范文件不存在" });
  }
  
  res.download(filepath);
});

// 检查 robots.txt
app.get("/api/crawler/robots", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "请提供网站 URL" });
    }
    
    const result = await robots.checkRobotsTxt(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 分析小说页面
app.post("/api/crawler/analyze", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "请提供小说页面 URL" });
    }
    
    console.log(`[Crawler] 分析页面: ${url}`);
    
    const result = await crawler.analyzeNovelPage(url, (progress) => {
      console.log(`[Crawler] 进度:`, progress.message);
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || "分析失败" });
    }
    
    res.json({
      success: true,
      novel: result.novel,
      chapters: result.chapters,
      totalChapters: result.totalChapters
    });
  } catch (error: any) {
    console.error("[Crawler] 分析错误:", error);
    res.status(500).json({ error: error.message || "分析失败" });
  }
});

// 开始爬取
app.post("/api/crawler/start", async (req, res) => {
  try {
    const { url, startChapter = 0, endChapter, format = 'txt' } = req.body;
    const taskId = uuidv4();
    
    if (!url) {
      return res.status(400).json({ error: "请提供小说页面 URL" });
    }
    
    console.log(`[Crawler] 开始爬取任务: ${taskId}`);
    console.log(`[Crawler] URL: ${url}, 章节: ${startChapter}-${endChapter}, 格式: ${format}`);
    
    // 初始化任务状态
    crawlTasks.set(taskId, {
      progress: { phase: 'fetching_list', message: '正在初始化...' }
    });
    
    res.json({ taskId, message: "爬取任务已开始" });
    
    // 异步执行爬取
    (async () => {
      try {
        const result = await crawler.crawlNovel(
          { url, startChapter, endChapter, format },
          (progress) => {
            const task = crawlTasks.get(taskId);
            if (task) {
              task.progress = progress;
            }
          }
        );
        
        const task = crawlTasks.get(taskId);
        if (task) {
          task.progress = { phase: 'completed', message: '爬取完成' };
          task.result = result;
        }
      } catch (error: any) {
        const task = crawlTasks.get(taskId);
        if (task) {
          task.progress = { phase: 'error', message: error.message };
        }
      }
    })();
  } catch (error: any) {
    console.error("[Crawler] 启动错误:", error);
    res.status(500).json({ error: error.message || "启动爬取失败" });
  }
});

// 获取爬取进度
app.get("/api/crawler/progress/:taskId", (req, res) => {
  const { taskId } = req.params;
  const task = crawlTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: "任务不存在" });
  }
  
  res.json({
    progress: task.progress,
    result: task.result
  });
});

// 下载文件
app.get("/api/crawler/download/:filename", (req, res) => {
  const { filename } = req.params;
  const outputDir = '/tmp/novels';
  const filepath = path.join(outputDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "文件不存在" });
  }
  
  res.download(filepath);
});

// 列出已爬取的文件
app.get("/api/crawler/files", (req, res) => {
  try {
    const outputDir = '/tmp/novels';
    
    if (!fs.existsSync(outputDir)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(outputDir)
      .filter(f => fs.statSync(path.join(outputDir, f)).isFile())
      .map(f => {
        const stat = fs.statSync(path.join(outputDir, f));
        return {
          name: f,
          size: stat.size,
          createdAt: stat.birthtime,
          path: `/api/crawler/download/${f}`
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除文件
app.delete("/api/crawler/files/:filename", (req, res) => {
  const { filename } = req.params;
  const outputDir = '/tmp/novels';
  const filepath = path.join(outputDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "文件不存在" });
  }
  
  fs.unlinkSync(filepath);
  res.json({ success: true });
});

import fs from "fs";

// 登录方式类型
type LoginMethod = 'env' | 'cli' | 'none';

interface LoginStatusResponse {
  isLoggedIn: boolean;
  method?: LoginMethod;
  envConfigured?: boolean;
  cliConfigured?: boolean;
  error?: string;
  apiKey?: string; // 脱敏后的 API Key
  envVars?: {
    apiKey?: string;
    authToken?: string;
    internetEnv?: string;
    baseUrl?: string;
  };
}

// 检查 CodeBuddy CLI 登录状态
app.get("/api/check-login", async (req, res) => {
  const response: LoginStatusResponse = {
    isLoggedIn: false,
    envConfigured: false,
    cliConfigured: false,
    envVars: {},
  };
  
  // 1. 检查环境变量
  const apiKey = process.env.CODEBUDDY_API_KEY;
  const authToken = process.env.CODEBUDDY_AUTH_TOKEN;
  const internetEnv = process.env.CODEBUDDY_INTERNET_ENVIRONMENT;
  const baseUrl = process.env.CODEBUDDY_BASE_URL;
  
  if (apiKey || authToken) {
    response.envConfigured = true;
    // 脱敏显示
    if (apiKey) {
      response.envVars!.apiKey = apiKey.slice(0, 8) + '****' + apiKey.slice(-4);
      response.apiKey = response.envVars!.apiKey;
    }
    if (authToken) {
      response.envVars!.authToken = authToken.slice(0, 8) + '****' + authToken.slice(-4);
    }
    if (internetEnv) {
      response.envVars!.internetEnv = internetEnv;
    }
    if (baseUrl) {
      response.envVars!.baseUrl = baseUrl;
    }
  }
  
  // 2. 使用 unstable_v2_authenticate 检查登录状态（更可靠）
  try {
    let needsLogin = false;
    
    const result = await unstable_v2_authenticate({
      environment: 'external',
      onAuthUrl: async (authState) => {
        // 如果执行到这个回调，说明未登录
        needsLogin = true;
        console.log('[Check Login] 需要登录，认证 URL:', authState.authUrl);
        // 将认证 URL 返回给前端（如果需要）
        response.error = '未登录，请先登录 CodeBuddy CLI';
      }
    });
    
    // 如果没有触发 onAuthUrl 回调，说明已登录
    if (!needsLogin && result?.userinfo) {
      response.isLoggedIn = true;
      response.cliConfigured = true;
      
      // 判断登录方式
      if (response.envConfigured) {
        response.method = 'env';
      } else {
        response.method = 'cli';
      }
      
      console.log('[Check Login] 已登录用户:', result.userinfo.userName);
    } else if (!needsLogin) {
      // result 存在但没有 userinfo，仍然认为已登录
      response.isLoggedIn = true;
      response.cliConfigured = true;
      response.method = response.envConfigured ? 'env' : 'cli';
    }
  } catch (error: any) {
    console.error("[Check Login] SDK Error:", error);
    
    // 如果有环境变量配置，仍然认为是登录状态
    if (response.envConfigured) {
      response.isLoggedIn = true;
      response.method = 'env';
    } else {
      response.error = error?.message || String(error);
      response.method = 'none';
    }
  }
  
  res.json(response);
});

// 保存环境变量配置
app.post("/api/save-env-config", (req, res) => {
  const { apiKey, authToken, internetEnv, baseUrl } = req.body;
  
  if (!apiKey && !authToken) {
    return res.status(400).json({ error: '请至少配置 API Key 或 Auth Token' });
  }
  
  const configuredVars: string[] = [];
  
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
    message: `已设置: ${configuredVars.join(', ')}`,
    note: '环境变量仅在当前服务器进程有效，重启后需要重新设置'
  });
});

// 获取可用模型列表
app.get("/api/models", async (req, res) => {
  try {
    // 获取自定义模型
    const customModels = getAllCustomModels();
    console.log("[Models] Custom models:", customModels.length);
    
    if (cachedModels.length === 0) {
      console.log("[Models] Creating session to fetch available models...");
      
      try {
        const session = await unstable_v2_createSession({ 
          cwd: process.cwd()
        });
        
        console.log("[Models] Session created, calling getAvailableModels()...");
        const models = await session.getAvailableModels();
        console.log("[Models] Got", models.length, "models from SDK");
        
        if (models && Array.isArray(models)) {
          cachedModels = models;
        }
      } catch (sdkError: any) {
        console.log("[Models] SDK error, using fallback models:", sdkError.message);
      }
    }
    
    // 合并 SDK 模型和自定义模型（去重）
    const allModels = [...cachedModels];
    for (const custom of customModels) {
      if (!allModels.some(m => m.modelId === custom.modelId)) {
        allModels.push({
          modelId: custom.modelId,
          name: custom.name,
          description: custom.description,
        });
      }
    }
    
    // 如果没有模型，使用默认列表
    const finalModels = allModels.length > 0 ? allModels : [
      { modelId: "claude-sonnet-4", name: "Claude Sonnet 4" },
      { modelId: "claude-opus-4", name: "Claude Opus 4" }
    ];
    
    res.json({ 
      models: finalModels,
      customModels: customModels.map(m => m.modelId), // 标记哪些是自定义模型
      defaultModel 
    });
  } catch (error: any) {
    console.error("[Models] Error:", error);
    
    // 错误时返回自定义模型和默认模型
    const customModels = getAllCustomModels();
    res.json({
      models: [
        { modelId: "claude-sonnet-4", name: "Claude Sonnet 4" },
        { modelId: "claude-opus-4", name: "Claude Opus 4" },
        ...customModels.map(m => ({
          modelId: m.modelId,
          name: m.name,
          description: m.description,
        }))
      ],
      defaultModel,
      error: error?.message || String(error)
    });
  }
});

// ============= 会话 API =============

// 获取所有会话（包含消息数量）
app.get("/api/sessions", (req, res) => {
  try {
    const sessions = db.getAllSessions();
    const sessionsWithMessages = sessions.map(session => {
      const messages = db.getMessagesBySession(session.id);
      return {
        ...session,
        messageCount: messages.length
      };
    });
    res.json({ sessions: sessionsWithMessages });
  } catch (error: any) {
    console.error("[Sessions] Error:", error);
    res.status(500).json({ error: error?.message || "获取会话失败" });
  }
});

// 获取单个会话及其消息
app.get("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = db.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "会话不存在" });
    }
    
    const messages = db.getMessagesBySession(sessionId);
    
    // 解析 tool_calls JSON
    const parsedMessages = messages.map(msg => ({
      ...msg,
      tool_calls: msg.tool_calls ? JSON.parse(msg.tool_calls) : null
    }));
    
    res.json({ session, messages: parsedMessages });
  } catch (error: any) {
    console.error("[Session] Error:", error);
    res.status(500).json({ error: error?.message || "获取会话失败" });
  }
});

// 创建新会话
app.post("/api/sessions", (req, res) => {
  try {
    const { model = defaultModel, title = "新对话" } = req.body;
    const now = new Date().toISOString();
    
    const session = db.createSession({
      id: uuidv4(),
      title,
      model,
      sdk_session_id: null,
      created_at: now,
      updated_at: now
    });
    
    res.json({ session });
  } catch (error: any) {
    console.error("[Create Session] Error:", error);
    res.status(500).json({ error: error?.message || "创建会话失败" });
  }
});

// 更新会话
app.patch("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, model } = req.body;
    
    const success = db.updateSession(sessionId, { title, model });
    
    if (!success) {
      return res.status(404).json({ error: "会话不存在" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Update Session] Error:", error);
    res.status(500).json({ error: error?.message || "更新会话失败" });
  }
});

// 删除会话
app.delete("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = db.deleteSession(sessionId);
    
    if (!success) {
      return res.status(404).json({ error: "会话不存在" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Delete Session] Error:", error);
    res.status(500).json({ error: error?.message || "删除会话失败" });
  }
});

// ============= 聊天 API =============

// 权限响应 API
app.post("/api/permission-response", (req, res) => {
  const { requestId, behavior, message } = req.body;
  
  console.log(`[Permission] Response received: requestId=${requestId}, behavior=${behavior}`);
  
  const pending = pendingPermissions.get(requestId);
  if (!pending) {
    console.log(`[Permission] Request not found: ${requestId}`);
    return res.status(404).json({ error: "权限请求不存在或已超时" });
  }
  
  // 清除请求
  pendingPermissions.delete(requestId);
  
  if (behavior === 'allow') {
    pending.resolve({
      behavior: 'allow',
      updatedInput: pending.input
    });
  } else {
    pending.resolve({
      behavior: 'deny',
      message: message || '用户拒绝了此操作'
    });
  }
  
  res.json({ success: true });
});

// 发送消息并获取流式响应
app.post("/api/chat", async (req, res) => {
  const { sessionId, message, model, systemPrompt, cwd, permissionMode } = req.body;
  
  // 请求日志
  console.log(`\n[Chat] ========== 新请求 ==========`);
  console.log(`[Chat] SessionId: ${sessionId}`);
  console.log(`[Chat] Model: ${model}`);
  console.log(`[Chat] Message: ${message?.slice(0, 100)}${message?.length > 100 ? '...' : ''}`);
  console.log(`[Chat] CWD: ${cwd || 'default'}`);

  if (!message) {
    console.log(`[Chat] 错误: 消息为空`);
    return res.status(400).json({ error: "消息不能为空" });
  }

  // 获取或创建会话
  let session = sessionId ? db.getSession(sessionId) : null;
  const now = new Date().toISOString();
  
  if (!session) {
    // 创建新会话
    console.log(`[Chat] 创建新会话`);
    session = db.createSession({
      id: sessionId || uuidv4(),
      title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
      model: model || defaultModel,
      sdk_session_id: null,  // 稍后从 SDK 获取
      created_at: now,
      updated_at: now
    });
  } else {
    console.log(`[Chat] 使用现有会话, SDK Session: ${session.sdk_session_id || 'none'}`);
  }

  const selectedModel = model || session.model;
  
  // 检查是否是 Ollama 模型：通过 provider 字段或模型名称判断
  const customModels = getAllCustomModels();
  const customModel = customModels.find(m => m.modelId === selectedModel);
  const isOllamaModel = customModel?.provider === 'ollama' || 
                        selectedModel.toLowerCase().includes('ollama') ||
                        (process.env.OLLAMA_MODEL && selectedModel === process.env.OLLAMA_MODEL);
  
  if (isOllamaModel) {
    // 使用 Ollama 处理请求
    console.log(`[Chat] 使用 Ollama 模型: ${selectedModel}`);
    
    // 设置 SSE 头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    const userMessageId = uuidv4();
    const assistantMessageId = uuidv4();
    
    // 保存用户消息
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
    } catch (dbError: any) {
      console.error(`[Chat] 保存用户消息失败:`, dbError);
      return res.status(500).json({ error: "保存消息失败", detail: dbError?.message });
    }
    
    // 发送初始化信息
    res.write(`data: ${JSON.stringify({ 
      type: "init", 
      sessionId: session.id, 
      userMessageId, 
      assistantMessageId,
      model: selectedModel 
    })}\n\n`);
    
    try {
      // 获取历史消息以支持多轮对话
      const historyMessages = db.getMessagesBySession(session.id);
      const ollamaMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
        { role: 'system', content: systemPrompt || "你是一个专业的AI助手，善于帮助用户解决各种问题。请用简洁清晰的方式回答问题。" }
      ];
      
      // 添加历史消息（最近10条）
      const recentHistory = historyMessages.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          ollamaMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
      
      // 添加当前消息
      ollamaMessages.push({ role: 'user', content: message });
      
      let fullResponse = "";
      
      // 调用 Ollama 流式接口
      await ollama.chatCompletion(
        ollamaMessages,
        {
          stream: true,
          onChunk: (chunk) => {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`);
          }
        }
      );
      
      // 保存助手消息
      db.createMessage({
        id: assistantMessageId,
        session_id: session.id,
        role: 'assistant',
        content: fullResponse,
        model: selectedModel,
        created_at: new Date().toISOString(),
        tool_calls: null
      });
      
      // 更新会话标题
      const messages = db.getMessagesBySession(session.id);
      if (messages.length <= 2) {
        db.updateSession(session.id, { 
          title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
          model: selectedModel
        });
      }
      
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
      console.log(`[Chat] Ollama 请求完成 ✓`);
    } catch (error: any) {
      console.error(`[Chat] Ollama 错误:`, error);
      res.write(`data: ${JSON.stringify({ type: "error", message: error?.message || "Ollama 调用失败" })}\n\n`);
      res.end();
    }
    
    return;  // Ollama 处理完成，直接返回
  }
  
  // 获取 SDK session ID（用于恢复对话）
  const sdkSessionId = session.sdk_session_id;

  // 创建用户消息 ID 和助手消息 ID
  const userMessageId = uuidv4();
  const assistantMessageId = uuidv4();

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
    console.log(`[Chat] 用户消息已保存: ${userMessageId}`);
  } catch (dbError: any) {
    console.error(`[Chat] 保存用户消息失败:`, dbError);
    return res.status(500).json({ error: "保存消息失败", detail: dbError?.message });
  }

  // 设置 SSE 头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 默认系统提示词
  const defaultSystemPrompt = "你是一个专业的AI助手，善于帮助用户解决各种问题。请用简洁清晰的方式回答问题。";
  
  // 工作目录：优先使用请求中的 cwd，否则使用当前目录
  const workingDir = cwd || process.cwd();

  try {
    console.log(`[Chat] 调用 SDK query...`);
    console.log(`[Chat] - Model: ${selectedModel}`);
    console.log(`[Chat] - Resume: ${sdkSessionId || 'none'}`);
    console.log(`[Chat] - CWD: ${workingDir}`);
    console.log(`[Chat] - PermissionMode: ${permissionMode || 'default'}`);
    
    // 创建 canUseTool 回调
    const canUseTool: CanUseTool = async (toolName, input, options) => {
      console.log(`[Permission] Tool request: ${toolName}`);
      console.log(`[Permission] Input:`, JSON.stringify(input, null, 2));
      
      // bypassPermissions 模式直接放行
      if (permissionMode === 'bypassPermissions') {
        console.log(`[Permission] Bypassing permissions for ${toolName}`);
        return { behavior: 'allow', updatedInput: input };
      }
      
      // 创建权限请求
      const requestId = uuidv4();
      const permissionRequest = {
        requestId,
        toolUseId: options.toolUseID,
        toolName,
        input,
        sessionId: session.id,
        timestamp: Date.now()
      };
      
      // 发送权限请求到前端
      res.write(`data: ${JSON.stringify({ 
        type: "permission_request", 
        ...permissionRequest
      })}\n\n`);
      
      // 创建 Promise 等待用户响应
      return new Promise<PermissionResult>((resolve, reject) => {
        const pending: PendingPermission = {
          resolve,
          reject,
          toolName,
          input,
          sessionId: session.id,
          timestamp: Date.now()
        };
        
        pendingPermissions.set(requestId, pending);
        
        // 设置超时
        setTimeout(() => {
          if (pendingPermissions.has(requestId)) {
            pendingPermissions.delete(requestId);
            console.log(`[Permission] Request timeout: ${requestId}`);
            resolve({
              behavior: 'deny',
              message: '权限请求超时'
            });
          }
        }, PERMISSION_TIMEOUT);
      });
    };
    
    // 使用 Query API 发送消息
    // 如果有 sdk_session_id，使用 resume 恢复对话上下文
    const stream = query({
      prompt: message,
      options: {
        cwd: workingDir,
        model: selectedModel,
        maxTurns: 10,
        systemPrompt: systemPrompt || defaultSystemPrompt,
        permissionMode: permissionMode || 'default',
        canUseTool,
        ...(sdkSessionId ? { resume: sdkSessionId } : {})  // 使用 resume 恢复对话
      }
    });

    let fullResponse = "";
    let toolCalls: Array<{ 
      id: string; 
      name: string; 
      input?: Record<string, unknown>;
      status: string; 
      result?: string;
      isError?: boolean;
    }> = [];
    let newSdkSessionId: string | null = null;  // 用于存储 SDK 返回的 session_id

    // 发送会话ID和消息ID
    res.write(`data: ${JSON.stringify({ 
      type: "init", 
      sessionId: session.id, 
      userMessageId, 
      assistantMessageId,
      model: selectedModel 
    })}\n\n`);

    // 当前正在执行的工具 ID（用于匹配 tool_result）
    let currentToolId: string | null = null;

    // 处理流式响应
    for await (const msg of stream) {
      console.log("[Stream] Message type:", msg.type, msg);
      
      // 处理 system 消息，获取 SDK 的 session_id
      if (msg.type === "system" && (msg as any).subtype === "init") {
        newSdkSessionId = (msg as any).session_id;
        console.log(`[Stream] Got SDK session_id: ${newSdkSessionId}`);
        
        // 保存 SDK session_id 到数据库（如果是新的）
        if (newSdkSessionId && newSdkSessionId !== sdkSessionId) {
          db.updateSession(session.id, { sdk_session_id: newSdkSessionId });
          console.log(`[Stream] Saved SDK session_id to database`);
        }
      } else if (msg.type === "assistant") {
        const content = msg.message.content;

        if (typeof content === "string") {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ type: "text", content })}\n\n`);
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text") {
              fullResponse += block.text;
              res.write(`data: ${JSON.stringify({ type: "text", content: block.text })}\n\n`);
            } else if (block.type === "tool_use") {
              currentToolId = block.id || uuidv4();
              const toolInput = (block as any).input || {};
              console.log(`[Stream] Tool use: id=${currentToolId}, name=${block.name}`);
              console.log(`[Stream] Tool input:`, JSON.stringify(toolInput, null, 2));
              
              const toolCall = { 
                id: currentToolId, 
                name: block.name, 
                input: toolInput,
                status: "running" 
              };
              toolCalls.push(toolCall);
              res.write(`data: ${JSON.stringify({ 
                type: "tool", 
                id: toolCall.id,
                name: toolCall.name,
                input: toolCall.input,
                status: toolCall.status
              })}\n\n`);
            }
          }
        }
      } else if (msg.type === "result") {
        // 完成时确保所有工具都标记为完成
        toolCalls.forEach(tool => {
          if (tool.status === "running") {
            tool.status = "completed";
            res.write(`data: ${JSON.stringify({ type: "tool_result", toolId: tool.id, content: tool.result || "已完成" })}\n\n`);
          }
        });
        const msgAny = msg as any;
        res.write(`data: ${JSON.stringify({ type: "done", duration: msgAny.duration_ms, cost: msgAny.total_cost_usd })}\n\n`);
      }
    }

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

    // 更新会话标题（如果是第一条消息）
    const messages = db.getMessagesBySession(session.id);
    if (messages.length <= 2) {
      db.updateSession(session.id, { 
        title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
        model: selectedModel
      });
    }

    console.log(`[Chat] 请求完成 ✓`);
    res.end();
  } catch (error: any) {
    console.error(`\n[Chat] ========== 错误 ==========`);
    console.error(`[Chat] Error Name:`, error?.name);
    console.error(`[Chat] Error Message:`, error?.message);
    console.error(`[Chat] Error Code:`, error?.code);
    console.error(`[Chat] Error Stack:`, error?.stack);
    console.error(`[Chat] Full Error:`, JSON.stringify(error, null, 2));
    
    const errorMessage = error?.message || "处理请求时发生错误";
    res.write(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`);
    res.end();
  }
});

// 启动服务器
async function startServer() {
  try {
    // 等待数据库初始化
    await db.dbReady;
    console.log("[DB] 数据库初始化完成");
    
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║     ◉ API 服务器已启动                      ║
║                                            ║
║     地址: http://localhost:${PORT}            ║
║     数据库: SQLite (data/chat.db)          ║
║                                            ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("[Server] 启动失败:", error);
    process.exit(1);
  }
}

startServer();
