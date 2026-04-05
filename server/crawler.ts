/**
 * 小说爬取工具模块
 * 支持智能识别章节列表、内容解析、多格式导出
 */

import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// ==================== 类型定义 ====================

export interface NovelInfo {
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
}

export interface Chapter {
  index: number;
  title: string;
  url: string;
  content?: string;
  wordCount?: number;
}

export interface CrawlResult {
  success: boolean;
  novel?: NovelInfo;
  chapters?: Chapter[];
  totalChapters?: number;
  error?: string;
}

export interface CrawlProgress {
  phase: 'fetching_list' | 'fetching_content' | 'exporting' | 'completed' | 'error';
  currentChapter?: number;
  totalChapters?: number;
  currentTitle?: string;
  message?: string;
}

export type ProgressCallback = (progress: CrawlProgress) => void;

// ==================== 浏览器获取 ====================

let playwrightBrowser: any = null;

async function getBrowser(): Promise<any> {
  if (playwrightBrowser) return playwrightBrowser;
  
  try {
    const { chromium } = await import('playwright');
    playwrightBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    return playwrightBrowser;
  } catch (error) {
    throw new Error('无法启动浏览器，请确保 Playwright 已正确安装');
  }
}

async function closeBrowser() {
  if (playwrightBrowser) {
    await playwrightBrowser.close();
    playwrightBrowser = null;
  }
}

// ==================== 网页抓取 ====================

interface FetchResult {
  html: string;
  url: string;
  statusCode: number;
}

async function fetchPage(url: string, retryCount = 3): Promise<FetchResult> {
  const browser = await getBrowser();
  let lastError: Error | null = null;
  
  // User-Agent 池
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ];
  
  for (let i = 0; i < retryCount; i++) {
    const context = await browser.newContext({
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)]
    });
    const page = await context.newPage();
    
    try {
      // 设置超时
      page.setDefaultTimeout(30000);
      
      // 访问页面
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // 检测验证码
      const hasCaptcha = await page.$('.captcha, #captcha, .verify-code, .geetest');
      if (hasCaptcha) {
        console.log(`[Crawler] 检测到验证码，等待处理...`);
        await page.waitForTimeout(5000);
      }
      
      // 等待主要内容加载
      await page.waitForTimeout(1000 + Math.random() * 1000);
      
      // 尝试展开抽屉式加载
      try {
        const expandBtn = await page.$('.load-more, .expand, .show-all, [class*="more"]:visible');
        if (expandBtn) {
          for (let j = 0; j < 5; j++) {
            await expandBtn.click().catch(() => {});
            await page.waitForTimeout(500);
          }
        }
      } catch (e) {
        // 忽略展开错误
      }
      
      // 滚动到底部触发懒加载
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      }).catch(() => {});
      await page.waitForTimeout(500);
      
      // 获取HTML
      const html = await page.content();
      const finalUrl = page.url();
      const statusCode = response?.status() || 200;
      
      return { html, url: finalUrl, statusCode };
    } catch (error: any) {
      lastError = error;
      console.error(`[Crawler] 第 ${i + 1} 次尝试失败:`, error.message);
      
      // 指数退避
      if (i < retryCount - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    } finally {
      await context.close();
    }
  }
  
  throw lastError || new Error('抓取页面失败');
}

// ==================== 章节列表识别 ====================

const CHAPTER_PATTERNS = {
  // 常见的章节列表选择器
  selectors: [
    '#list dd a',           // 笔趣阁系列
    '.chapter-list a',      // 章节列表
    '#chapters a',          // 章节列表
    '.list-chapter a',      // 章节列表
    '.catalog a',           // 目录
    '.chapter-list-box a',  // 章节盒子
    '#chapter-list a',      // 章节列表
    '.book-list a',         // 书籍列表
    '.menu_list a',         // 菜单列表
    'ul.chapter-list a',    // UL章节列表
    '.chapter-ul a',        // 章节UL
    '.chapter-item',        // 章节项
    'div.listmain a',       // 列表主页
    '#list a',              // 列表
    '.zjlist a',            // 章节列表
  ],
  // 章节标题正则
  titlePatterns: [
    /^第[一二三四五六七八九十百千万零\d]+[章节回集]/,
    /^[第][\d]+[章节回]/,
    /^[【\[]?[\d]+[】\]]/,
    /^Chapter\s*\d+/i,
    /^CHAPTER\s*\d+/i,
    /^\d+[\.\、]/,
  ]
};

