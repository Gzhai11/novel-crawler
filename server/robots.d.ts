/**
 * robots.txt 检查模块
 * 检查目标网站是否允许爬取
 */
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
/**
 * 检查目标网站是否允许爬取
 * @param baseUrl 网站基础 URL
 * @param targetUrl 要检查的目标 URL
 * @returns 检查结果
 */
export declare function checkRobotsTxt(baseUrl: string, targetUrl?: string): Promise<RobotsResult>;
/**
 * 获取建议的爬取延迟
 * @param baseUrl 网站基础 URL
 * @returns 建议延迟秒数
 */
export declare function getSuggestedDelay(baseUrl: string): Promise<number>;
declare const _default: {
    checkRobotsTxt: typeof checkRobotsTxt;
    getSuggestedDelay: typeof getSuggestedDelay;
};
export default _default;
