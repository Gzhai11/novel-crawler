# 常见选择器模式参考

## 目录页选择器模式

### 章节列表

| 模式 | CSS 选择器 | XPath | 适用场景 |
|------|-----------|-------|---------|
| 简单列表 | `.chapter-list a` | `//div[@class="chapter-list"]//a` | 标准目录结构 |
| 有序列表 | `ol.catalog a` | `//ol[@class="catalog"]//a` | 有序号章节 |
| 定义列表 | `dl.chapter-list dt a` | `//dl[@class="chapter-list"]//dt//a` | 卷章节结构 |
| 表格结构 | `table.chapter-list a` | `//table[@class="chapter-list"]//a` | 老式网站 |
| 无序列表 | `ul.chapters li a` | `//ul[@class="chapters"]//li//a` | 常见列表 |

### 章节标题提取

| 模式 | 选择器 | 说明 |
|------|--------|------|
| 文本内容 | `a` 的 `textContent` | 链接文本即标题 |
| title 属性 | `a` 的 `title` 属性 | 标题在属性中 |
| 子元素 | `a .title` | 标题在子元素中 |
| 属性拼接 | `span.num + span.title` | 序号+标题分开 |

### 分页导航

| 模式 | 选择器 | 说明 |
|------|--------|------|
| 下一页链接 | `a.next`, `.pagination .next a` | 下一页按钮 |
| 页码列表 | `.pagination a[data-page]` | 带页码的链接 |
| 加载更多 | `.load-more` 按钮 | 动态加载 |

## 章节页选择器模式

### 章节标题

| 模式 | CSS 选择器 | XPath |
|------|-----------|-------|
| H1 标题 | `h1.chapter-title` | `//h1[@class="chapter-title"]` |
| 通用标题 | `h1`, `.title` | `//h1` 或 `//*[contains(@class,"title")]` |
| 组合标题 | `.chapter-header .title` | `//div[@class="chapter-header"]//span[@class="title"]` |
| 属性标题 | `[data-title]` | `//*[@data-title]` |

### 正文内容

| 模式 | CSS 选择器 | XPath | 说明 |
|------|-----------|-------|------|
| ID 定位 | `#content`, `#chapter-content` | `//*[@id="content"]` | 最精确 |
| 类名定位 | `.content`, `.text-content` | `//*[contains(@class,"content")]` | 常用 |
| 标签+类 | `div.content` | `//div[@class="content"]` | 避免误匹配 |
| 多段落 | `.content p` | `//div[@class="content"]//p` | 段落提取 |

### 需要过滤的元素

| 类型 | 选择器 | 说明 |
|------|--------|------|
| 广告 | `.ad`, `.advertisement`, `[data-ad]` | 广告区块 |
| 导航 | `.nav`, `.navbar`, `nav` | 导航栏 |
| 推荐 | `.recommend`, `.related` | 推荐内容 |
| 评论 | `.comments`, `#comments` | 评论区 |
| 页脚 | `footer`, `.footer` | 页脚信息 |
| 脚本 | `script`, `style`, `noscript` | 技术元素 |

## 导航链接选择器模式

### 章节导航

| 导航类型 | CSS 选择器 | XPath | 文本匹配 |
|----------|-----------|-------|---------|
| 上一章 | `.prev-chapter`, `a[href*="prev"]` | `//a[contains(@class,"prev")]` | `a:contains('上一章')` |
| 下一章 | `.next-chapter`, `a[href*="next"]` | `//a[contains(@class,"next")]` | `a:contains('下一章')` |
| 返回目录 | `.back-catalog`, `a[href*="list"]` | `//a[contains(text(),"目录")]` | `a:contains('目录')` |
| 首页 | `.home`, `a[href="/"]` | `//a[@href="/"]` | `a:contains('首页')` |

### 正文分页导航

| 模式 | 选择器 | 说明 |
|------|--------|------|
| 上一页 | `.prev-page`, `.page-prev` | 正文上一页 |
| 下一页 | `.next-page`, `.page-next` | 正文下一页 |
| 页码 | `.page-num`, `span.current` | 当前页码 |
| 总页数 | `.total-pages`, `.page-count` | 总页数 |

## 常见正文容器模式

### 国内小说网站常见结构

```css
/* 起点、纵横类 */
#content, .chapter-content, .text-content

/* 17K、晋江文学城类 */
#chapterContent, .chapter-text, .article-content

/* 盗版站常见 */
#content1, #chaptercontent, .read-content

/* 移动端适配 */
.chapter_body, .content-body, .article-body
```

### 需要特殊处理的模式

| 问题 | 解决方案 |
|------|---------|
| 内容在 script 中 | 提取 script 内容，解析文本 |
| 内容加密 | 识别加密函数，调用解密 |
| 内容在 iframe 中 | 定位 iframe，切换上下文 |
| 内容为图片 | 提取图片 URL，OCR 识别 |
| 懒加载 | 滚动触发加载，等待渲染 |

## 选择器优先级

推荐按以下优先级尝试选择器：

1. **ID 选择器**：最精确，优先使用
2. **语义化类名**：`.chapter-content`, `.novel-text`
3. **结构选择器**：`article.main p`
4. **属性选择器**：`[data-type="content"]`
5. **位置选择器**：最后手段，不够稳定

## 选择器验证技巧

```javascript
// 浏览器控制台验证选择器
document.querySelectorAll('#content');
document.querySelector('.chapter-title').textContent;

// XPath 验证
$x('//div[@id="content"]//p');
```