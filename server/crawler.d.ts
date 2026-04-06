/**
 * 小说爬取工具模块
 * 支持智能识别章节列表、内容解析、多格式导出
 */
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
interface FetchResult {
    html: string;
    url: string;
    statusCode: number;
}
declare function fetchPage(url: string, retryCount?: number): Promise<FetchResult>;
/**
 * 分析小说页面，提取书籍信息和章节列表
 */
export declare function analyzeNovelPage(url: string, onProgress?: ProgressCallback): Promise<CrawlResult>;
export declare function crawlChapters(chapters: Chapter[], startIndex: number, endIndex: number, onProgress?: ProgressCallback, novelTitle?: string): Promise<Chapter[]>;
/**
 * 导出为 TXT 格式
 */
export declare function exportToTxt(novel: NovelInfo, chapters: Chapter[]): string;
/**
 * 导出为 Markdown 格式
 */
export declare function exportToMarkdown(novel: NovelInfo, chapters: Chapter[]): string;
/**
 * 导出为 HTML 格式
 */
export declare function exportToHtml(novel: NovelInfo, chapters: Chapter[]): string;
/**
 * 保存文件
 */
export declare function saveFile(content: string, filename: string, format: 'txt' | 'md' | 'html' | 'json', outputDir?: string): Promise<string>;
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
export declare function crawlNovel(options: CrawlOptions, onProgress?: ProgressCallback): Promise<CrawlFullResult>;
export { fetchPage };
declare const _default: {
    analyzeNovelPage: typeof analyzeNovelPage;
    crawlChapters: typeof crawlChapters;
    crawlNovel: typeof crawlNovel;
    exportToTxt: typeof exportToTxt;
    exportToMarkdown: typeof exportToMarkdown;
    exportToHtml: typeof exportToHtml;
    saveFile: typeof saveFile;
    fetchPage: typeof fetchPage;
};
export default _default;
