/**
 * 网站结构分析器
 * 自动分析小说网站结构，提取关键元素
 */
export type WebsiteType = 'traditional' | 'reading' | 'paginated' | 'scroll_load' | 'anti_crawl';
export interface WebsiteAnalysis {
    url: string;
    type: WebsiteType;
    encoding: string;
    catalog?: {
        selectors: string[];
        pagination: boolean;
        paginationSelector?: string;
        loadMoreButton?: string;
    };
    chapter?: {
        titleSelectors: string[];
        contentSelectors: string[];
        noiseSelectors: string[];
    };
    navigation?: {
        prevChapter?: string;
        nextChapter?: string;
        backToCatalog?: string;
        prevPage?: string;
        nextPage?: string;
    };
    antiCrawl?: {
        userAgent: boolean;
        referer: boolean;
        cookie: boolean;
        captcha: boolean;
        javascript: boolean;
        delay: number;
    };
    recommendations: string[];
}
export declare function analyzeWebsite(url: string, html: string): Promise<WebsiteAnalysis>;
declare const _default: {
    analyzeWebsite: typeof analyzeWebsite;
};
export default _default;
