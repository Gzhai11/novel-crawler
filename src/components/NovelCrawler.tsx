import { useState } from 'react';
import { Button, Input, Select, MessagePlugin, Progress, Tag, Tooltip } from 'tdesign-react';
import { BookOpen, Download, Loader2, FileText, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface NovelInfo {
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
}

interface Chapter {
  index: number;
  title: string;
  url: string;
}

interface CrawlFile {
  name: string;
  size: number;
  createdAt: Date;
  path: string;
}

interface WebsiteAnalysis {
  url: string;
  type: string;
  encoding: string;
  catalog?: {
    selectors: string[];
    pagination: boolean;
  };
  chapter?: {
    titleSelectors: string[];
    contentSelectors: string[];
    noiseSelectors: string[];
  };
  antiCrawl?: {
    userAgent: boolean;
    captcha: boolean;
    javascript: boolean;
    cookie?: boolean;
    delay: number;
  };
  recommendations: string[];
}

interface NovelCrawlerProps {
  onSendMessage?: (message: string) => void;
}

const WEBSITE_TYPE_NAMES: Record<string, string> = {
  'traditional': '传统目录型',
  'reading': '阅读页型',
  'paginated': '分页型',
  'scroll_load': '滚动加载型',
  'anti_crawl': '反爬型'
};

export function NovelCrawler({ onSendMessage }: NovelCrawlerProps) {
  // 步骤状态
  const [step, setStep] = useState<'input' | 'analyzing' | 'analysis_result' | 'range' | 'crawling' | 'done'>('input');
  
  // 输入
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'txt' | 'md' | 'html' | 'json'>('txt');
  
  // 分析结果
  const [novel, setNovel] = useState<NovelInfo | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [specPath, setSpecPath] = useState<string | null>(null);
  
  // 章节范围
  const [startChapter, setStartChapter] = useState(0);
  const [endChapter, setEndChapter] = useState(0);
  
  // 进度
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [taskId, setTaskId] = useState<string | null>(null);
  
  // 结果
  const [filepath, setFilepath] = useState<string | null>(null);
  const [totalWords, setTotalWords] = useState<number>(0);
  
  // 已有文件列表
  const [existingFiles, setExistingFiles] = useState<CrawlFile[]>([]);
  const [showFiles, setShowFiles] = useState(false);

  // 加载已有文件
  const loadExistingFiles = async () => {
    try {
      const res = await fetch('/api/crawler/files');
      const data = await res.json();
      setExistingFiles(data.files || []);
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  };

  // 深度分析网站结构
  const handleDeepAnalyze = async () => {
    if (!url.trim()) {
      MessagePlugin.warning('请输入小说页面URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      MessagePlugin.error('请输入有效的URL');
      return;
    }

    setStep('analyzing');
    setProgress({ current: 0, total: 0, message: '正在深度分析网站结构...' });

    try {
      // 1. 深度分析网站结构
      const analyzeRes = await fetch('/api/crawler/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeData.success) {
        if (analyzeData.robots && !analyzeData.robots.allowed) {
          MessagePlugin.warning('网站 robots.txt 禁止爬取该路径');
        }
        throw new Error(analyzeData.error || '分析失败');
      }

      setAnalysis(analyzeData.analysis);
      setSpecPath(analyzeData.spec?.filepath || null);

      // 2. 获取章节列表
      const chapterRes = await fetch('/api/crawler/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const chapterData = await chapterRes.json();

      if (chapterData.success) {
        setNovel(chapterData.novel);
        setChapters(chapterData.chapters || []);
        setEndChapter((chapterData.chapters?.length || 1) - 1);
      }

      setStep('analysis_result');
      MessagePlugin.success('网站分析完成');

    } catch (error: any) {
      MessagePlugin.error(error.message || '分析失败');
      setStep('input');
    }
  };

  // 开始爬取
  const handleStartCrawl = async () => {
    setStep('crawling');
    setProgress({ current: 0, total: endChapter - startChapter + 1, message: '正在启动...' });

    try {
      const res = await fetch('/api/crawler/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          startChapter,
          endChapter,
          format
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '启动失败');
      }

      setTaskId(data.taskId);
      pollProgress(data.taskId);
    } catch (error: any) {
      MessagePlugin.error(error.message || '启动失败');
      setStep('analysis_result');
    }
  };

  // 轮询进度
  const pollProgress = (tid: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/crawler/progress/${tid}`);
        const data = await res.json();
        
        if (data.progress) {
          setProgress({
            current: data.progress.currentChapter || 0,
            total: data.progress.totalChapters || 0,
            message: data.progress.message || ''
          });

          if (data.progress.phase === 'completed' && data.result?.filepath) {
            setFilepath(data.result.filepath);
            setTotalWords(data.result.totalWords || 0);
            setStep('done');
            MessagePlugin.success('爬取完成！');
            
            if (onSendMessage) {
              onSendMessage(`小说《${novel?.title}》爬取完成！共 ${data.result.chapters?.length || 0} 章，约 ${data.result.totalWords || 0} 字。`);
            }
            return;
          }

          if (data.progress.phase === 'error') {
            MessagePlugin.error(data.progress.message || '爬取失败');
            setStep('analysis_result');
            return;
          }
        }

        if (step === 'crawling') {
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('获取进度失败:', error);
        if (step === 'crawling') {
          setTimeout(poll, 2000);
        }
      }
    };

    poll();
  };

  // 下载文件
  const handleDownload = () => {
    if (filepath) {
      const filename = filepath.split('/').pop();
      window.open(`/api/crawler/download/${filename}`, '_blank');
    }
  };

  // 下载规范文件
  const handleDownloadSpec = () => {
    if (specPath) {
      const filename = specPath.split('/').pop();
      window.open(`/api/crawler/spec/${filename}`, '_blank');
    }
  };

  // 重新开始
  const handleReset = () => {
    setStep('input');
    setUrl('');
    setNovel(null);
    setChapters([]);
    setAnalysis(null);
    setSpecPath(null);
    setStartChapter(0);
    setEndChapter(0);
    setProgress({ current: 0, total: 0, message: '' });
    setTaskId(null);
    setFilepath(null);
    setTotalWords(0);
  };

  // 删除文件
  const handleDeleteFile = async (filename: string) => {
    try {
      await fetch(`/api/crawler/files/${filename}`, { method: 'DELETE' });
      MessagePlugin.success('文件已删除');
      loadExistingFiles();
    } catch (error) {
      MessagePlugin.error('删除失败');
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold">智能小说爬取</h1>
        </div>
        <p className="text-gray-500">输入小说网站链接，自动分析网站结构并爬取章节内容</p>
      </div>

      {/* 步骤 1: 输入 URL */}
      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">小说页面链接</label>
            <Input
              value={url}
              onChange={setUrl}
              placeholder="请输入小说目录页面的链接..."
              size="large"
              clearable
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">导出格式</label>
            <Select
              value={format}
              onChange={(val) => setFormat(val as typeof format)}
              options={[
                { label: 'TXT 纯文本', value: 'txt' },
                { label: 'Markdown', value: 'md' },
                { label: 'HTML 网页', value: 'html' },
                { label: 'JSON 数据', value: 'json' }
              ]}
            />
          </div>

          <Button 
            theme="primary" 
            block 
            size="large"
            onClick={handleDeepAnalyze}
          >
            分析网站结构
          </Button>

          {/* 已有文件 */}
          <div className="mt-6">
            <Button 
              variant="outline" 
              block
              onClick={() => {
                setShowFiles(!showFiles);
                if (!showFiles) loadExistingFiles();
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              查看已爬取文件
            </Button>
            
            {showFiles && (
              <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                {existingFiles.length === 0 ? (
                  <p className="text-gray-500 text-center">暂无已爬取的文件</p>
                ) : (
                  <div className="space-y-2">
                    {existingFiles.map((file) => (
                      <div key={file.name} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatSize(file.size)} · {new Date(file.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={file.path}
                            download
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 步骤 2: 分析中 */}
      {step === 'analyzing' && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">{progress.message || '正在分析页面...'}</p>
        </div>
      )}

      {/* 步骤 3: 分析结果 */}
      {step === 'analysis_result' && analysis && (
        <div className="space-y-6">
          {/* 网站分析结果 */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">网站结构分析</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">网站类型：</span>
                <Tag theme="primary">{WEBSITE_TYPE_NAMES[analysis.type] || analysis.type}</Tag>
              </div>
              <div>
                <span className="text-gray-500">编码格式：</span>
                <span>{analysis.encoding}</span>
              </div>
              <div>
                <span className="text-gray-500">目录选择器：</span>
                <span className="font-mono text-xs">{analysis.catalog?.selectors[0] || '未识别'}</span>
              </div>
              <div>
                <span className="text-gray-500">正文选择器：</span>
                <span className="font-mono text-xs">{analysis.chapter?.contentSelectors[0] || '未识别'}</span>
              </div>
            </div>

            {/* 反爬机制 */}
            {analysis.antiCrawl && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm font-medium mb-2">检测到的反爬机制：</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.antiCrawl.captcha && (
                    <Tag theme="warning">验证码</Tag>
                  )}
                  {analysis.antiCrawl.javascript && (
                    <Tag theme="warning">JS渲染</Tag>
                  )}
                  {analysis.antiCrawl.cookie && (
                    <Tag theme="warning">需要登录</Tag>
                  )}
                  {!analysis.antiCrawl.captcha && !analysis.antiCrawl.javascript && !analysis.antiCrawl.cookie && (
                    <Tag theme="success">无明显反爬</Tag>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  建议延迟：<strong>{analysis.antiCrawl.delay}秒</strong>
                </p>
              </div>
            )}
          </div>

          {/* 小说信息 */}
          {novel && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h2 className="text-xl font-bold mb-2">{novel.title}</h2>
              {novel.author && <p className="text-gray-600">作者: {novel.author}</p>}
              {novel.description && (
                <p className="text-gray-500 text-sm mt-2 line-clamp-3">{novel.description}</p>
              )}
              <p className="text-green-600 mt-2">发现 {chapters.length} 个章节</p>
            </div>
          )}

          {/* 建议 */}
          {analysis.recommendations.length > 0 && (
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                爬取建议
              </h3>
              <ul className="text-sm space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className={rec.startsWith('⚠') || rec.startsWith('!') ? 'text-orange-600' : ''}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 规范文件下载 */}
          {specPath && (
            <Button variant="outline" onClick={handleDownloadSpec}>
              <FileText className="w-4 h-4 mr-2" />
              下载爬取规范文件
            </Button>
          )}

          {/* 章节范围选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">爬取范围</label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  value={String(startChapter + 1)}
                  onChange={(val) => setStartChapter(Math.max(0, Number(val) - 1))}
                  label="起始章节"
                />
              </div>
              <span className="text-gray-500">至</span>
              <div className="flex-1">
                <Input
                  type="number"
                  value={String(endChapter + 1)}
                  onChange={(val) => setEndChapter(Math.min(chapters.length - 1, Number(val) - 1))}
                  label="结束章节"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              将爬取 {endChapter - startChapter + 1} 章
            </p>
          </div>

          {/* 导出格式 */}
          <div>
            <label className="block text-sm font-medium mb-2">导出格式</label>
            <Select
              value={format}
              onChange={(val) => setFormat(val as typeof format)}
              options={[
                { label: 'TXT 纯文本', value: 'txt' },
                { label: 'Markdown', value: 'md' },
                { label: 'HTML 网页', value: 'html' },
                { label: 'JSON 数据', value: 'json' }
              ]}
            />
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={handleReset}>
              返回
            </Button>
            <Button theme="primary" block onClick={handleStartCrawl}>
              开始爬取
            </Button>
          </div>
        </div>
      )}

      {/* 步骤 4: 爬取中 */}
      {step === 'crawling' && (
        <div className="space-y-6 py-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-lg font-medium">{progress.message}</p>
          </div>
          
          {progress.total > 0 && (
            <div>
              <Progress
         percentage={Math.round((progress.current / progress.total) * 100)}
                theme="circle"
                size="large"
              />
              <p className="text-center mt-2 text-gray-600">
                {progress.current} / {progress.total} 章
              </p>
            </div>
          )}
        </div>
      )}

      {/* 步骤 5: 完成 */}
      {step === 'done' && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-green-600">爬取完成！</h2>
            {novel && (
              <p className="text-gray-600 mt-2">
                《{novel.title}》共 {endChapter - startChapter + 1} 章，约 {totalWords.toLocaleString()} 字
              </p>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Button theme="primary" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              下载文件
            </Button>
            <Button variant="outline" onClick={handleReset}>
              继续爬取
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}