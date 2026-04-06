/**
 * 爬取规范生成器
 * 生成标准化的爬取规范 Markdown 文件
 */
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
export declare function generateSpecMd(spec: CrawlSpec): string;
/**
 * 保存规范文件
 */
export declare function saveSpecFile(spec: CrawlSpec, outputDir?: string): string;
/**
 * 从分析结果生成完整规范
 */
export declare function generateCrawlSpec(analysis: WebsiteAnalysis, websiteName?: string): CrawlSpec;
declare const _default: {
    generateSpecMd: typeof generateSpecMd;
    saveSpecFile: typeof saveSpecFile;
    generateCrawlSpec: typeof generateCrawlSpec;
};
export default _default;
