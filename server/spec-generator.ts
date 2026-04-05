/**
 * 爬取规范生成器
 * 生成标准化的爬取规范 Markdown 文件
 */

import * as fs from 'fs';
import * as path from 'path';
import type { WebsiteAnalysis } from './analyzer.js';

export interface CrawlSpec {
  websiteName: string;
  baseUrl: string;
  generatedAt: string;
  analysis: WebsiteAnalysis;
}

/**
 * 生成爬取规范 Markdown 文件
 */
export function generateSpecMd(spec: CrawlSpec): string {
  const { websiteName, baseUrl, generatedAt, analysis } = spec;
  
  const md = `# ${websiteName} 爬取规范

## 网站信息

| 项目 | 值 |
|------|-----|
| 网站名称 | ${websiteName} |
| 基础 URL | ${baseUrl} |
| 网站类型 | ${getWebsiteTypeName(analysis.type)} |
| 编码格式 | ${analysis.encoding} |
| 生成时间 | ${generatedAt} |

## 目录页规范

### 目录页 URL

\`\`\`
${baseUrl}
\`\`\`

### 章节列表提取

| 项目 | 内容 |
|------|------|
| 推荐选择器 | \`${analysis.catalog?.selectors[0] || '需手动分析'}\` |
| 备选选择器 | ${analysis.catalog?.selectors.slice(1).map(s => `\`${s}\``).join(', ') || '无'} |
| 是否分页 | ${analysis.catalog?.pagination ? '是' : '否'} |
| 分页选择器 | \`${analysis.catalog?.paginationSelector || '无'}\` |
| 加载更多 | \`${analysis.catalog?.loadMoreButton || '无'}\` |

### 章节链接提取规则

\`\`\`javascript
// 伪代码
const chapters = document.querySelectorAll('${analysis.catalog?.selectors[0] || 'a'}');
const links = Array.from(chapters).map(a => ({
  title: a.textContent.trim(),
  url: a.href
}));
\`\`\`

## 章节页规范

### 章节标题提取

| 优先级 | 选择器 |
|--------|--------|
${analysis.chapter?.titleSelectors.map((s, i) => `| ${i + 1} | \`${s}\` |`).join('\n') || '| 1 | 需手动分析 |'}

### 正文内容提取

| 优先级 | 选择器 | 说明 |
|--------|--------|------|
${analysis.chapter?.contentSelectors.map((s, i) => `| ${i + 1} | \`${s}\` | ${getSelectorDescription(s)} |`).join('\n') || '| 1 | 需手动分析 | - |'}

### 需要过滤的元素

