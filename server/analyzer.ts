/**
 * 网站结构分析器
 * 自动分析小说网站结构，提取关键元素
 */

import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ==================== 类型定义 ====================

export type WebsiteType = 
  | 'traditional'    // 传统目录型：有明确目录页
  | 'reading'        // 阅读页型：直接进入阅读页
  | 'paginated'      // 分页型：正文分多页显示
  | 'scroll_load'    // 滚动加载型：滚动加载更多
  | 'anti_crawl';    // 反爬型：需要登录/验证码

export interface WebsiteAnalysis {
  url: string;
  type: WebsiteType;
  encoding: string;
  
  // 目录页信息
  catalog?: {
    selectors: string[];
    pagination: boolean;
    paginationSelector?: string;
    loadMoreButton?: string;
  };
  
  // 章节信息
  chapter?: {
    titleSelectors: string[];
    contentSelectors: string[];
    noiseSelectors: string[];
  };
  
  // 导航链接
  navigation?: {
    prevChapter?: string;
    nextChapter?: string;
    backToCatalog?: string;
    prevPage?: string;
    nextPage?: string;
  };
  
  // 反爬机制
  antiCrawl?: {
    userAgent: boolean;
    referer: boolean;
    cookie: boolean;
    captcha: boolean;
    javascript: boolean;
    delay: number; // 建议延迟（秒）
  };
  
  // 爬取建议
  recommendations: string[];
}

// ==================== 网站类型识别 ====================

function detectWebsiteType($: cheerio.CheerioAPI, url: string): WebsiteType {
  // 检查是否有明显的目录结构
  const catalogSelectors = [
    '.chapter-list', '#list', '.catalog', '.chapters',
    '.book-list', 'ol.catalog', 'dl.chapter-list'
  ];
  
  for (const selector of catalogSelectors) {
    if ($(selector).length > 0) {
      // 检查是否有大量章节链接
      const links = $(selector).find('a').length;
      if (links > 10) return 'traditional';
    }
  }
  
  // 检查是否是阅读页（有正文内容）
  const contentSelectors = ['#content', '#chapter-content', '.chapter-content', '.text-content'];
  for (const selector of contentSelectors) {
    if ($(selector).length > 0) {
      // 检查是否有分页标记
      const pagination = $('.pagination, .page-nav, .next-page').length;
      if (pagination > 0) return 'paginated';
      
      // 检查是否有滚动加载标记
      const scrollLoad = $('[data-load], .infinite-scroll, .lazy-load').length;
      if (scrollLoad > 0) return 'scroll_load';
      
      return 'reading';
    }
  }
  
  // 检查是否需要登录/验证码
  const loginRequired = $('.login-required, .need-login, #login-form').length > 0;
  const hasCaptcha = $('.captcha, #captcha, .verify-code').length > 0;
  if (loginRequired || hasCaptcha) return 'anti_crawl';
  
  return 'traditional';
}

// ==================== 编码检测 ====================

function detectEncoding($: cheerio.CheerioAPI, html: string): string {
  // 从 meta 标签检测
  const charset = $('meta[charset]').attr('charset');
  if (charset) return charset.toUpperCase();
  
  const httpEquiv = $('meta[http-equiv="Content-Type"]').attr('content');
  if (httpEquiv) {
    const match = httpEquiv.match(/charset=([^;]+)/i);
    if (match) return match[1].toUpperCase();
  }
  
  // 默认 UTF-8
  return 'UTF-8';
}

// ==================== 目录选择器提取 ====================

const CATALOG_PATTERNS = [
  // 优先级高的选择器
  '#list dd a',
  '.chapter-list a',
  '#chapters a',
  '.catalog a',
  'ol.catalog li a',
  'dl.chapter-list dd a',
  
  // 次级选择器
  '.list-chapter a',
  '.chapter-list-box a',
  '#chapter-list a',
  '.book-list a',
  '.menu_list a',
  'ul.chapter-list a',
  '.chapter-ul a',
  '.chapter-item',
  'div.listmain a',
  '#list a',
  '.zjlist a',
  
  // 表格结构
  'table.chapter-list a',
  
  // 卷章节结构
  '.volume .chapters a',
  '.chapter-wrap a',
];

function extractCatalogSelectors($: cheerio.CheerioAPI): string[] {
  const found: string[] = [];
  
  for (const selector of CATALOG_PATTERNS) {
    const count = $(selector).length;
    if (count > 5) {
      found.push(selector);
    }
  }
  
  return found;
}

