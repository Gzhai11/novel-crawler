import { useState } from 'react';
import { Button, Input, Select, MessagePlugin, Progress } from 'tdesign-react';
import { BookOpen, Download, Loader2, FileText, Trash2 } from 'lucide-react';

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

interface NovelCrawlerProps {
  onSendMessage?: (message: string) => void;
}

export function NovelCrawler({ onSendMessage }: NovelCrawlerProps) {
  // 步骤状态
  const [step, setStep] = useState<'input' | 'analyzing' | 'range' | 'crawling' | 'done'>('input');
  
  // 输入
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'txt' | 'md' | 'html' | 'json'>('txt');
  
  // 分析结果
  const [novel, setNovel] = useState<NovelInfo | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
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

  // 分析页面
  const handleAnalyze = async () => {
    if (!url.trim()) {
      MessagePlugin.warning('请输入小说页面URL');
      return;
    }

    // 简单验证 URL
    try {
      new URL(url);
    } catch {
      MessagePlugin.error('请输入有效的URL');
      return;
    }

    setStep('analyzing');
    setProgress({ current: 0, total: 0, message: '正在分析页面...' });

    try {
      const res = await fetch('/api/crawler/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '分析失败');
      }

      setNovel(data.novel);
      setChapters(data.chapters || []);
      setEndChapter(data.totalChapters - 1 || 0);
      setStep('range');
      MessagePlugin.success(`发现 ${data.totalChapters} 个章节`);
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
      
      // 轮询进度
      pollProgress(data.taskId);
    } catch (error: any) {
      MessagePlugin.error(error.message || '启动失败');
      setStep('range');
    }
  };

  // 轮询进度
  const pollProgress = async (tid: string) => {
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
            
            // 如果有消息发送回调，发送完成消息
            if (onSendMessage) {
              onSendMessage(`小说《${novel?.title}》爬取完成！共 ${data.result.chapters?.length || 0} 章，约 ${data.result.totalWords || 0} 字。`);
            }
            return;
          }

          if (data.progress.phase === 'error') {
            MessagePlugin.error(data.progress.message || '爬取失败');
            setStep('range');
            return;
          }
        }

        // 继续轮询
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

  // 重新开始
  const handleReset = () => {
    setStep('input');
    setUrl('');
    setNovel(null);
    setChapters([]);
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
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold">智能小说爬取</h1>
        </div>
        <p className="text-gray-500">输入小说网站链接，自动识别并爬取章节内容</p>
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
            onClick={handleAnalyze}
          >
            分析页面
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

      {/* 步骤 3: 选择范围 */}
      {step === 'range' && novel && (
        <div className="space-y-6">
          {/* 小说信息 */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h2 className="text-xl font-bold mb-2">{novel.title}</h2>
            {novel.author && <p className="text-gray-600">作者: {novel.author}</p>}
            {novel.description && (
              <p className="text-gray-500 text-sm mt-2 line-clamp-3">{novel.description}</p>
            )}
            <p className="text-blue-600 mt-2">共 {chapters.length} 章</p>
          </div>

          {/* 章节范围 */}
          <div>
            <label className="block text-sm font-medium mb-2">爬取范围</label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  value={startChapter + 1}
                  onChange={(val) => setStartChapter(Math.max(0, Number(val) - 1))}
                  label="起始章节"
                  min={1}
                  max={chapters.length}
                />
              </div>
              <span className="text-gray-500">至</span>
              <div className="flex-1">
                <Input
                  type="number"
                  value={endChapter + 1}
                  onChange={(val) => setEndChapter(Math.min(chapters.length - 1, Number(val) - 1))}
                  label="结束章节"
                  min={1}
                  max={chapters.length}
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

          {/* 章节预览 */}
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
            <p className="text-sm font-medium mb-2">章节列表预览:</p>
            <div className="space-y-1 text-sm">
              {chapters.slice(0, 10).map((ch, i) => (
                <div key={ch.index} className={i >= startChapter && i <= endChapter ? 'text-blue-600' : 'text-gray-400'}>
                  {ch.index + 1}. {ch.title}
                </div>
              ))}
              {chapters.length > 10 && (
                <p className="text-gray-400">... 共 {chapters.length} 章</p>
              )}
            </div>
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
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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