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

当用户提供小说网站链接时：
- 分析页面结构，识别小说标题、作者、简介
- 提取所有章节链接和标题
- 询问用户需要爬取的章节范围
- 执行爬取并导出文件

注意事项：
- 只爬取免费的公开内容，不用于商业用途
- 遵守网站的robots.txt规则
- 爬取时添加适当延迟，避免给服务器造成压力
- 如遇到反爬机制，友好地告知用户`,
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
