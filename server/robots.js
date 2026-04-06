/**
 * robots.txt 检查模块
 * 检查目标网站是否允许爬取
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
// 解析 robots.txt
function parseRobotsTxt(content) {
    var rules = [];
    var currentUserAgent = '';
    var currentRule = null;
    var lines = content.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        // 跳过注释和空行
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        var colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1)
            continue;
        var key = trimmed.substring(0, colonIndex).trim().toLowerCase();
        var value = trimmed.substring(colonIndex + 1).trim();
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
function matchesPath(pattern, path) {
    if (pattern === '/')
        return true;
    if (pattern === '')
        return false;
    // 简单通配符匹配
    var regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    try {
        var regex = new RegExp("^".concat(regexPattern));
        return regex.test(path);
    }
    catch (_a) {
        return path.startsWith(pattern);
    }
}
// 检查 URL 是否允许爬取
function isUrlAllowed(rules, url) {
    try {
        var urlObj = new URL(url);
        var path = urlObj.pathname + urlObj.search;
        var matched = false;
        var allowed = true;
        var crawlDelay = void 0;
        for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
            var rule = rules_1[_i];
            // 匹配所有 User-Agent 或特定的爬虫
            if (rule.userAgent === '*' || rule.userAgent.toLowerCase() === 'novelcrawler') {
                matched = true;
                // 检查 Disallow 规则
                for (var _a = 0, _b = rule.disallow; _a < _b.length; _a++) {
                    var disallow = _b[_a];
                    if (matchesPath(disallow, path)) {
                        allowed = false;
                    }
                }
                // 检查 Allow 规则（优先级更高）
                for (var _c = 0, _d = rule.allow; _c < _d.length; _c++) {
                    var allow = _d[_c];
                    if (matchesPath(allow, path)) {
                        allowed = true;
                    }
                }
                if (rule.crawlDelay) {
                    crawlDelay = rule.crawlDelay;
                }
            }
        }
        return { allowed: matched ? allowed : true, crawlDelay: crawlDelay };
    }
    catch (_e) {
        return { allowed: true };
    }
}
/**
 * 检查目标网站是否允许爬取
 * @param baseUrl 网站基础 URL
 * @param targetUrl 要检查的目标 URL
 * @returns 检查结果
 */
export function checkRobotsTxt(baseUrl, targetUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var urlObj, robotsUrl, robotsContent, response, e_1, rules, checkUrl, _a, allowed, crawlDelay, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    urlObj = new URL(baseUrl);
                    robotsUrl = "".concat(urlObj.origin, "/robots.txt");
                    console.log("[Robots] \u68C0\u67E5: ".concat(robotsUrl));
                    robotsContent = void 0;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(robotsUrl, {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; NovelCrawler/1.0)'
                            }
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) {
                        // 没有 robots.txt，默认允许
                        return [2 /*return*/, {
                                allowed: true,
                                reason: '网站未设置 robots.txt，默认允许爬取'
                            }];
                    }
                    return [4 /*yield*/, response.text()];
                case 3:
                    robotsContent = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _b.sent();
                    // 获取失败，默认允许
                    return [2 /*return*/, {
                            allowed: true,
                            reason: '无法获取 robots.txt，默认允许爬取'
                        }];
                case 5:
                    rules = parseRobotsTxt(robotsContent);
                    checkUrl = targetUrl || baseUrl;
                    _a = isUrlAllowed(rules, checkUrl), allowed = _a.allowed, crawlDelay = _a.crawlDelay;
                    if (allowed) {
                        return [2 /*return*/, {
                                allowed: true,
                                reason: 'robots.txt 允许爬取该路径',
                                rules: rules,
                                crawlDelay: crawlDelay
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                allowed: false,
                                reason: 'robots.txt 禁止爬取该路径，请遵守网站规则',
                                rules: rules,
                                crawlDelay: crawlDelay
                            }];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            allowed: true,
                            reason: "\u68C0\u67E5 robots.txt \u65F6\u51FA\u9519: ".concat(error_1.message, "\uFF0C\u9ED8\u8BA4\u5141\u8BB8\u722C\u53D6")
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * 获取建议的爬取延迟
 * @param baseUrl 网站基础 URL
 * @returns 建议延迟秒数
 */
export function getSuggestedDelay(baseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, checkRobotsTxt(baseUrl)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.crawlDelay || 1];
            }
        });
    });
}
export default { checkRobotsTxt: checkRobotsTxt, getSuggestedDelay: getSuggestedDelay };
