/**
 * 爬取规范生成器
 * 生成标准化的爬取规范 Markdown 文件
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * 生成爬取规范 Markdown 文件
 */
export function generateSpecMd(spec) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
    var websiteName = spec.websiteName, baseUrl = spec.baseUrl, generatedAt = spec.generatedAt, analysis = spec.analysis;
    var md = "# ".concat(websiteName, " \u722C\u53D6\u89C4\u8303\n\n## \u7F51\u7AD9\u4FE1\u606F\n\n| \u9879\u76EE | \u503C |\n|------|-----|\n| \u7F51\u7AD9\u540D\u79F0 | ").concat(websiteName, " |\n| \u57FA\u7840 URL | ").concat(baseUrl, " |\n| \u7F51\u7AD9\u7C7B\u578B | ").concat(getWebsiteTypeName(analysis.type), " |\n| \u7F16\u7801\u683C\u5F0F | ").concat(analysis.encoding, " |\n| \u751F\u6210\u65F6\u95F4 | ").concat(generatedAt, " |\n\n## \u76EE\u5F55\u9875\u89C4\u8303\n\n### \u76EE\u5F55\u9875 URL\n\n```\n").concat(baseUrl, "\n```\n\n### \u7AE0\u8282\u5217\u8868\u63D0\u53D6\n\n| \u9879\u76EE | \u5185\u5BB9 |\n|------|------|\n| \u63A8\u8350\u9009\u62E9\u5668 | `").concat(((_a = analysis.catalog) === null || _a === void 0 ? void 0 : _a.selectors[0]) || '需手动分析', "` |\n| \u5907\u9009\u9009\u62E9\u5668 | ").concat(((_b = analysis.catalog) === null || _b === void 0 ? void 0 : _b.selectors.slice(1).map(function (s) { return "`".concat(s, "`"); }).join(', ')) || '无', " |\n| \u662F\u5426\u5206\u9875 | ").concat(((_c = analysis.catalog) === null || _c === void 0 ? void 0 : _c.pagination) ? '是' : '否', " |\n| \u5206\u9875\u9009\u62E9\u5668 | `").concat(((_d = analysis.catalog) === null || _d === void 0 ? void 0 : _d.paginationSelector) || '无', "` |\n| \u52A0\u8F7D\u66F4\u591A | `").concat(((_e = analysis.catalog) === null || _e === void 0 ? void 0 : _e.loadMoreButton) || '无', "` |\n\n### \u7AE0\u8282\u94FE\u63A5\u63D0\u53D6\u89C4\u5219\n\n```javascript\n// \u4F2A\u4EE3\u7801\nconst chapters = document.querySelectorAll('").concat(((_f = analysis.catalog) === null || _f === void 0 ? void 0 : _f.selectors[0]) || 'a', "');\nconst links = Array.from(chapters).map(a => ({\n  title: a.textContent.trim(),\n  url: a.href\n}));\n```\n\n## \u7AE0\u8282\u9875\u89C4\u8303\n\n### \u7AE0\u8282\u6807\u9898\u63D0\u53D6\n\n| \u4F18\u5148\u7EA7 | \u9009\u62E9\u5668 |\n|--------|--------|\n").concat(((_g = analysis.chapter) === null || _g === void 0 ? void 0 : _g.titleSelectors.map(function (s, i) { return "| ".concat(i + 1, " | `").concat(s, "` |"); }).join('\n')) || '| 1 | 需手动分析 |', "\n\n### \u6B63\u6587\u5185\u5BB9\u63D0\u53D6\n\n| \u4F18\u5148\u7EA7 | \u9009\u62E9\u5668 | \u8BF4\u660E |\n|--------|--------|------|\n").concat(((_h = analysis.chapter) === null || _h === void 0 ? void 0 : _h.contentSelectors.map(function (s, i) { return "| ".concat(i + 1, " | `").concat(s, "` | ").concat(getSelectorDescription(s), " |"); }).join('\n')) || '| 1 | 需手动分析 | - |', "\n\n### \u9700\u8981\u8FC7\u6EE4\u7684\u5143\u7D20\n\n```css\n").concat(((_j = analysis.chapter) === null || _j === void 0 ? void 0 : _j.noiseSelectors.join('\n')) || '/* 无需过滤 */', "\n```\n\n### \u5185\u5BB9\u6E05\u7406\u89C4\u5219\n\n- \u79FB\u9664\u5E7F\u544A\u6587\u5B57\uFF1A\u5305\u542B\"\u5E7F\u544A\"\u3001\"\u63A8\u8350\u9605\u8BFB\"\u7B49\u5173\u952E\u8BCD\n- \u79FB\u9664\u5BFC\u822A\u94FE\u63A5\uFF1A\u7AE0\u8282\u672B\u5C3E\u7684\"\u4E0A\u4E00\u7AE0\"\u3001\"\u4E0B\u4E00\u7AE0\"\n- \u79FB\u9664\u7A7A\u6BB5\u843D\uFF1A\u7EAF\u7A7A\u767D\u5185\u5BB9\u7684 `<p>` \u6807\u7B7E\n- \u6E05\u7406\u7279\u6B8A\u5B57\u7B26\uFF1A\u5168\u89D2\u7A7A\u683C\u3001\u591A\u4F59\u6362\u884C\u7B26\n\n### \u6B63\u6587\u5206\u9875\u5904\u7406\n\n| \u9879\u76EE | \u5185\u5BB9 |\n|------|------|\n| \u662F\u5426\u5206\u9875 | ").concat(((_k = analysis.navigation) === null || _k === void 0 ? void 0 : _k.nextPage) ? '可能需要' : '否', " |\n| \u4E0B\u4E00\u9875\u9009\u62E9\u5668 | `").concat(((_l = analysis.navigation) === null || _l === void 0 ? void 0 : _l.nextPage) || '无', "` |\n| \u4E0A\u4E00\u9875\u9009\u62E9\u5668 | `").concat(((_m = analysis.navigation) === null || _m === void 0 ? void 0 : _m.prevPage) || '无', "` |\n| \u7ED3\u675F\u6807\u8BB0 | \u6B63\u6587\u4E2D\u51FA\u73B0\"\u672C\u7AE0\u5B8C\"\u6216\u65E0\u4E0B\u4E00\u9875\u94FE\u63A5 |\n\n## \u5BFC\u822A\u94FE\u63A5\u89C4\u8303\n\n| \u5BFC\u822A\u7C7B\u578B | \u9009\u62E9\u5668 | \u72B6\u6001 |\n|----------|--------|------|\n| \u4E0A\u4E00\u7AE0 | `").concat(((_o = analysis.navigation) === null || _o === void 0 ? void 0 : _o.prevChapter) || '未检测到', "` | ").concat(((_p = analysis.navigation) === null || _p === void 0 ? void 0 : _p.prevChapter) ? '✓' : '✗', " |\n| \u4E0B\u4E00\u7AE0 | `").concat(((_q = analysis.navigation) === null || _q === void 0 ? void 0 : _q.nextChapter) || '未检测到', "` | ").concat(((_r = analysis.navigation) === null || _r === void 0 ? void 0 : _r.nextChapter) ? '✓' : '✗', " |\n| \u8FD4\u56DE\u76EE\u5F55 | `").concat(((_s = analysis.navigation) === null || _s === void 0 ? void 0 : _s.backToCatalog) || '未检测到', "` | ").concat(((_t = analysis.navigation) === null || _t === void 0 ? void 0 : _t.backToCatalog) ? '✓' : '✗', " |\n\n## \u53CD\u722C\u7B56\u7565\n\n| \u68C0\u6D4B\u9879 | \u72B6\u6001 | \u5904\u7406\u65B9\u6848 |\n|--------|------|----------|\n| User-Agent | ").concat(((_u = analysis.antiCrawl) === null || _u === void 0 ? void 0 : _u.userAgent) ? '需要' : '不需要', " | \u8BBE\u7F6E\u5E38\u89C1\u6D4F\u89C8\u5668 UA |\n| Referer | ").concat(((_v = analysis.antiCrawl) === null || _v === void 0 ? void 0 : _v.referer) ? '需要' : '建议', " | \u8BBE\u7F6E\u4E3A\u76EE\u5F55\u9875 URL |\n| Cookie | ").concat(((_w = analysis.antiCrawl) === null || _w === void 0 ? void 0 : _w.cookie) ? '需要' : '不需要', " | ").concat(((_x = analysis.antiCrawl) === null || _x === void 0 ? void 0 : _x.cookie) ? '手动登录后获取' : '无需处理', " |\n| \u9A8C\u8BC1\u7801 | ").concat(((_y = analysis.antiCrawl) === null || _y === void 0 ? void 0 : _y.captcha) ? '可能存在' : '未检测到', " | ").concat(((_z = analysis.antiCrawl) === null || _z === void 0 ? void 0 : _z.captcha) ? '人工处理或暂停爬取' : '无需处理', " |\n| JS \u6E32\u67D3 | ").concat(((_0 = analysis.antiCrawl) === null || _0 === void 0 ? void 0 : _0.javascript) ? '需要' : '不需要', " | ").concat(((_1 = analysis.antiCrawl) === null || _1 === void 0 ? void 0 : _1.javascript) ? '使用 Playwright 渲染' : '可直接请求', " |\n| \u5EFA\u8BAE\u5EF6\u8FDF | ").concat(((_2 = analysis.antiCrawl) === null || _2 === void 0 ? void 0 : _2.delay) || 1, " \u79D2 | \u968F\u673A\u5EF6\u8FDF 1-").concat((((_3 = analysis.antiCrawl) === null || _3 === void 0 ? void 0 : _3.delay) || 1) + 2, " \u79D2 |\n\n### \u8BF7\u6C42\u5934\u914D\u7F6E\n\n```javascript\nconst headers = {\n  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',\n  'Referer': '").concat(baseUrl, "',\n  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',\n  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',\n  'Accept-Encoding': 'gzip, deflate',\n  'Connection': 'keep-alive',\n};\n```\n\n## \u722C\u53D6\u5EFA\u8BAE\n\n").concat(analysis.recommendations.map(function (r) { return "- ".concat(r); }).join('\n'), "\n\n## \u722C\u53D6\u4F2A\u4EE3\u7801\n\n```\n1. \u68C0\u67E5 robots.txt \u662F\u5426\u5141\u8BB8\u722C\u53D6\n2. \u8BBF\u95EE\u76EE\u5F55\u9875: ").concat(baseUrl, "\n3. \u4F7F\u7528\u9009\u62E9\u5668 \"").concat(((_4 = analysis.catalog) === null || _4 === void 0 ? void 0 : _4.selectors[0]) || '需手动分析', "\" \u63D0\u53D6\u6240\u6709\u7AE0\u8282\u94FE\u63A5\n4. \u904D\u5386\u7AE0\u8282\u94FE\u63A5:\n   a. \u8BBF\u95EE\u7AE0\u8282\u9875\n   b. \u4F7F\u7528\u9009\u62E9\u5668 \"").concat(((_5 = analysis.chapter) === null || _5 === void 0 ? void 0 : _5.contentSelectors[0]) || '需手动分析', "\" \u63D0\u53D6\u6B63\u6587\n   c. \u8FC7\u6EE4\u566A\u97F3\u5143\u7D20\n   d. \u68C0\u67E5\u5E76\u5904\u7406\u5206\u9875\uFF08\u5982\u6709\uFF09\n   e. \u4FDD\u5B58\u5185\u5BB9\n   f. \u968F\u673A\u5EF6\u8FDF ").concat(((_6 = analysis.antiCrawl) === null || _6 === void 0 ? void 0 : _6.delay) || 1, "-").concat((((_7 = analysis.antiCrawl) === null || _7 === void 0 ? void 0 : _7.delay) || 1) + 2, " \u79D2\n5. \u5BFC\u51FA\u4E3A\u6307\u5B9A\u683C\u5F0F\n```\n\n## \u9519\u8BEF\u5904\u7406\n\n| \u9519\u8BEF\u7C7B\u578B | \u5904\u7406\u65B9\u6848 |\n|----------|----------|\n| \u7AE0\u8282\u4E0D\u5B58\u5728 | \u8DF3\u8FC7\u5E76\u8BB0\u5F55\uFF0C\u7EE7\u7EED\u4E0B\u4E00\u7AE0 |\n| \u5185\u5BB9\u4E3A\u7A7A | \u91CD\u8BD5 3 \u6B21\uFF0C\u5931\u8D25\u5219\u6807\u8BB0\u4E3A\u5F85\u624B\u52A8\u5904\u7406 |\n| \u7F51\u7EDC\u8D85\u65F6 | \u7B49\u5F85 5 \u79D2\u540E\u91CD\u8BD5\uFF0C\u6700\u591A 3 \u6B21 |\n| \u9A8C\u8BC1\u7801\u51FA\u73B0 | \u6682\u505C\u722C\u53D6\uFF0C\u63D0\u793A\u7528\u6237\u4EBA\u5DE5\u5904\u7406 |\n| 403 \u7981\u6B62\u8BBF\u95EE | \u964D\u4F4E\u9891\u7387\uFF0C\u589E\u52A0\u5EF6\u8FDF\uFF0C\u66F4\u6362 UA |\n\n## \u6D4B\u8BD5\u7528\u4F8B\n\n### \u76EE\u5F55\u9875\u6D4B\u8BD5\n\n- \u6D4B\u8BD5 URL: `").concat(baseUrl, "`\n- \u9884\u671F\u7AE0\u8282\u6570: \u5F85\u9A8C\u8BC1\n- \u9009\u62E9\u5668\u6D4B\u8BD5: \u5728\u6D4F\u89C8\u5668\u63A7\u5236\u53F0\u6267\u884C `document.querySelectorAll('").concat(((_8 = analysis.catalog) === null || _8 === void 0 ? void 0 : _8.selectors[0]) || 'a', "')`\n\n### \u7AE0\u8282\u9875\u6D4B\u8BD5\n\n- \u6D4B\u8BD5 URL: \u9700\u8981\u63D0\u4F9B\u5177\u4F53\u7AE0\u8282 URL\n- \u9884\u671F\u5185\u5BB9: \u6B63\u6587\u5B57\u6570 > 500\n- \u9009\u62E9\u5668\u6D4B\u8BD5: \u5728\u6D4F\u89C8\u5668\u63A7\u5236\u53F0\u6267\u884C `document.querySelector('").concat(((_9 = analysis.chapter) === null || _9 === void 0 ? void 0 : _9.contentSelectors[0]) || '#content', "').textContent`\n\n---\n\n**\u751F\u6210\u5DE5\u5177**: Novel Crawler Spec Generator v1.0  \n**\u751F\u6210\u65F6\u95F4**: ").concat(generatedAt, "  \n**\u6CE8\u610F\u4E8B\u9879**: \u672C\u89C4\u8303\u4EC5\u4F9B\u5B66\u4E60\u7814\u7A76\u4F7F\u7528\uFF0C\u8BF7\u9075\u5B88\u76F8\u5173\u6CD5\u5F8B\u6CD5\u89C4\u548C\u7F51\u7AD9\u89C4\u5219\n");
    return md;
}
function getWebsiteTypeName(type) {
    var names = {
        'traditional': '传统目录型',
        'reading': '阅读页型',
        'paginated': '分页型',
        'scroll_load': '滚动加载型',
        'anti_crawl': '反爬型'
    };
    return names[type] || type;
}
function getSelectorDescription(selector) {
    if (selector.startsWith('#'))
        return 'ID 选择器，最精确';
    if (selector.startsWith('.'))
        return '类名选择器，常用';
    if (selector === 'article')
        return 'HTML5 语义标签';
    return '通用选择器';
}
/**
 * 保存规范文件
 */
export function saveSpecFile(spec, outputDir) {
    if (outputDir === void 0) { outputDir = '/tmp/novels/specs'; }
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    var safeName = spec.websiteName
        .replace(/[\/\\:*?"<>|]/g, '_')
        .substring(0, 50);
    var filename = "".concat(safeName, "_\u722C\u53D6\u89C4\u8303.md");
    var filepath = path.join(outputDir, filename);
    var content = generateSpecMd(spec);
    fs.writeFileSync(filepath, content, 'utf-8');
    return filepath;
}
/**
 * 从分析结果生成完整规范
 */
export function generateCrawlSpec(analysis, websiteName) {
    var name = websiteName || new URL(analysis.url).hostname || '未知网站';
    return {
        websiteName: name,
        baseUrl: analysis.url,
        generatedAt: new Date().toLocaleString('zh-CN'),
        analysis: analysis
    };
}
export default {
    generateSpecMd: generateSpecMd,
    saveSpecFile: saveSpecFile,
    generateCrawlSpec: generateCrawlSpec
};
