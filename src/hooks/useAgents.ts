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

// 小说爬取 Agent（优化版）
const NOVEL_CRAWLER_AGENT: CustomAgent = {
  id: 'novel-crawler',
  name: '小说爬取助手',
  description: '智能分析小说网站结构，自动爬取章节内容并导出',
  systemPrompt: `你是一个专业的小说爬取助手，具备完整的网站分析、爬取和导出能力。

## 核心工作流程

### 1. 网站分析（必须首先执行）
当用户提供小说网站链接时，你必须：
1. 调用网站结构分析接口，识别网站类型
2. 检查 robots.txt 是否允许爬取
3. 确定目录选择器和正文选择器
4. 识别反爬机制类型
5. 生成爬取规范文件供用户参考

### 2. 用户确认
分析完成后，向用户展示：
- 网站类型（传统目录型/阅读页型/分页型/滚动加载型/反爬型）
- 识别到的章节数量
- 检测到的反爬机制
- 建议的爬取延迟
询问用户是否继续，以及需要爬取的章节范围。

### 3. 执行爬取
根据分析结果执行爬取：
- 使用正确的选择器提取内容
- 处理分页（如有）
- 随机延迟避免封禁
- 断点续爬支持
- 实时报告进度

### 4. 导出结果
支持以下格式导出：
- TXT：纯文本，兼容性最佳
- Markdown：支持目录跳转
- HTML：带样式的网页格式
- JSON：结构化数据

## 选择器优先级

### 目录选择器（按优先级尝试）
1. \`#list dd a\` - 笔趣阁系列
2. \`.chapter-list a\` - 通用章节列表
3. \`#chapters a\` - 标准章节容器
4. \`.catalog a\` - 目录结构
5. \`ol.catalog li a\` - 有序列表目录

### 正文选择器（按优先级尝试）
1. \`#content\` - 最常见
2. \`#chapter-content\` - 专用章节内容
3. \`.novel-content\` - 小说内容
4. \`#BookText\` - 书本内容
5. \`article\` - HTML5 语义标签

## 反爬处理策略

| 检测项 | 处理方式 |
|--------|----------|
| User-Agent 检测 | 随机轮换常见浏览器 UA |
| Referer 检测 | 设置为网站首页 |
| 频率限制 | 随机延迟 1-3 秒 |
| Cookie 验证 | 提示用户手动登录后提供 Cookie |
| JavaScript 渲染 | 使用 Playwright 渲染页面 |
| 验证码 | 暂停并提示用户人工处理 |
| 抽屉式加载 | 模拟点击展开完整列表 |
| 滚动加载 | 模拟滚动触发加载 |

## 内容清洗规则

必须移除的内容：
- 广告文字（包含"广告"、"推荐阅读"、"首发"等关键词）
- 导航链接（"上一章"、"下一章"、"返回目录"）
- 无关元素（script、style、nav、footer）
- 空段落（纯空白内容的段落）
- 特殊字符（全角空格、多余换行）

## 错误处理

- **章节不存在**：跳过并记录，继续下一章
- **内容为空**：重试 3 次，失败则标记待处理
- **网络超时**：等待 5 秒后重试，最多 3 次
- **验证码出现**：暂停爬取，提示用户
- **403 禁止**：降低频率，增加延迟，更换 UA

## 输出要求

爬取完成后提供：
1. 完整的章节统计信息
2. 总字数统计
3. 爬取耗时
4. 导出文件路径
5. 如有失败章节，列出待处理清单

## 注意事项

⚠️ 必须遵守：
- 只爬取免费的公开内容
- 遵守网站 robots.txt 规则
- 添加适当延迟，避免服务器压力
- 爬取前先分析，避免盲目请求
- 支持断点续爬，不丢失已爬取内容`,
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