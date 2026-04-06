/**
 * 小说爬取工具模块
 * 支持智能识别章节列表、内容解析、多格式导出
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
var execAsync = promisify(exec);
// ==================== 浏览器获取 ====================
var playwrightBrowser = null;
function getBrowser() {
    return __awaiter(this, void 0, void 0, function () {
        var chromium, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (playwrightBrowser)
                        return [2 /*return*/, playwrightBrowser];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, import('playwright')];
                case 2:
                    chromium = (_a.sent()).chromium;
                    return [4 /*yield*/, chromium.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })];
                case 3:
                    playwrightBrowser = _a.sent();
                    return [2 /*return*/, playwrightBrowser];
                case 4:
                    error_1 = _a.sent();
                    throw new Error('无法启动浏览器，请确保 Playwright 已正确安装');
                case 5: return [2 /*return*/];
            }
        });
    });
}
function closeBrowser() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!playwrightBrowser) return [3 /*break*/, 2];
                    return [4 /*yield*/, playwrightBrowser.close()];
                case 1:
                    _a.sent();
                    playwrightBrowser = null;
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function fetchPage(url_1) {
    return __awaiter(this, arguments, void 0, function (url, retryCount) {
        var browser, lastError, userAgents, _loop_1, i, state_1;
        if (retryCount === void 0) { retryCount = 3; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getBrowser()];
                case 1:
                    browser = _a.sent();
                    lastError = null;
                    userAgents = [
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    ];
                    _loop_1 = function (i) {
                        var context, page, response, hasCaptcha, expandBtn, j, e_1, html, finalUrl, statusCode, error_2, delay_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, browser.newContext({
                                        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)]
                                    })];
                                case 1:
                                    context = _b.sent();
                                    return [4 /*yield*/, context.newPage()];
                                case 2:
                                    page = _b.sent();
                                    _b.label = 3;
                                case 3:
                                    _b.trys.push([3, 21, 24, 26]);
                                    // 设置超时
                                    page.setDefaultTimeout(30000);
                                    return [4 /*yield*/, page.goto(url, { waitUntil: 'domcontentloaded' })];
                                case 4:
                                    response = _b.sent();
                                    return [4 /*yield*/, page.$('.captcha, #captcha, .verify-code, .geetest')];
                                case 5:
                                    hasCaptcha = _b.sent();
                                    if (!hasCaptcha) return [3 /*break*/, 7];
                                    console.log("[Crawler] \u68C0\u6D4B\u5230\u9A8C\u8BC1\u7801\uFF0C\u7B49\u5F85\u5904\u7406...");
                                    return [4 /*yield*/, page.waitForTimeout(5000)];
                                case 6:
                                    _b.sent();
                                    _b.label = 7;
                                case 7: 
                                // 等待主要内容加载
                                return [4 /*yield*/, page.waitForTimeout(1000 + Math.random() * 1000)];
                                case 8:
                                    // 等待主要内容加载
                                    _b.sent();
                                    _b.label = 9;
                                case 9:
                                    _b.trys.push([9, 16, , 17]);
                                    return [4 /*yield*/, page.$('.load-more, .expand, .show-all, [class*="more"]:visible')];
                                case 10:
                                    expandBtn = _b.sent();
                                    if (!expandBtn) return [3 /*break*/, 15];
                                    j = 0;
                                    _b.label = 11;
                                case 11:
                                    if (!(j < 5)) return [3 /*break*/, 15];
                                    return [4 /*yield*/, expandBtn.click().catch(function () { })];
                                case 12:
                                    _b.sent();
                                    return [4 /*yield*/, page.waitForTimeout(500)];
                                case 13:
                                    _b.sent();
                                    _b.label = 14;
                                case 14:
                                    j++;
                                    return [3 /*break*/, 11];
                                case 15: return [3 /*break*/, 17];
                                case 16:
                                    e_1 = _b.sent();
                                    return [3 /*break*/, 17];
                                case 17: 
                                // 滚动到底部触发懒加载
                                return [4 /*yield*/, page.evaluate(function () {
                                        window.scrollTo(0, document.body.scrollHeight);
                                    }).catch(function () { })];
                                case 18:
                                    // 滚动到底部触发懒加载
                                    _b.sent();
                                    return [4 /*yield*/, page.waitForTimeout(500)];
                                case 19:
                                    _b.sent();
                                    return [4 /*yield*/, page.content()];
                                case 20:
                                    html = _b.sent();
                                    finalUrl = page.url();
                                    statusCode = (response === null || response === void 0 ? void 0 : response.status()) || 200;
                                    return [2 /*return*/, { value: { html: html, url: finalUrl, statusCode: statusCode } }];
                                case 21:
                                    error_2 = _b.sent();
                                    lastError = error_2;
                                    console.error("[Crawler] \u7B2C ".concat(i + 1, " \u6B21\u5C1D\u8BD5\u5931\u8D25:"), error_2.message);
                                    if (!(i < retryCount - 1)) return [3 /*break*/, 23];
                                    delay_1 = Math.pow(2, i) * 1000 + Math.random() * 1000;
                                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, delay_1); })];
                                case 22:
                                    _b.sent();
                                    _b.label = 23;
                                case 23: return [3 /*break*/, 26];
                                case 24: return [4 /*yield*/, context.close()];
                                case 25:
                                    _b.sent();
                                    return [7 /*endfinally*/];
                                case 26: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < retryCount)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(i)];
                case 3:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: throw lastError || new Error('抓取页面失败');
            }
        });
    });
}
// ==================== 章节列表识别 ====================
var CHAPTER_PATTERNS = {
    // 常见的章节列表选择器
    selectors: [
        '#list dd a', // 笔趣阁系列
        '#list a', // 列表
        '.chapter-list a', // 章节列表
        '#chapters a', // 章节列表
        '.list-chapter a', // 章节列表
        '.catalog a', // 目录
        '.chapter-list-box a', // 章节盒子
        '#chapter-list a', // 章节列表
        '.book-list a', // 书籍列表
        '.menu_list a', // 菜单列表
        'ul.chapter-list a', // UL章节列表
        '.chapter-ul a', // 章节UL
        '.chapter-item', // 章节项
        'div.listmain a', // 列表主页
        '.zjlist a', // 章节列表
        // 新增：更多常见选择器
        '.read_chapters a', // 阅读章节
        '.read_list a', // 阅读列表
        '#chapterlist a', // 章节列表
        '.list_box a', // 列表盒子
        '.book-chapter-list a', // 书籍章节列表
        '.chapter-list-wrap a', // 章节列表包装
        '.chapterbar a', // 章节栏
        '.article-list a', // 文章列表
        '.section-list a', // 节列表
        'dl dd a', // 定义列表
        'ul li a', // 通用列表
        '.list a', // 列表
        'dd a', // dd 链接
    ],
    // 章节标题正则
    titlePatterns: [
        /^第[一二三四五六七八九十百千万零\d]+[章节回集]/,
        /^[第][\d]+[章节回]/,
        /^[【\[]?[\d]+[】\]]/,
        /^Chapter\s*\d+/i,
        /^CHAPTER\s*\d+/i,
        /^\d+[\.\、]/,
        /^[\d]+$/, // 纯数字
    ]
};
function extractChapterList($, baseUrl) {
    var chapters = [];
    var seenUrls = new Set();
    // 尝试各种选择器
    for (var _i = 0, _a = CHAPTER_PATTERNS.selectors; _i < _a.length; _i++) {
        var selector = _a[_i];
        var links = $(selector);
        if (links.length > 0) {
            links.each(function (index, element) {
                var $link = $(element);
                var href = $link.attr('href');
                var title = $link.text().trim();
                if (href && title && href !== '#' && !href.startsWith('javascript:')) {
                    // 放宽标题匹配：短标题或符合章节模式
                    var isChapterLike = CHAPTER_PATTERNS.titlePatterns.some(function (p) { return p.test(title); }) ||
                        (title.length > 0 && title.length < 50);
                    if (isChapterLike) {
                        try {
                            var fullUrl = new URL(href, baseUrl).href;
                            if (!seenUrls.has(fullUrl)) {
                                seenUrls.add(fullUrl);
                                chapters.push({
                                    index: chapters.length,
                                    title: title,
                                    url: fullUrl
                                });
                            }
                        }
                        catch (e) {
                            // URL 解析失败，忽略
                        }
                    }
                }
            });
            // 如果找到超过 3 个章节，认为选择器有效，停止尝试
            if (chapters.length > 3) {
                console.log("[Crawler] \u4F7F\u7528\u9009\u62E9\u5668 \"".concat(selector, "\" \u627E\u5230 ").concat(chapters.length, " \u4E2A\u7AE0\u8282"));
                return chapters;
            }
        }
    }
    // 如果还是没找到，尝试智能检测：查找包含大量链接的区域
    if (chapters.length <= 3) {
        console.log('[Crawler] 常规选择器未找到足够章节，尝试智能检测...');
        // 查找链接密度高的区域
        var containers = $('div, section, main, article, ul, ol, dl');
        var bestContainerInfo_1 = [];
        containers.each(function (_, el) {
            var $container = $(el);
            var links = $container.find('a[href]');
            var validCount = 0;
            links.each(function (__, link) {
                var href = $(link).attr('href');
                var text = $(link).text().trim();
                if (href && text && text.length < 50 && !href.startsWith('#') && !href.startsWith('javascript:')) {
                    validCount++;
                }
            });
            if (validCount > 5) {
                var id = $container.attr('id');
                var cls = $container.attr('class');
                bestContainerInfo_1.push({
                    selector: id ? "#".concat(id) : (cls ? ".".concat(cls.split(' ')[0]) : 'unknown'),
                    count: validCount
                });
            }
        });
        // 找到链接最多的容器
        if (bestContainerInfo_1.length > 0) {
            bestContainerInfo_1.sort(function (a, b) { return b.count - a.count; });
            var best = bestContainerInfo_1[0];
            if (best.count > 10) {
                console.log("[Crawler] \u667A\u80FD\u68C0\u6D4B\u5230\u9AD8\u5BC6\u5EA6\u94FE\u63A5\u533A\u57DF: ".concat(best.selector, " (").concat(best.count, " \u94FE\u63A5)"));
                // 重新从这个容器提取
                $('a').each(function (_, element) {
                    var $link = $(element);
                    var href = $link.attr('href');
                    var title = $link.text().trim();
                    if (href && title && !href.startsWith('#') && !href.startsWith('javascript:') && title.length < 50) {
                        try {
                            var fullUrl = new URL(href, baseUrl).href;
                            if (!seenUrls.has(fullUrl)) {
                                // 检查 URL 是否像章节链接（包含数字或特定路径）
                                var urlPath = new URL(fullUrl).pathname;
                                if (/\d+|chapter|read|novel|\.\w+$/.test(urlPath) || CHAPTER_PATTERNS.titlePatterns.some(function (p) { return p.test(title); })) {
                                    seenUrls.add(fullUrl);
                                    chapters.push({
                                        index: chapters.length,
                                        title: title,
                                        url: fullUrl
                                    });
                                }
                            }
                        }
                        catch (e) {
                            // URL 解析失败，忽略
                        }
                    }
                });
            }
        }
    }
    // 过滤掉明显不是章节的链接（如导航、广告等）
    var filteredChapters = chapters.filter(function (ch) {
        var title = ch.title.toLowerCase();
        var url = ch.url.toLowerCase();
        // 排除关键词
        var excludeKeywords = ['首页', '首页', '登录', '注册', '收藏', '书架', '下载', 'app', '返回', '上一页', '下一页', 'more', '更多'];
        if (excludeKeywords.some(function (k) { return title.includes(k); }))
            return false;
        // 排除非内容链接
        if (url.includes('/user/') || url.includes('/login') || url.includes('/register'))
            return false;
        return true;
    });
    console.log("[Crawler] \u6700\u7EC8\u627E\u5230 ".concat(filteredChapters.length, " \u4E2A\u7AE0\u8282"));
    return filteredChapters;
}
function extractNovelInfo($, url) {
    var novel = { title: '未知小说' };
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
var CONTENT_SELECTORS = [
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
var NOISE_SELECTORS = [
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
function extractChapterContent($) {
    // 尝试每个内容选择器
    for (var _i = 0, CONTENT_SELECTORS_1 = CONTENT_SELECTORS; _i < CONTENT_SELECTORS_1.length; _i++) {
        var selector = CONTENT_SELECTORS_1[_i];
        var $content = $(selector);
        if ($content.length > 0) {
            // 移除噪音元素
            for (var _a = 0, NOISE_SELECTORS_1 = NOISE_SELECTORS; _a < NOISE_SELECTORS_1.length; _a++) {
                var noise = NOISE_SELECTORS_1[_a];
                $content.find(noise).remove();
            }
            var text = $content.text().trim();
            if (text.length > 100) {
                return cleanContent(text);
            }
        }
    }
    // 如果没有找到，尝试获取最长的段落组合
    var paragraphs = [];
    $('p').each(function (_, element) {
        var text = $(element).text().trim();
        if (text.length > 20 && !isNoise(text)) {
            paragraphs.push(text);
        }
    });
    if (paragraphs.length > 0) {
        return paragraphs.join('\n\n');
    }
    return '';
}
function cleanContent(content) {
    // 移除常见的广告和噪音文本
    var noisePatterns = [
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
    var cleaned = content;
    for (var _i = 0, noisePatterns_1 = noisePatterns; _i < noisePatterns_1.length; _i++) {
        var pattern = noisePatterns_1[_i];
        cleaned = cleaned.replace(pattern, '');
    }
    // 合并多余空行
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
}
function isNoise(text) {
    var noiseKeywords = ['广告', '推荐', '点击', '分享', '收藏', '举报', '返回', '下一章'];
    return noiseKeywords.some(function (k) { return text.includes(k); }) && text.length < 50;
}
// ==================== 主要功能 ====================
/**
 * 分析小说页面，提取书籍信息和章节列表
 */
export function analyzeNovelPage(url, onProgress) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, html, finalUrl, $, novel, chapters, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({ phase: 'fetching_list', message: '正在获取页面信息...' });
                    return [4 /*yield*/, fetchPage(url)];
                case 1:
                    _a = _b.sent(), html = _a.html, finalUrl = _a.url;
                    $ = cheerio.load(html);
                    novel = extractNovelInfo($, finalUrl);
                    chapters = extractChapterList($, finalUrl);
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                        phase: 'fetching_list',
                        message: "\u53D1\u73B0 ".concat(chapters.length, " \u4E2A\u7AE0\u8282"),
                        totalChapters: chapters.length
                    });
                    return [2 /*return*/, {
                            success: true,
                            novel: novel,
                            chapters: chapters,
                            totalChapters: chapters.length
                        }];
                case 2:
                    error_3 = _b.sent();
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({ phase: 'error', message: error_3.message });
                    return [2 /*return*/, {
                            success: false,
                            error: error_3.message
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * 爬取指定范围的章节内容
 */
// 断点续爬：保存进度到文件
var PROGRESS_FILE = '/tmp/novels/.crawl_progress.json';
function saveProgress(novelTitle, chapters) {
    var progressDir = path.dirname(PROGRESS_FILE);
    if (!fs.existsSync(progressDir)) {
        fs.mkdirSync(progressDir, { recursive: true });
    }
    var progressData = {
        novelTitle: novelTitle,
        chapters: chapters.map(function (c) { return ({
            index: c.index,
            title: c.title,
            url: c.url,
            content: c.content,
            wordCount: c.wordCount
        }); }),
        savedAt: new Date().toISOString()
    };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progressData, null, 2));
}
function loadProgress(novelTitle) {
    try {
        if (!fs.existsSync(PROGRESS_FILE))
            return null;
        var data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
        if (data.novelTitle === novelTitle) {
            return data.chapters;
        }
    }
    catch (e) {
        // 忽略错误
    }
    return null;
}
export function crawlChapters(chapters, startIndex, endIndex, onProgress, novelTitle) {
    return __awaiter(this, void 0, void 0, function () {
        var results, targetChapters, skipCount, savedProgress, _loop_2, _i, savedProgress_1, saved, _loop_3, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    targetChapters = chapters.slice(startIndex, endIndex + 1);
                    skipCount = 0;
                    if (novelTitle) {
                        savedProgress = loadProgress(novelTitle);
                        if (savedProgress) {
                            _loop_2 = function (saved) {
                                if (saved.content && !saved.content.includes('[爬取失败]')) {
                                    var idx = targetChapters.findIndex(function (c) { return c.url === saved.url; });
                                    if (idx >= 0) {
                                        results.push(saved);
                                        skipCount++;
                                    }
                                }
                            };
                            for (_i = 0, savedProgress_1 = savedProgress; _i < savedProgress_1.length; _i++) {
                                saved = savedProgress_1[_i];
                                _loop_2(saved);
                            }
                            if (skipCount > 0) {
                                onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                                    phase: 'fetching_content',
                                    message: "\u68C0\u6D4B\u5230 ".concat(skipCount, " \u4E2A\u5DF2\u5B8C\u6210\u7AE0\u8282\uFF0C\u5C06\u8DF3\u8FC7...")
                                });
                            }
                        }
                    }
                    _loop_3 = function (i) {
                        var chapter, progress, html, $, content, crawledChapter, delay_2, error_4;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    chapter = targetChapters[i];
                                    // 跳过已爬取的章节
                                    if (results.some(function (r) { return r.url === chapter.url; })) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    progress = {
                                        phase: 'fetching_content',
                                        currentChapter: startIndex + i + 1,
                                        totalChapters: chapters.length,
                                        currentTitle: chapter.title,
                                        message: "\u6B63\u5728\u83B7\u53D6: ".concat(chapter.title)
                                    };
                                    onProgress === null || onProgress === void 0 ? void 0 : onProgress(progress);
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 4, , 5]);
                                    return [4 /*yield*/, fetchPage(chapter.url)];
                                case 2:
                                    html = (_b.sent()).html;
                                    $ = cheerio.load(html);
                                    content = extractChapterContent($);
                                    crawledChapter = __assign(__assign({}, chapter), { content: content, wordCount: content.length });
                                    results.push(crawledChapter);
                                    // 保存进度（支持断点续爬）
                                    if (novelTitle) {
                                        saveProgress(novelTitle, results);
                                    }
                                    delay_2 = 500 + Math.random() * 1500;
                                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, delay_2); })];
                                case 3:
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_4 = _b.sent();
                                    console.error("[Crawler] \u7AE0\u8282 ".concat(chapter.title, " \u722C\u53D6\u5931\u8D25:"), error_4.message);
                                    results.push(__assign(__assign({}, chapter), { content: "[\u722C\u53D6\u5931\u8D25: ".concat(error_4.message, "]") }));
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < targetChapters.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_3(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    // 清理进度文件
                    try {
                        if (fs.existsSync(PROGRESS_FILE)) {
                            fs.unlinkSync(PROGRESS_FILE);
                        }
                    }
                    catch (e) {
                        // 忽略
                    }
                    return [2 /*return*/, results];
            }
        });
    });
}
// ==================== 导出功能 ====================
/**
 * 导出为 TXT 格式
 */