function detectPagination($: cheerio.CheerioAPI): { hasPagination: boolean; selector?: string; loadMore?: string } {
  // 检测分页
  const paginationSelectors = [
    '.pagination .next', '.page-nav .next', '.pager .next',
    'a.next-page', '.page-next', '.next-page'
  ];
  
  for (const selector of paginationSelectors) {
    if ($(selector).length > 0) {
      return { hasPagination: true, selector };
    }
  }
  
  // 检测加载更多按钮
  const loadMoreSelectors = [
    '.load-more', '.show-more', '.expand-all',
    '[data-load-more]', '.btn-more'
  ];
  
  for (const selector of loadMoreSelectors) {
    if ($(selector).length > 0) {
      return { hasPagination: false, loadMore: selector };
    }
  }
  
  return { hasPagination: false };
}

// ==================== 章节内容选择器提取 ====================

const TITLE_PATTERNS = [
  'h1.chapter-title',
  'h1.title',
  'h1',
  '.chapter-header .title',
  '.chapter-title',
  '.title',
  '[data-title]',
];

const CONTENT_PATTERNS = [
  // ID 选择器（优先级最高）
  '#content',
  '#chapter-content',
  '#chapterContent',
  '#BookText',
  '#txt',
  
  // 类名选择器
  '.chapter-content',
  '.text-content',
  '.novel-content',
  '.article-content',
  '.book-content',
  '.content',
  '.chapter-text',
  '.read-content',
  
  // 标签选择器
  'article',
  '.post-content',
  '.entry-content',
];

const NOISE_PATTERNS = [
  'script', 'style', 'noscript', 'iframe',
  '.ad', '.ads', '.advertisement',
  '.nav', '.navbar', 'nav',
  '.footer', 'footer',
  '.recommend', '.related',
  '.comments', '#comments',
  '.share', '.social',
  '.sidebar', '[class*="sidebar"]',
  '.header', 'header',
];

function extractChapterSelectors($: cheerio.CheerioAPI): { title: string[]; content: string[]; noise: string[] } {
  const titleSelectors: string[] = [];
  const contentSelectors: string[] = [];
  const noiseSelectors: string[] = [];
  
  // 提取标题选择器
  for (const selector of TITLE_PATTERNS) {
    const el = $(selector).first();
    if (el.length > 0) {
      const text = el.text().trim();
      // 检查是否像章节标题
      if (text.length > 0 && text.length < 100) {
        titleSelectors.push(selector);
      }
    }
  }
  
  // 提取内容选择器
  for (const selector of CONTENT_PATTERNS) {
    const el = $(selector).first();
    if (el.length > 0) {
      const text = el.text().trim();
      // 检查是否有足够的内容
      if (text.length > 200) {
        contentSelectors.push(selector);
      }
    }
  }
  
  // 提取噪音选择器（存在的）
  for (const selector of NOISE_PATTERNS) {
    if ($(selector).length > 0) {
      noiseSelectors.push(selector);
    }
  }
  
  return { title: titleSelectors, content: contentSelectors, noise: noiseSelectors };
}

// ==================== 导航链接提取 ====================

const NAV_PATTERNS = {
  prevChapter: [
    'a.prev-chapter', '.prev-chapter', 'a[href*="prev"]',
    'a:contains("上一章")', '.chapter-nav .prev'
  ],
  nextChapter: [
    'a.next-chapter', '.next-chapter', 'a[href*="next"]',
    'a:contains("下一章")', '.chapter-nav .next'
  ],
  backToCatalog: [
    'a.back-catalog', '.back-catalog', 'a[href*="list"]',
    'a[href*="catalog"]', 'a:contains("目录")', 'a:contains("返回")'
  ],
  prevPage: [
    'a.prev-page', '.page-prev', '.pagination .prev',
    'a:contains("上一页")'
  ],
  nextPage: [
    'a.next-page', '.page-next', '.pagination .next',
    'a:contains("下一页")', 'a:contains("继续阅读")'
  ]
};

function extractNavigationSelectors($: cheerio.CheerioAPI): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  
  for (const [key, selectors] of Object.entries(NAV_PATTERNS)) {
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        result[key] = selector;
        break;
      }
    }
  }
  
  return result;
}

// ==================== 反爬机制检测 ====================