function extractChapterList($: cheerio.CheerioAPI, baseUrl: string): Chapter[] {
  const chapters: Chapter[] = [];
  let found = false;
  
  // 尝试各种选择器
  for (const selector of CHAPTER_PATTERNS.selectors) {
    const links = $(selector);
    if (links.length > 0) {
      links.each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const title = $link.text().trim();
        
        if (href && title) {
          // 检查是否像章节标题
          const isChapterLike = CHAPTER_PATTERNS.titlePatterns.some(p => p.test(title)) ||
            title.length < 50; // 短标题也可能是章节
          
          if (isChapterLike) {
            const fullUrl = new URL(href, baseUrl).href;
            chapters.push({
              index: chapters.length,
              title,
              url: fullUrl
            });
          }
        }
      });
      
      if (chapters.length > 0) {
        found = true;
        break;
      }
    }
  }
  
  // 如果没有找到，尝试更通用的方法
  if (!found) {
    $('a').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const title = $link.text().trim();
      
      if (href && title) {
        const isChapterLike = CHAPTER_PATTERNS.titlePatterns.some(p => p.test(title));
        if (isChapterLike) {
          try {
            const fullUrl = new URL(href, baseUrl).href;
            // 避免重复
            if (!chapters.some(c => c.url === fullUrl)) {
              chapters.push({
                index: chapters.length,
                title,
                url: fullUrl
              });
            }
          } catch (e) {
            // URL 解析失败，忽略
          }
        }
      }
    });
  }
  
  return chapters;
}

function extractNovelInfo($: cheerio.CheerioAPI, url: string): NovelInfo {
  const novel: NovelInfo = { title: '未知小说' };
  
  // 书名
  novel.title = $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="og:title"]').attr('content') ||
    $('title').text().replace(/[-_|].*$/, '').trim() ||
    '未知小说';
  
  // 作者
  novel.author = $('meta[property="og:author"]').attr('content') ||
    $('meta[name="author"]').attr('content') ||
    $('[class*="author"]').first().text().replace(/作者[：:]\s*/i, '').trim() ||
    undefined;
  
  // 封面
  novel.coverUrl = $('meta[property="og:image"]').attr('content') ||
    $('.book-cover img, .cover img').first().attr('src') ||
    undefined;
  
  // 描述
  novel.description = $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('.book-intro, .intro, .description').first().text().trim() ||
    undefined;
  
  return novel;
}

// ==================== 章节内容提取 ====================

const CONTENT_SELECTORS = [
  '#content',
  '.content',
  '#chapter-content',
  '.chapter-content',
  '.novel-content',
  '.article-content',
  '.text-content',
  '.book-content',
  '#BookText',
  '#txt',
  '.txt',
  'article',
  '.post-content',
  '.entry-content',
];

const NOISE_SELECTORS = [
  'script',
  'style',
  'nav',
  '.nav',
  'header',
  'footer',
  '.ads',
  '.advertisement',
  '.ad',
  '.related',
  '.comments',
  '.share',
  '.social',
  '[class*="sidebar"]',
  '.recommend',
];

function extractChapterContent($: cheerio.CheerioAPI): string {
  // 尝试每个内容选择器
  for (const selector of CONTENT_SELECTORS) {
    const $content = $(selector);
    if ($content.length > 0) {
      // 移除噪音元素
      for (const noise of NOISE_SELECTORS) {
        $content.find(noise).remove();
      }
      
      const text = $content.text().trim();
      if (text.length > 100) {
        return cleanContent(text);
      }
    }
  }
  
  // 如果没有找到，尝试获取最长的段落组合
  const paragraphs: string[] = [];
  $('p').each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 20 && !isNoise(text)) {
      paragraphs.push(text);
    }
  });
  
  if (paragraphs.length > 0) {
    return paragraphs.join('\n\n');
  }
  
  return '';
}

