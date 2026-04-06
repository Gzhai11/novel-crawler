/**
 * 网站结构分析器
 * 自动分析小说网站结构，提取关键元素
 */
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
var execAsync = promisify(exec);
// ==================== 网站类型识别 ====================
function detectWebsiteType($, url) {
    // 检查是否有明显的目录结构
    var catalogSelectors = [
        '.chapter-list', '#list', '.catalog', '.chapters',
        '.book-list', 'ol.catalog', 'dl.chapter-list'
    ];
    for (var _i = 0, catalogSelectors_1 = catalogSelectors; _i < catalogSelectors_1.length; _i++) {
        var selector = catalogSelectors_1[_i];
        if ($(selector).length > 0) {
            // 检查是否有大量章节链接
            var links = $(selector).find('a').length;
            if (links > 10)
                return 'traditional';
        }
    }
    // 检查是否是阅读页（有正文内容）
    var contentSelectors = ['#content', '#chapter-content', '.chapter-content', '.text-content'];
    for (var _a = 0, contentSelectors_1 = contentSelectors; _a < contentSelectors_1.length; _a++) {
        var selector = contentSelectors_1[_a];
        if ($(selector).length > 0) {
            // 检查是否有分页标记
            var pagination = $('.pagination, .page-nav, .next-page').length;
            if (pagination > 0)
                return 'paginated';
            // 检查是否有滚动加载标记
            var scrollLoad = $('[data-load], .infinite-scroll, .lazy-load').length;
            if (scrollLoad > 0)
                return 'scroll_load';
            return 'reading';
        }
    }
    // 检查是否需要登录/验证码
    var loginRequired = $('.login-required, .need-login, #login-form').length > 0;
    var hasCaptcha = $('.captcha, #captcha, .verify-code').length > 0;
    if (loginRequired || hasCaptcha)
        return 'anti_crawl';
    return 'traditional';
}
// ==================== 编码检测 ====================
function detectEncoding($, html) {
    // 从 meta 标签检测
    var charset = $('meta[charset]').attr('charset');
    if (charset)
        return charset.toUpperCase();
    var httpEquiv = $('meta[http-equiv="Content-Type"]').attr('content');
    if (httpEquiv) {
        var match = httpEquiv.match(/charset=([^;]+)/i);
        if (match)
            return match[1].toUpperCase();
    }
    // 默认 UTF-8
    return 'UTF-8';
}
// ==================== 目录选择器提取 ====================
var CATALOG_PATTERNS = [
    // 优先级高的选择器
    '#list dd a',
    '#list a',
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
    '.zjlist a',
    // 表格结构
    'table.chapter-list a',
    // 卷章节结构
    '.volume .chapters a',
    '.chapter-wrap a',
    // 新增：更多常见选择器
    '.read_chapters a',
    '.read_list a',
    '#chapterlist a',
    '.list_box a',
    '.book-chapter-list a',
    '.chapter-list-wrap a',
    '.chapterbar a',
    '.article-list a',
    '.section-list a',
    'dl dd a',
    'dd a',
];
function extractCatalogSelectors($) {
    var found = [];
    for (var _i = 0, CATALOG_PATTERNS_1 = CATALOG_PATTERNS; _i < CATALOG_PATTERNS_1.length; _i++) {
        var selector = CATALOG_PATTERNS_1[_i];
        var count = $(selector).length;
        if (count > 2) { // 降低阈值，更容易匹配
            found.push(selector);
        }
    }
    // 如果没找到，尝试智能检测
    if (found.length === 0) {
        console.log('[Analyzer] 常规选择器未匹配，尝试智能检测...');
        // 查找链接密度高的容器
        var containers = $('div, section, main, ul, ol, dl');
        containers.each(function (_, el) {
            var $container = $(el);
            var links = $container.find('a[href]').length;
            if (links > 10) {
                var id = $container.attr('id');
                var cls = $container.attr('class');
                if (id) {
                    found.push("#".concat(id, " a"));
                }
                else if (cls) {
                    found.push(".".concat(cls.split(' ')[0], " a"));
                }
            }
        });
    }
    return found;
}
function detectPagination($) {
    // 检测分页
    var paginationSelectors = [
        '.pagination .next', '.page-nav .next', '.pager .next',
        'a.next-page', '.page-next', '.next-page'
    ];
    for (var _i = 0, paginationSelectors_1 = paginationSelectors; _i < paginationSelectors_1.length; _i++) {
        var selector = paginationSelectors_1[_i];
        if ($(selector).length > 0) {
            return { hasPagination: true, selector: selector };
        }
    }
    // 检测加载更多按钮
    var loadMoreSelectors = [
        '.load-more', '.show-more', '.expand-all',
        '[data-load-more]', '.btn-more'
    ];
    for (var _a = 0, loadMoreSelectors_1 = loadMoreSelectors; _a < loadMoreSelectors_1.length; _a++) {
        var selector = loadMoreSelectors_1[_a];
        if ($(selector).length > 0) {
            return { hasPagination: false, loadMore: selector };
        }
    }
    return { hasPagination: false };
}
// ==================== 章节内容选择器提取 ====================
var TITLE_PATTERNS = [
    'h1.chapter-title',
    'h1.title',
    'h1',
    '.chapter-header .title',
    '.chapter-title',
    '.title',
    '[data-title]',
];
var CONTENT_PATTERNS = [
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
var NOISE_PATTERNS = [
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
function extractChapterSelectors($) {
    var titleSelectors = [];
    var contentSelectors = [];
    var noiseSelectors = [];
    // 提取标题选择器
    for (var _i = 0, TITLE_PATTERNS_1 = TITLE_PATTERNS; _i < TITLE_PATTERNS_1.length; _i++) {
        var selector = TITLE_PATTERNS_1[_i];
        var el = $(selector).first();
        if (el.length > 0) {
            var text = el.text().trim();
            // 检查是否像章节标题
            if (text.length > 0 && text.length < 100) {
                titleSelectors.push(selector);
            }
        }
    }
    // 提取内容选择器
    for (var _a = 0, CONTENT_PATTERNS_1 = CONTENT_PATTERNS; _a < CONTENT_PATTERNS_1.length; _a++) {
        var selector = CONTENT_PATTERNS_1[_a];
        var el = $(selector).first();
        if (el.length > 0) {
            var text = el.text().trim();
            // 检查是否有足够的内容
            if (text.length > 200) {
                contentSelectors.push(selector);
            }
        }
    }
    // 提取噪音选择器（存在的）
    for (var _b = 0, NOISE_PATTERNS_1 = NOISE_PATTERNS; _b < NOISE_PATTERNS_1.length; _b++) {
        var selector = NOISE_PATTERNS_1[_b];
        if ($(selector).length > 0) {
            noiseSelectors.push(selector);
        }
    }
    return { title: titleSelectors, content: contentSelectors, noise: noiseSelectors };
}
// ==================== 导航链接提取 ====================
var NAV_PATTERNS = {
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
function extractNavigationSelectors($) {
    var result = {};
    for (var _i = 0, _a = Object.entries(NAV_PATTERNS); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], selectors = _b[1];
        for (var _c = 0, selectors_1 = selectors; _c < selectors_1.length; _c++) {
            var selector = selectors_1[_c];
            if ($(selector).length > 0) {
                result[key] = selector;
                break;
            }
        }
    }
    return result;
}
// ==================== 反爬机制检测 ====================
function detectAntiCrawl($, html) {
    var result = {
        userAgent: false,
        referer: false,
        cookie: false,
        captcha: false,
        javascript: false,
        delay: 1
    };
    // 检测验证码
    var captchaSelectors = [
        '.captcha', '#captcha', '.verify-code', '.geetest',
        'img[src*="captcha"]', '.seccode'
    ];
    for (var _i = 0, captchaSelectors_1 = captchaSelectors; _i < captchaSelectors_1.length; _i++) {
        var selector = captchaSelectors_1[_i];
        if ($(selector).length > 0) {
            result.captcha = true;
            result.delay = 3;
            break;
        }
    }
    // 检测登录要求
    var loginSelectors = [
        '.login-required', '.need-login', '#login-form',
        '.login-box', '.user-login'
    ];
    for (var _a = 0, loginSelectors_1 = loginSelectors; _a < loginSelectors_1.length; _a++) {
        var selector = loginSelectors_1[_a];
        if ($(selector).length > 0) {
            result.cookie = true;
            result.delay = 2;
            break;
        }
    }
    // 检测 JavaScript 渲染（内容在 script 中）
    var scriptContent = html.match(/document\.write|innerHTML|createElement/g);
    if (scriptContent && scriptContent.length > 5) {
        result.javascript = true;
        result.delay = 2;
    }
    // 检测 AJAX 加载
    var ajaxContent = html.match(/fetch\(|\.ajax\(|\.load\(/g);
    if (ajaxContent && ajaxContent.length > 3) {
        result.javascript = true;
    }
    // 延迟建议：根据章节链接数量
    var linkCount = $('a[href*="chapter"]').length;
    if (linkCount > 500) {
        result.delay = Math.max(result.delay, 2);
    }
    return result;
}
// ==================== 爬取建议生成 ====================
function generateRecommendations(analysis) {
    var _a, _b, _c, _d;
    var recommendations = [];
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
            if ((_a = analysis.antiCrawl) === null || _a === void 0 ? void 0 : _a.captcha) {
                recommendations.push('⚠ 存在验证码，可能需要人工处理');
            }
            if ((_b = analysis.antiCrawl) === null || _b === void 0 ? void 0 : _b.cookie) {
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
            recommendations.push("! \u5EFA\u8BAE\u8BF7\u6C42\u5EF6\u8FDF: ".concat(analysis.antiCrawl.delay, " \u79D2"));
        }
    }
    // 选择器建议
    if (!((_c = analysis.catalog) === null || _c === void 0 ? void 0 : _c.selectors.length)) {
        recommendations.push('? 未自动识别目录选择器，可能需要手动分析');
    }
    if (!((_d = analysis.chapter) === null || _d === void 0 ? void 0 : _d.contentSelectors.length)) {
        recommendations.push('? 未自动识别正文选择器，可能需要手动分析');
    }
    return recommendations;
}
// ==================== 主分析函数 ====================
export function analyzeWebsite(url, html) {
    return __awaiter(this, void 0, void 0, function () {
        var $, type, encoding, catalogSelectors, pagination, chapterSelectors, navigationSelectors, antiCrawl, analysis;
        return __generator(this, function (_a) {
            $ = cheerio.load(html);
            type = detectWebsiteType($, url);
            encoding = detectEncoding($, html);
            catalogSelectors = extractCatalogSelectors($);
            pagination = detectPagination($);
            chapterSelectors = extractChapterSelectors($);
            navigationSelectors = extractNavigationSelectors($);
            antiCrawl = detectAntiCrawl($, html);
            analysis = {
                url: url,
                type: type,
                encoding: encoding,
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
                antiCrawl: antiCrawl,
                recommendations: []
            };
            // 生成建议
            analysis.recommendations = generateRecommendations(analysis);
            return [2 /*return*/, analysis];
        });
    });
}
export default { analyzeWebsite: analyzeWebsite };