function detectAntiCrawl($: cheerio.CheerioAPI, html: string): WebsiteAnalysis['antiCrawl'] {
  const result: WebsiteAnalysis['antiCrawl'] = {
    userAgent: false,
    referer: false,
    cookie: false,
    captcha: false,
    javascript: false,
    delay: 1
  };
  
  // 检测验证码
  const captchaSelectors = [
    '.captcha', '#captcha', '.verify-code', '.geetest',
    'img[src*="captcha"]', '.seccode'
  ];
  for (const selector of captchaSelectors) {
    if ($(selector).length > 0) {
      result.captcha = true;
      result.delay = 3;
      break;
    }
  }
  
  // 检测登录要求
  const loginSelectors = [
    '.login-required', '.need-login', '#login-form',
    '.login-box', '.user-login'
  ];
  for (const selector of loginSelectors) {
    if ($(selector).length > 0) {
      result.cookie = true;
      result.delay = 2;
      break;
    }
  }
  
  // 检测 JavaScript 渲染（内容在 script 中）
  const scriptContent = html.match(/document\.write|innerHTML|createElement/g);
  if (scriptContent && scriptContent.length > 5) {
    result.javascript = true;
    result.delay = 2;
  }
  
  // 检测 AJAX 加载
  const ajaxContent = html.match(/fetch\(|\.ajax\(|\.load\(/g);
  if (ajaxContent && ajaxContent.length > 3) {
    result.javascript = true;
  }
  
  // 延迟建议：根据章节链接数量
  const linkCount = $('a[href*="chapter"]').length;
  if (linkCount > 500) {
    result.delay = Math.max(result.delay, 2);
  }
  
  return result;
}

// ==================== 爬取建议生成 ====================

function generateRecommendations(analysis: WebsiteAnalysis): string[] {
  const recommendations: string[] = [];
  
  // 根据网站类型
  switch (analysis.type) {
    case 'traditional':
      recommendations.push('✓ 网站结构清晰，可直接按章节链接顺序爬取');
      break;
    case 'reading':
      recommendations.push('! 建议先找到目录页获取完整章节列表');
      recommendations.push('! 可通过导航链接（上一章/下一章）顺序爬取');
      break;
    case 'paginated':
      recommendations.push('! 正文分页显示，需要检测并处理分页');
      recommendations.push('! 检查"下一页"链接，合并完整章节内容');
      break;
    case 'scroll_load':
      recommendations.push('! 需要模拟滚动操作加载完整列表');
      recommendations.push('! 建议使用 Playwright 等浏览器自动化工具');
      break;
    case 'anti_crawl':
      recommendations.push('⚠ 检测到反爬机制，爬取难度较高');
      if (analysis.antiCrawl?.captcha) {
        recommendations.push('⚠ 存在验证码，可能需要人工处理');
      }
      if (analysis.antiCrawl?.cookie) {
        recommendations.push('⚠ 需要登录/会话，请先手动登录获取 Cookie');
      }
      break;
  }
  
  // 根据反爬检测结果
  if (analysis.antiCrawl) {
    if (analysis.antiCrawl.javascript) {
      recommendations.push('! 内容通过 JavaScript 加载，建议使用浏览器渲染');
    }
    if (analysis.antiCrawl.delay > 1) {
      recommendations.push(`! 建议请求延迟: ${analysis.antiCrawl.delay} 秒`);
    }
  }
  
  // 选择器建议
  if (!analysis.catalog?.selectors.length) {
    recommendations.push('? 未自动识别目录选择器，可能需要手动分析');
  }
  if (!analysis.chapter?.contentSelectors.length) {
    recommendations.push('? 未自动识别正文选择器，可能需要手动分析');
  }
  
  return recommendations;
}

// ==================== 主分析函数 ====================

export async function analyzeWebsite(
  url: string,
  html: string
): Promise<WebsiteAnalysis> {
  const $ = cheerio.load(html);
  
  // 检测网站类型
  const type = detectWebsiteType($, url);
  
  // 检测编码
  const encoding = detectEncoding($, html);
  
  // 提取目录选择器
  const catalogSelectors = extractCatalogSelectors($);
  const pagination = detectPagination($);
  
  // 提取章节选择器
  const chapterSelectors = extractChapterSelectors($);
  
  // 提取导航选择器
  const navigationSelectors = extractNavigationSelectors($);
  
  // 检测反爬机制
  const antiCrawl = detectAntiCrawl($, html);
  
  // 构建分析结果
  const analysis: WebsiteAnalysis = {
    url,
    type,
    encoding,
    catalog: {
      selectors: catalogSelectors,
      pagination: pagination.hasPagination,
      paginationSelector: pagination.selector,
      loadMoreButton: pagination.loadMore
    },
    chapter: {
      titleSelectors: chapterSelectors.title,
      contentSelectors: chapterSelectors.content,
      noiseSelectors: chapterSelectors.noise
    },
    navigation: {
      prevChapter: navigationSelectors.prevChapter,
      nextChapter: navigationSelectors.nextChapter,
      backToCatalog: navigationSelectors.backToCatalog,
      prevPage: navigationSelectors.prevPage,
      nextPage: navigationSelectors.nextPage
    },
    antiCrawl,
    recommendations: []
  };
  
  // 生成建议
  analysis.recommendations = generateRecommendations(analysis);
  
  return analysis;
}

export default { analyzeWebsite };