function cleanContent(content: string): string {
  // 移除常见的广告和噪音文本
  const noisePatterns = [
    /^.*?小说.*?首发.*$/gm,
    /^.*?本章未完.*$/gm,
    /^.*?点击下一页.*$/gm,
    /^.*?返回目录.*$/gm,
    /^.*?推荐阅读.*$/gm,
    /^.*?www\..*?\.com.*$/gm,
    /^.*?http[s]?:\/\/.*$/gm,
    /^[（\(].*?[）\)]$/gm,
    /^---+$/gm,
    /^\s*$/,
  ];
  
  let cleaned = content;
  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // 合并多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

function isNoise(text: string): boolean {
  const noiseKeywords = ['广告', '推荐', '点击', '分享', '收藏', '举报', '返回', '下一章'];
  return noiseKeywords.some(k => text.includes(k)) && text.length < 50;
}

// ==================== 主要功能 ====================

/**
 * 分析小说页面，提取书籍信息和章节列表
 */
export async function analyzeNovelPage(url: string, onProgress?: ProgressCallback): Promise<CrawlResult> {
  try {
    onProgress?.({ phase: 'fetching_list', message: '正在获取页面信息...' });
    
    const { html, url: finalUrl } = await fetchPage(url);
    const $ = cheerio.load(html);
    
    // 提取小说信息
    const novel = extractNovelInfo($, finalUrl);
    
    // 提取章节列表
    const chapters = extractChapterList($, finalUrl);
    
    onProgress?.({ 
      phase: 'fetching_list', 
      message: `发现 ${chapters.length} 个章节`,
      totalChapters: chapters.length
    });
    
    return {
      success: true,
      novel,
      chapters,
      totalChapters: chapters.length
    };
  } catch (error: any) {
    onProgress?.({ phase: 'error', message: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 爬取指定范围的章节内容
 */
// 断点续爬：保存进度到文件
const PROGRESS_FILE = '/tmp/novels/.crawl_progress.json';

function saveProgress(novelTitle: string, chapters: Chapter[]) {
  const progressDir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true });
  }
  const progressData = {
    novelTitle,
    chapters: chapters.map(c => ({
      index: c.index,
      title: c.title,
      url: c.url,
      content: c.content,
      wordCount: c.wordCount
    })),
    savedAt: new Date().toISOString()
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progressData, null, 2));
}

function loadProgress(novelTitle: string): Chapter[] | null {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    if (data.novelTitle === novelTitle) {
      return data.chapters;
    }
  } catch (e) {
    // 忽略错误
  }
  return null;
}

export async function crawlChapters(
  chapters: Chapter[],
  startIndex: number,
  endIndex: number,
  onProgress?: ProgressCallback,
  novelTitle?: string
): Promise<Chapter[]> {
  const results: Chapter[] = [];
  const targetChapters = chapters.slice(startIndex, endIndex + 1);
  
  // 断点续爬：检查是否有已爬取的进度
  let skipCount = 0;
  if (novelTitle) {
    const savedProgress = loadProgress(novelTitle);
    if (savedProgress) {
      for (const saved of savedProgress) {
        if (saved.content && !saved.content.includes('[爬取失败]')) {
          const idx = targetChapters.findIndex(c => c.url === saved.url);
          if (idx >= 0) {
            results.push(saved);
            skipCount++;
          }
        }
      }
      if (skipCount > 0) {
        onProgress?.({
          phase: 'fetching_content',
          message: `检测到 ${skipCount} 个已完成章节，将跳过...`
        });
      }
    }
  }
  
  for (let i = 0; i < targetChapters.length; i++) {
    const chapter = targetChapters[i];
    
    // 跳过已爬取的章节
    if (results.some(r => r.url === chapter.url)) {
      continue;
    }
    
    const progress: CrawlProgress = {
      phase: 'fetching_content',
      currentChapter: startIndex + i + 1,
      totalChapters: chapters.length,
      currentTitle: chapter.title,
      message: `正在获取: ${chapter.title}`
    };
    onProgress?.(progress);
    
    try {
      const { html } = await fetchPage(chapter.url);
      const $ = cheerio.load(html);
      const content = extractChapterContent($);
      
      const crawledChapter: Chapter = {
        ...chapter,
        content,
        wordCount: content.length
      };
      
      results.push(crawledChapter);
      
      // 保存进度（支持断点续爬）
      if (novelTitle) {
        saveProgress(novelTitle, results);
      }
      
      // 随机延迟 0.5-2 秒
      const delay = 500 + Math.random() * 1500;
      await new Promise(r => setTimeout(r, delay));
    } catch (error: any) {
      console.error(`[Crawler] 章节 ${chapter.title} 爬取失败:`, error.message);
      results.push({
        ...chapter,
        content: `[爬取失败: ${error.message}]`
      });
    }
  }
  
  // 清理进度文件
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
  } catch (e) {
    // 忽略
  }
  
  return results;
}

