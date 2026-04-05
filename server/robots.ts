/**
 * robots.txt 检查模块
 * 检查目标网站是否允许爬取
 */

import * as cheerio from 'cheerio';

export interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
  crawlDelay?: number;
}

export interface RobotsResult {
  allowed: boolean;
  reason: string;
  rules?: RobotsRule[];
  crawlDelay?: number;
}

// 解析 robots.txt
function parseRobotsTxt(content: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let currentUserAgent = '';
  let currentRule: RobotsRule | null = null;
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过注释和空行
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmed.substring(colonIndex + 1).trim();
    
    switch (key) {
      case 'user-agent':
        if (currentRule) {
          rules.push(currentRule);
        }
        currentUserAgent = value;
        currentRule = {
          userAgent: currentUserAgent,
          disallow: [],
          allow: [],
          crawlDelay: undefined
        };
        break;
        
      case 'disallow':
        if (currentRule) {
          currentRule.disallow.push(value);
        }
        break;
        
      case 'allow':
        if (currentRule) {
          currentRule.allow.push(value);
        }
        break;
        
      case 'crawl-delay':
        if (currentRule && value) {
          currentRule.crawlDelay = parseInt(value, 10);
        }
        break;
    }
  }
  
  if (currentRule) {
    rules.push(currentRule);
  }
  
  return rules;
}

// 检查路径是否匹配规则
function matchesPath(pattern: string, path: string): boolean {
  if (pattern === '/') return true;
  if (pattern === '') return false;
  
  // 简单通配符匹配
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  try {
    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(path);
  } catch {
    return path.startsWith(pattern);
  }
}

// 检查 URL 是否允许爬取
function isUrlAllowed(rules: RobotsRule[], url: string): { allowed: boolean; crawlDelay?: number } {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    
    let matched = false;
    let allowed = true;
    let crawlDelay: number | undefined;
    
    for (const rule of rules) {
      // 匹配所有 User-Agent 或特定的爬虫
      if (rule.userAgent === '*' || rule.userAgent.toLowerCase() === 'novelcrawler') {
        matched = true;
        
        // 检查 Disallow 规则
        for (const disallow of rule.disallow) {
          if (matchesPath(disallow, path)) {
            allowed = false;
          }
        }
        
        // 检查 Allow 规则（优先级更高）
        for (const allow of rule.allow) {
          if (matchesPath(allow, path)) {
            allowed = true;
          }
        }
        
        if (rule.crawlDelay) {
          crawlDelay = rule.crawlDelay;
        }
      }
    }
    
    return { allowed: matched ? allowed : true, crawlDelay };
  } catch {
    return { allowed: true };
  }
}

/**
 * 检查目标网站是否允许爬取
 * @param baseUrl 网站基础 URL
 * @param targetUrl 要检查的目标 URL
 * @returns 检查结果
 */
export async function checkRobotsTxt(
  baseUrl: string,
  targetUrl?: string
): Promise<RobotsResult> {
  try {
    const urlObj = new URL(baseUrl);
    const robotsUrl = `${urlObj.origin}/robots.txt`;
    
    console.log(`[Robots] 检查: ${robotsUrl}`);
    
    // 尝试获取 robots.txt
    let robotsContent: string;
    
    try {
      // 使用 fetch 获取
      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NovelCrawler/1.0)'
        }
      });
      
      if (!response.ok) {
        // 没有 robots.txt，默认允许
        return {
          allowed: true,
          reason: '网站未设置 robots.txt，默认允许爬取'
        };
      }
      
      robotsContent = await response.text();
    } catch (e) {
      // 获取失败，默认允许
      return {
        allowed: true,
        reason: '无法获取 robots.txt，默认允许爬取'
      };
    }
    
    // 解析规则
    const rules = parseRobotsTxt(robotsContent);
    
    // 检查目标 URL
    const checkUrl = targetUrl || baseUrl;
    const { allowed, crawlDelay } = isUrlAllowed(rules, checkUrl);
    
    if (allowed) {
      return {
        allowed: true,
        reason: 'robots.txt 允许爬取该路径',
        rules,
        crawlDelay
      };
    } else {
      return {
        allowed: false,
        reason: 'robots.txt 禁止爬取该路径，请遵守网站规则',
        rules,
        crawlDelay
      };
    }
    
  } catch (error: any) {
return {
      allowed: true,
      reason: `检查 robots.txt 时出错: ${error.message}，默认允许爬取`
    };
  }
}

/**
 * 获取建议的爬取延迟
 * @param baseUrl 网站基础 URL
 * @returns 建议延迟秒数
 */
export async function getSuggestedDelay(baseUrl: string): Promise<number> {
  const result = await checkRobotsTxt(baseUrl);
  return result.crawlDelay || 1;
}

export default { checkRobotsTxt, getSuggestedDelay };