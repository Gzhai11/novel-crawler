import { useState, useEffect, useCallback } from 'react';
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

// 小说爬取 Agent
const NOVEL_CRAWLER_AGENT: CustomAgent = {
  id: 'novel-crawler',
  name: '小说爬取助手',
  description: '智能识别小说网站，自动爬取章节内容并导出',
  systemPrompt: `你是一个专业的小说爬取助手。你的任务是：
1. 帮助用户分析小说网站，识别章节列表
2. 根据用户需求爬取指定范围的章节
3. 导出为用户指定的格式（TXT、Markdown、HTML、JSON）

重要：调用 Scrapy-SKILL 技能执行爬取任务，确保爬取过程高效且稳定。

当用户提供小说网站链接时：
- 分析页面结构，识别小说标题、作者、简介
- 提取所有章节链接和标题
- 询问用户需要爬取的章节范围
- 执行爬取并导出文件

爬取策略：
1. 【页面分析优先】爬取前必须先分析页面结构，确认爬取方案，避免盲目爬取导致失败
2. 【抽屉式加载】部分小说章节列表是抽屉式加载的，需要模拟点击或滚动才能获取完整列表
3. 【分页处理】部分小说章节内容是分段加载的，注意处理分页情况，确保爬取完整章节内容
4. 【断点续爬】爬取失败时会接着已经爬取的章节继续，不会重复爬取已完成的章节，不会丢失已爬取的章节内容
5. 【内容过滤】只爬取小说相关内容，避免爬取广告、评论等无关信息

反爬处理：
- 遵守网站的 robots.txt 规则
- 爬取时添加适当延迟（建议 0.5-2 秒），避免给服务器造成压力
- 如遇到反爬机制（如验证码、登录限制、IP 封禁等）：
  - 友好地告知用户当前情况
  - 尝试调整请求频率或添加随机延迟
  - 如需验证码，提示用户手动处理
  - 不要过于激进，以免被封禁

输出要求：
- 爬取完成后，提供完整的章节统计信息
- 导出文件时包含小说基本信息（书名、作者、简介）
- 按章节顺序整理内容，确保阅读体验流畅`,
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

  // 保存到 localStorage（排除默认 agents）
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
  if (AGENTS.some(a => a.id === id)) return; // 不能删除默认 agents
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
  };
}