\`\`\`css
${analysis.chapter?.noiseSelectors.join('\n') || '/* 无需过滤 */'}
\`\`\`

### 内容清理规则

- 移除广告文字：包含"广告"、"推荐阅读"等关键词
- 移除导航链接：章节末尾的"上一章"、"下一章"
- 移除空段落：纯空白内容的 \`<p>\` 标签
- 清理特殊字符：全角空格、多余换行符

### 正文分页处理

| 项目 | 内容 |
|------|------|
| 是否分页 | ${analysis.navigation?.nextPage ? '可能需要' : '否'} |
| 下一页选择器 | \`${analysis.navigation?.nextPage || '无'}\` |
| 上一页选择器 | \`${analysis.navigation?.prevPage || '无'}\` |
| 结束标记 | 正文中出现"本章完"或无下一页链接 |

## 导航链接规范

| 导航类型 | 选择器 | 状态 |
|----------|--------|------|
| 上一章 | \`${analysis.navigation?.prevChapter || '未检测到'}\` | ${analysis.navigation?.prevChapter ? '✓' : '✗'} |
| 下一章 | \`${analysis.navigation?.nextChapter || '未检测到'}\` | ${analysis.navigation?.nextChapter ? '✓' : '✗'} |
| 返回目录 | \`${analysis.navigation?.backToCatalog || '未检测到'}\` | ${analysis.navigation?.backToCatalog ? '✓' : '✗'} |

## 反爬策略

| 检测项 | 状态 | 处理方案 |
|--------|------|----------|
| User-Agent | ${analysis.antiCrawl?.userAgent ? '需要' : '不需要'} | 设置常见浏览器 UA |
| Referer | ${analysis.antiCrawl?.referer ? '需要' : '建议'} | 设置为目录页 URL |
| Cookie | ${analysis.antiCrawl?.cookie ? '需要' : '不需要'} | ${analysis.antiCrawl?.cookie ? '手动登录后获取' : '无需处理'} |
| 验证码 | ${analysis.antiCrawl?.captcha ? '可能存在' : '未检测到'} | ${analysis.antiCrawl?.captcha ? '人工处理或暂停爬取' : '无需处理'} |
| JS 渲染 | ${analysis.antiCrawl?.javascript ? '需要' : '不需要'} | ${analysis.antiCrawl?.javascript ? '使用 Playwright 渲染' : '可直接请求'} |
| 建议延迟 | ${analysis.antiCrawl?.delay || 1} 秒 | 随机延迟 1-${(analysis.antiCrawl?.delay || 1) + 2} 秒 |

### 请求头配置

\`\`\`javascript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': '${baseUrl}',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
};
\`\`\`

## 爬取建议

${analysis.recommendations.map(r => `- ${r}`).join('\n')}

## 爬取伪代码

\`\`\`
1. 检查 robots.txt 是否允许爬取
2. 访问目录页: ${baseUrl}
3. 使用选择器 "${analysis.catalog?.selectors[0] || '需手动分析'}" 提取所有章节链接
4. 遍历章节链接:
   a. 访问章节页
   b. 使用选择器 "${analysis.chapter?.contentSelectors[0] || '需手动分析'}" 提取正文
   c. 过滤噪音元素
   d. 检查并处理分页（如有）
   e. 保存内容
   f. 随机延迟 ${analysis.antiCrawl?.delay || 1}-${(analysis.antiCrawl?.delay || 1) + 2} 秒
5. 导出为指定格式
\`\`\`

## 错误处理

| 错误类型 | 处理方案 |
|----------|----------|
| 章节不存在 | 跳过并记录，继续下一章 |
| 内容为空 | 重试 3 次，失败则标记为待手动处理 |
| 网络超时 | 等待 5 秒后重试，最多 3 次 |
| 验证码出现 | 暂停爬取，提示用户人工处理 |
| 403 禁止访问 | 降低频率，增加延迟，更换 UA |

## 测试用例

### 目录页测试

- 测试 URL: \`${baseUrl}\`
- 预期章节数: 待验证
- 选择器测试: 在浏览器控制台执行 \`document.querySelectorAll('${analysis.catalog?.selectors[0] || 'a'}')\`

### 章节页测试

- 测试 URL: 需要提供具体章节 URL
- 预期内容: 正文字数 > 500
- 选择器测试: 在浏览器控制台执行 \`document.querySelector('${analysis.chapter?.contentSelectors[0] || '#content'}').textContent\`

---

**生成工具**: Novel Crawler Spec Generator v1.0  
**生成时间**: ${generatedAt}  
**注意事项**: 本规范仅供学习研究使用，请遵守相关法律法规和网站规则
`;

  return md;
}

function getWebsiteTypeName(type: string): string {
  const names: Record<string, string> = {
    'traditional': '传统目录型',
    'reading': '阅读页型',
    'paginated': '分页型',
    'scroll_load': '滚动加载型',
    'anti_crawl': '反爬型'
  };
  return names[type] || type;
}

function getSelectorDescription(selector: string): string {
  if (selector.startsWith('#')) return 'ID 选择器，最精确';
  if (selector.startsWith('.')) return '类名选择器，常用';
  if (selector === 'article') return 'HTML5 语义标签';
  return '通用选择器';
}

/**
 * 保存规范文件
 */
export function saveSpecFile(
  spec: CrawlSpec,
  outputDir: string = '/tmp/novels/specs'
): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const safeName = spec.websiteName
    .replace(/[\/\\:*?"<>|]/g, '_')
    .substring(0, 50);
  
  const filename = `${safeName}_爬取规范.md`;
  const filepath = path.join(outputDir, filename);
  
  const content = generateSpecMd(spec);
  fs.writeFileSync(filepath, content, 'utf-8');
  
  return filepath;
}

/**
 * 从分析结果生成完整规范
 */
export function generateCrawlSpec(
  analysis: WebsiteAnalysis,
  websiteName?: string
): CrawlSpec {
  const name = websiteName || new URL(analysis.url).hostname || '未知网站';
  
  return {
    websiteName: name,
    baseUrl: analysis.url,
    generatedAt: new Date().toLocaleString('zh-CN'),
    analysis
  };
}

export default {
  generateSpecMd,
  saveSpecFile,
  generateCrawlSpec
};