import { useState, useCallback } from 'react';
import { CustomAgent } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'customAgents';

// 默认的 Agent
const DEFAULT_AGENT: CustomAgent = {
  id: 'default',
  name: '通用助手',
  description: '一个通用的 AI 助手，可以帮助你完成各种任务',
  systemPrompt: '你是一个专业的AI助手，善于帮助用户解决各种问题。请用简洁清晰的方式回答问题。',
  icon: 'Bot',
  color: '#0052d9',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 小说爬取 Agent（简化版 - 直接调用API）
const NOVEL_CRAWLER_AGENT: CustomAgent = {
  id: 'novel-crawler',
  name: '小说爬取助手',
  description: '快速爬取小说章节并导出为 TXT/MD/HTML/JSON',
  systemPrompt: `你是一个专业的小说爬取助手。

## 核心规则

当用户提供小说 URL 时，**直接执行爬取**，不要做额外分析！

## 执行步骤

### 1. 发起爬取
调用 Bash 工具执行：
\`\`\`bash
curl -X POST http://localhost:3000/api/crawler/start \\
  -H "Content-Type: application/json" \\
  -d '{"url": "用户提供的URL", "format": "txt"}'
\`\`\`

### 2. 轮询进度
获取返回的 taskId 后，每 2 秒调用：
\`\`\`bash
curl http://localhost:3000/api/crawler/progress/{taskId}
\`\`\`

### 3. 等待完成
当 phase 变为 "completed" 时，爬取完成。

### 4. 提示下载
告诉用户文件路径和下载方式。

## 重要提醒

- **不要**用 Bash 做文件操作来分析 HTML
- **不要**检查 robots.txt 或做额外分析
- **直接调用 API** 完成爬取
- 支持格式：txt、md、html、json
- 默认使用 TXT 格式

## 快速示例

用户: "爬取 https://xxx.com/novel/1"

你:
1. 调用 /api/crawler/start 发起爬取
2. 轮询 /api/crawler/progress/:id 直到完成
3. 告知用户下载路径`,
  icon: 'BookOpen',
  color: '#0594DE',
  permissionMode: 'acceptEdits',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const AGENTS = [DEFAULT_AGENT, NOVEL_CRAWLER_AGENT];

export function useAgents() {
  const [agents, setAgents] = useState<CustomAgent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...AGENTS, ...parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }))];
      }
    } catch (e) {
      console.error('Failed to load agents:', e);
    }
    return AGENTS;
  });

  const saveAgents = useCallback((newAgents: CustomAgent[]) => {
    const toSave = newAgents.filter(a => !AGENTS.some(d => d.id === a.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const addAgent = useCallback((agent: Omit<CustomAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAgent: CustomAgent = {
      ...agent,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAgents(prev => {
      const updated = [...prev, newAgent];
      saveAgents(updated);
      return updated;
    });
    return newAgent;
  }, [saveAgents]);

  const updateAgent = useCallback((id: string, updates: Partial<Omit<CustomAgent, 'id' | 'createdAt'>>) => {
    setAgents(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      );
      saveAgents(updated);
      return updated;
    });
  }, [saveAgents]);

  const deleteAgent = useCallback((id: string) => {
    if (AGENTS.some(a => a.id === id)) return;
    setAgents(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAgents(updated);
      return updated;
    });
  }, [saveAgents]);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    defaultAgent: DEFAULT_AGENT,
    novelCrawlerAgent: NOVEL_CRAWLER_AGENT,
  };
}