export function exportToTxt(novel, chapters) {
    var content = "".concat(novel.title, "\n");
    if (novel.author)
        content += "\u4F5C\u8005: ".concat(novel.author, "\n");
    content += "\n".concat('='.repeat(50), "\n\n");
    if (novel.description) {
        content += "\u7B80\u4ECB:\n".concat(novel.description, "\n\n").concat('='.repeat(50), "\n\n");
    }
    for (var _i = 0, chapters_1 = chapters; _i < chapters_1.length; _i++) {
        var chapter = chapters_1[_i];
        content += "".concat(chapter.title, "\n\n");
        if (chapter.content) {
            content += "".concat(chapter.content, "\n\n");
        }
        content += "".concat('─'.repeat(30), "\n\n");
    }
    return content;
}
/**
 * 导出为 Markdown 格式
 */
export function exportToMarkdown(novel, chapters) {
    var content = "# ".concat(novel.title, "\n\n");
    if (novel.author)
        content += "**\u4F5C\u8005**: ".concat(novel.author, "\n\n");
    if (novel.description)
        content += "**\u7B80\u4ECB**:\n\n".concat(novel.description, "\n\n");
    content += "---\n\n";
    content += "## \u76EE\u5F55\n\n";
    for (var _i = 0, chapters_2 = chapters; _i < chapters_2.length; _i++) {
        var chapter = chapters_2[_i];
        content += "- [".concat(chapter.title, "](#").concat(chapter.index + 1, ")\n");
    }
    content += "\n---\n\n";
    for (var _a = 0, chapters_3 = chapters; _a < chapters_3.length; _a++) {
        var chapter = chapters_3[_a];
        content += "## ".concat(chapter.index + 1, ". ").concat(chapter.title, "\n\n");
        if (chapter.content) {
            content += "".concat(chapter.content.replace(/\n/g, '\n\n'), "\n\n");
        }
        content += "---\n\n";
    }
    return content;
}
/**
 * 导出为 HTML 格式
 */