// ==================== 导出功能 ====================

/**
 * 导出为 TXT 格式
 */
export function exportToTxt(novel: NovelInfo, chapters: Chapter[]): string {
  let content = `${novel.title}\n`;
  if (novel.author) content += `作者: ${novel.author}\n`;
  content += `\n${'='.repeat(50)}\n\n`;
  
  if (novel.description) {
    content += `简介:\n${novel.description}\n\n${'='.repeat(50)}\n\n`;
  }
  
  for (const chapter of chapters) {
    content += `${chapter.title}\n\n`;
    if (chapter.content) {
      content += `${chapter.content}\n\n`;
    }
    content += `${'─'.repeat(30)}\n\n`;
  }
  
  return content;
}

/**
 * 导出为 Markdown 格式
 */
export function exportToMarkdown(novel: NovelInfo, chapters: Chapter[]): string {
  let content = `# ${novel.title}\n\n`;
  if (novel.author) content += `**作者**: ${novel.author}\n\n`;
  if (novel.description) content += `**简介**:\n\n${novel.description}\n\n`;
  content += `---\n\n`;
  content += `## 目录\n\n`;
  
  for (const chapter of chapters) {
    content += `- [${chapter.title}](#${chapter.index + 1})\n`;
  }
  
  content += `\n---\n\n`;
  
  for (const chapter of chapters) {
    content += `## ${chapter.index + 1}. ${chapter.title}\n\n`;
    if (chapter.content) {
      content += `${chapter.content.replace(/\n/g, '\n\n')}\n\n`;
    }
    content += `---\n\n`;
  }
  
  return content;
}

/**
 * 导出为 HTML 格式
 */
