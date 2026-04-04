# 小说爬虫 Agent

一个基于 CodeBuddy Agent SDK 构建的智能小说爬取应用。

## 特性

- 📖 **智能识别** - 自动识别小说网站结构和章节列表
- 🔍 **内容提取** - 智能提取正文，自动过滤广告
- 📊 **进度展示** - 实时显示爬取进度
- 📁 **多格式导出** - 支持 TXT、Markdown、HTML、JSON 格式
- 💾 **文件管理** - 已爬取文件的查看和下载
- 🤖 **AI 对话** - 与 Agent 进行对话式交互

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: React 18 + TypeScript + Vite
- **UI**: TDesign React 组件库
- **AI**: CodeBuddy Agent SDK
- **爬虫**: Playwright + Cheerio
- **数据库**: SQLite (better-sqlite3)

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写你的 CodeBuddy API Key：

```bash
cp .env.example .env
```

### 3. 启动开发服务器

```bash
pnpm run dev
```

这会同时启动前端（端口 5173）和后端（端口 3000）

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 使用流程

1. 点击侧边栏的「小说爬取」按钮
2. 输入小说目录页面的 URL
3. 系统自动分析并显示章节列表
4. 选择要爬取的章节范围和导出格式
5. 点击开始爬取，实时查看进度
6. 爬取完成后下载文件

## API 端点

### 小说爬取 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/crawler/analyze` | POST | 分析小说页面 |
| `/api/crawler/start` | POST | 开始爬取任务 |
| `/api/crawler/progress/:taskId` | GET | 获取爬取进度 |
| `/api/crawler/files` | GET | 获取已爬取文件列表 |
| `/api/crawler/download/:filename` | GET | 下载文件 |
| `/api/crawler/files/:filename` | DELETE | 删除文件 |

### 聊天 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/check-login` | GET | 检查 CodeBuddy 登录状态 |
| `/api/models` | GET | 获取可用模型列表 |
| `/api/sessions` | GET | 获取所有会话 |
| `/api/chat` | POST | 发送消息（SSE 流式响应） |

## 注意事项

⚠️ **重要提示**：
- 仅支持免费的公开内容
- 不用于商业用途
- 遵守网站的 robots.txt 规则
- 建议添加适当延迟，避免给服务器造成压力

## 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

## License

MIT