export function exportToHtml(novel, chapters) {
    var html = "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>".concat(novel.title, "</title>\n  <style>\n    body { font-family: \"Microsoft YaHei\", sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; background: #fafafa; }\n    h1 { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }\n    .meta { text-align: center; color: #666; margin-bottom: 30px; }\n    .description { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 30px; }\n    .chapter { margin-bottom: 40px; page-break-after: always; }\n    h2 { color: #444; border-left: 4px solid #007bff; padding-left: 10px; }\n    p { text-indent: 2em; margin: 10px 0; }\n    .nav { position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-height: 80vh; overflow-y: auto; }\n    .nav a { display: block; color: #007bff; text-decoration: none; padding: 5px; }\n    .nav a:hover { background: #f0f0f0; }\n  </style>\n</head>\n<body>\n  <div class=\"nav\">\n    <a href=\"#top\">\u8FD4\u56DE\u9876\u90E8</a>\n    ").concat(chapters.map(function (c) { return "<a href=\"#chapter-".concat(c.index, "\">").concat(c.title, "</a>"); }).join('\n    '), "\n  </div>\n  <h1>").concat(novel.title, "</h1>\n  <div class=\"meta\">\n    ").concat(novel.author ? "<p>\u4F5C\u8005: ".concat(novel.author, "</p>") : '', "\n  </div>\n  ").concat(novel.description ? "<div class=\"description\"><p>".concat(novel.description, "</p></div>") : '', "\n");
    for (var _i = 0, chapters_4 = chapters; _i < chapters_4.length; _i++) {
        var chapter = chapters_4[_i];
        html += "\n  <div class=\"chapter\" id=\"chapter-".concat(chapter.index, "\">\n    <h2>").concat(chapter.title, "</h2>\n    ").concat(chapter.content ? chapter.content.split('\n').map(function (p) { return "<p>".concat(p.trim(), "</p>"); }).join('\n') : '', "\n  </div>");
    }
    html += "\n</body>\n</html>";
    return html;
}
/**
 * 保存文件
 */