export function exportToHtml(novel: NovelInfo, chapters: Chapter[]): string {
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${novel.title}</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; background: #fafafa; }
    h1 { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .meta { text-align: center; color: #666; margin-bottom: 30px; }
    .description { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .chapter { margin-bottom: 40px; page-break-after: always; }
    h2 { color: #444; border-left: 4px solid #007bff; padding-left: 10px; }
    p { text-indent: 2em; margin: 10px 0; }
    .nav { position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-height: 80vh; overflow-y: auto; }
    .nav a { display: block; color: #007bff; text-decoration: none; padding: 5px; }
    .nav a:hover { background: #f0f0f0; }
  </style>
</head>
<body>
  <div class="nav">
    <a href="#top">返回顶部</a>
    ${chapters.map(c => `<a href="#chapter-${c.index}">${c.title}</a>`).join('\n    ')}
  </div>
  <h1>${novel.title}</h1>
  <div class="meta">
    ${novel.author ? `<p>作者: ${novel.author}</p>` : ''}
  </div>
  ${novel.description ? `<div class="description"><p>${novel.description}</p></div>` : ''}
`;
  
  for (const chapter of chapters) {
    html += `
  <div class="chapter" id="chapter-${chapter.index}">
    <h2>${chapter.title}</h2>
    ${chapter.content ? chapter.content.split('\n').map(p => `<p>${p.trim()}</p>`).join('\n') : ''}
  </div>`;
  }
  
  html += `
</body>
</html>`;
  
  return html;
}

/**
 * 保存文件
 */
export async function saveFile(
  content: string,
  filename: string,
  format: 'txt' | 'md' | 'html' | 'json',
  outputDir: string = '/tmp/novels'
): Promise<string> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const extension = format === 'md' ? 'md' : format === 'html' ? 'html' : format === 'json' ? 'json' : 'txt';
  const filepath = path.join(outputDir, `${filename}.${extension}`);
  
  fs.writeFileSync(filepath, content, 'utf-8');
  
  return filepath;
}

// ==================== 完整爬取流程 ====================

export interface CrawlOptions {
  url: string;
  startChapter?: number;
  endChapter?: number;
  format?: 'txt' | 'md' | 'html' | 'json';
  outputDir?: string;
}

export interface CrawlFullResult {
  success: boolean;
  novel?: NovelInfo;
  chapters?: Chapter[];
  filepath?: string;
  totalWords?: number;
  error?: string;
}

/**
 * 完整的小说爬取流程
 */
export async function crawlNovel(
  options: CrawlOptions,
  onProgress?: ProgressCallback
): Promise<CrawlFullResult> {
  const { url, startChapter = 0, endChapter, format = 'txt', outputDir = '/tmp/novels' } = options;
  
  try {
    // 1. 分析页面
    onProgress?.({ phase: 'fetching_list', message: '正在分析页面...' });
    const analyzeResult = await analyzeNovelPage(url, onProgress);
    
    if (!analyzeResult.success || !analyzeResult.chapters?.length) {
      return {
        success: false,
        error: analyzeResult.error || '未能找到章节列表'
      };
    }
    
    // 2. 确定范围
    const totalCount = analyzeResult.chapters.length;
    const start = Math.max(0, startChapter);
    const end = Math.min(totalCount - 1, endChapter ?? totalCount - 1);
    
    onProgress?.({ 
      phase: 'fetching_content', 
      message: `开始爬取第 ${start + 1} 到 ${end + 1} 章，共 ${end - start + 1} 章`,
      totalChapters: end - start + 1
    });
    
    // 3. 爬取章节内容
    const chapters = await crawlChapters(
      analyzeResult.chapters,
      start,
      end,
      onProgress,
      analyzeResult.novel?.title
    );
    
    // 4. 导出
    onProgress?.({ phase: 'exporting', message: '正在导出文件...' });
    
    let content: string;
    switch (format) {
      case 'md':
        content = exportToMarkdown(analyzeResult.novel!, chapters);
        break;
      case 'html':
        content = exportToHtml(analyzeResult.novel!, chapters);
        break;
      case 'json':
        content = JSON.stringify({ novel: analyzeResult.novel, chapters }, null, 2);
        break;
      default:
        content = exportToTxt(analyzeResult.novel!, chapters);
    }
    
    // 清理文件名
    const safeTitle = (analyzeResult.novel?.title || 'novel')
      .replace(/[\/\\:*?"<>|]/g, '_')
      .substring(0, 50);
    
    const filepath = await saveFile(content, safeTitle, format, outputDir);
    
    const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    
    onProgress?.({ 
      phase: 'completed', 
      message: `爬取完成！共 ${chapters.length} 章，约 ${totalWords} 字`,
      totalChapters: chapters.length
    });
    
    return {
      success: true,
      novel: analyzeResult.novel,
      chapters,
      filepath,
      totalWords
    };
    
  } catch (error: any) {
    onProgress?.({ phase: 'error', message: error.message });
    return {
      success: false,
      error: error.message
    };
  } finally {
    // 关闭浏览器
    await closeBrowser();
  }
}

export default {
  analyzeNovelPage,
  crawlChapters,
  crawlNovel,
  exportToTxt,
  exportToMarkdown,
  exportToHtml,
  saveFile
};