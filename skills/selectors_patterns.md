# 网站选择器模式库

## 通用章节列表选择器

### 笔趣阁系列
```css
#list dd a
.listmain a
#list a
```

### 章节列表通用
```css
.chapter-list a
#chapters a
.catalog a
.chapter-list-box a
#chapter-list a
```

### 书籍列表
```css
.book-list a
.zjlist a
.menu_list a
```

### 列表主页
```css
div.listmain a
div.list a
ul.chapter-list a
```

## 章节标题正则匹配

```javascript
const CHAPTER_PATTERNS = [
  // 中文章节
  /^第[一二三四五六七八九十百千万零\d]+[章节回集]/,
  /^第[\d]+[章节回]/,
  
  // 数字章节
  /^[【\[]?[\d]+[】\]]/,
  /^\d+[\.\、]/,
  
  // 英文章节
  /^Chapter\s*\d+/i,
  /^CHAPTER\s*\d+/i,
];
```

## 内容区域选择器

### 常用选择器
```css
#content
.content
#chapter-content
.chapter-content
.novel-content
.article-content
.text-content
.book-content
#BookText
#txt
.txt
article
.post-content
.entry-content
```

### 优先级排序
1. `#content` - 最常见
2. `#chapter-content` - 专用章节内容
3. `.novel-content` - 小说内容
4. `#BookText` - 书本内容
5. `article` - HTML5 语义标签

## 噪音元素选择器

```css
/* 广告 */
.ads
.advertisement
.ad

/* 导航 */
nav
.nav
header
footer

/* 推荐 */
.recommend
.related

/* 评论 */
.comments
.comment-list

/* 分享 */
.share
.social

/* 侧边栏 */
[class*="sidebar"]
.sidebar

/* 需要移除的标签 */
script
style
iframe
```

## 小说信息选择器

### 书名
```css
h1
meta[property="og:title"]
.title
.book-title
```

### 作者
```css
meta[property="og:author"]
meta[name="author"]
[class*="author"]
.author-name
```

### 封面
```css
meta[property="og:image"]
.book-cover img
.cover img
```

### 简介
```css
meta[property="og:description"]
meta[name="description"]
.book-intro
.intro
.description
```

## 常见网站模板

### 起点/阅文系
```javascript
{
  title: '.book-info h1',
  author: '.book-info .writer',
  chapters: '.chapter-wrap a',
  content: '.read-content .j_readContent',
}
```

### 纵横系
```javascript
{
  title: '.book-name',
  author: '.au-name a',
  chapters: '.chapter-list a',
  content: '.content',
}
```

### 免费小说站
```javascript
{
  title: 'h1',
  author: '.author, #info p:first-child',
  chapters: '#list dd a, .listmain a',
  content: '#content, #chapter-content',
}
```

## 动态加载检测

### 检测抽屉式加载
```javascript
const hasDrawer = await page.$('.load-more, .expand, .show-all, [class*="more"]');
```

### 检测滚动加载
```javascript
const hasInfiniteScroll = await page.evaluate(() => {
  return window.addEventListener.toString().includes('scroll');
});
```

### 检测分页
```javascript
const hasPagination = await page.$('.pagination, .page-nav, .pager, .page-link');
```

## 内容清洗规则

### 移除噪音文本
```javascript
const NOISE_PATTERNS = [
  /^.*?小说.*?首发.*$/,
  /^.*?本章未完.*$/,
  /^.*?点击下一页.*$/,
  /^.*?返回目录.*$/,
  /^.*?推荐阅读.*$/,
  /^.*?www\..*?\.com.*$/,
  /^.*?http[s]?:\/\/.*$/,
  /^[（\(].*?[）\)]$/,
  /^---+$/,
  /^\s*$/,
];
```

### 提取纯文本
```javascript
const cleanContent = (html) => {
  // 1. 移除 HTML 标签
  let text = html.replace(/<[^>]+>/g, '');
  
  // 2. 解码 HTML 实体
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"');
  
  // 3. 清理多余空白
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};
```