export function saveFile(content_1, filename_1, format_1) {
    return __awaiter(this, arguments, void 0, function (content, filename, format, outputDir) {
        var extension, filepath;
        if (outputDir === void 0) { outputDir = '/tmp/novels'; }
        return __generator(this, function (_a) {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            extension = format === 'md' ? 'md' : format === 'html' ? 'html' : format === 'json' ? 'json' : 'txt';
            filepath = path.join(outputDir, "".concat(filename, ".").concat(extension));
            fs.writeFileSync(filepath, content, 'utf-8');
            return [2 /*return*/, filepath];
        });
    });
}
/**
 * 完整的小说爬取流程
 */
export function crawlNovel(options, onProgress) {
    return __awaiter(this, void 0, void 0, function () {
        var url, _a, startChapter, endChapter, _b, format, _c, outputDir, analyzeResult, totalCount, start, end, chapters, content, safeTitle, filepath, totalWords, error_5;
        var _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    url = options.url, _a = options.startChapter, startChapter = _a === void 0 ? 0 : _a, endChapter = options.endChapter, _b = options.format, format = _b === void 0 ? 'txt' : _b, _c = options.outputDir, outputDir = _c === void 0 ? '/tmp/novels' : _c;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 5, 6, 8]);
                    // 1. 分析页面
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({ phase: 'fetching_list', message: '正在分析页面...' });
                    return [4 /*yield*/, analyzeNovelPage(url, onProgress)];
                case 2:
                    analyzeResult = _g.sent();
                    if (!analyzeResult.success || !((_d = analyzeResult.chapters) === null || _d === void 0 ? void 0 : _d.length)) {
                        return [2 /*return*/, {
                                success: false,
                                error: analyzeResult.error || '未能找到章节列表'
                            }];
                    }
                    totalCount = analyzeResult.chapters.length;
                    start = Math.max(0, startChapter);
                    end = Math.min(totalCount - 1, endChapter !== null && endChapter !== void 0 ? endChapter : totalCount - 1);
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                        phase: 'fetching_content',
                        message: "\u5F00\u59CB\u722C\u53D6\u7B2C ".concat(start + 1, " \u5230 ").concat(end + 1, " \u7AE0\uFF0C\u5171 ").concat(end - start + 1, " \u7AE0"),
                        totalChapters: end - start + 1
                    });
                    return [4 /*yield*/, crawlChapters(analyzeResult.chapters, start, end, onProgress, (_e = analyzeResult.novel) === null || _e === void 0 ? void 0 : _e.title)];
                case 3:
                    chapters = _g.sent();
                    // 4. 导出
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({ phase: 'exporting', message: '正在导出文件...' });
                    content = void 0;
                    switch (format) {
                        case 'md':
                            content = exportToMarkdown(analyzeResult.novel, chapters);
                            break;
                        case 'html':
                            content = exportToHtml(analyzeResult.novel, chapters);
                            break;
                        case 'json':
                            content = JSON.stringify({ novel: analyzeResult.novel, chapters: chapters }, null, 2);
                            break;
                        default:
                            content = exportToTxt(analyzeResult.novel, chapters);
                    }
                    safeTitle = (((_f = analyzeResult.novel) === null || _f === void 0 ? void 0 : _f.title) || 'novel')
                        .replace(/[\/\\:*?"<>|]/g, '_')
                        .substring(0, 50);
                    return [4 /*yield*/, saveFile(content, safeTitle, format, outputDir)];
                case 4:
                    filepath = _g.sent();
                    totalWords = chapters.reduce(function (sum, c) { return sum + (c.wordCount || 0); }, 0);
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({
                        phase: 'completed',
                        message: "\u722C\u53D6\u5B8C\u6210\uFF01\u5171 ".concat(chapters.length, " \u7AE0\uFF0C\u7EA6 ").concat(totalWords, " \u5B57"),
                        totalChapters: chapters.length
                    });
                    return [2 /*return*/, {
                            success: true,
                            novel: analyzeResult.novel,
                            chapters: chapters,
                            filepath: filepath,
                            totalWords: totalWords
                        }];
                case 5:
                    error_5 = _g.sent();
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress({ phase: 'error', message: error_5.message });
                    return [2 /*return*/, {
                            success: false,
                            error: error_5.message
                        }];
                case 6: 
                // 关闭浏览器
                return [4 /*yield*/, closeBrowser()];
                case 7:
                    // 关闭浏览器
                    _g.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// 导出 fetchPage 函数供外部使用
export { fetchPage };
export default {
    analyzeNovelPage: analyzeNovelPage,
    crawlChapters: crawlChapters,
    crawlNovel: crawlNovel,
    exportToTxt: exportToTxt,
    exportToMarkdown: exportToMarkdown,
    exportToHtml: exportToHtml,
    saveFile: saveFile,
    fetchPage: fetchPage
};
