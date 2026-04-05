# Scrapy-SKILL 爬取技能

## 技能描述

智能小说爬取技能，支持多种小说网站的结构识别和内容提取。

## 工作流程

### 1. 页面分析阶段
```
分析目标页面 → 识别网站类型 → 确定爬取策略
```

- 检测页面结构（列表页/详情页）
- 识别章节列表容器和链接选择器
- 检测是否有抽屉式加载（点击展开更多）
- 检测是否有分页机制
- 识别内容区域选择器

### 2. 章节列表获取
```
获取章节链接 → 过滤无效链接 → 排序整理
```

常用章节选择器：
```css
/* 笔趣阁系列 */
#list dd a
.listmain a

/* 章节列表 */
.chapter-list a
#chapters a
.catalog a

/* 通用模式 */
a[href*="chapter"]
a[href*="章节"]
```

### 3. 内容爬取阶段
```
遍历章节 → 提取正文 → 清洗内容 → 保存进度
```

常用内容选择器：
```css
#content
#chapter-content
.chapter-content
.novel-content
.article-content
#txt
.text-content
```

### 4. 断点续爬机制
```
检查已爬取 → 跳过已完成 → 继续未完成
```

- 每爬取一章立即保存进度
- 支持从任意章节继续
- 不重复爬取已完成章节

## 反爬处理策略

### 常见反爬类型

| 类型 | 处理方式 |
|------|----------|
| 请求频率限制 | 添加随机延迟 1-3 秒 |
| User-Agent 检测 | 随机 UA 轮换 |
| Cookie 验证 | 保持 Session 会话 |
| IP 限制 | 提示用户或使用代理 |
| 验证码 | 提示用户手动处理 |

### 延迟策略
```javascript
// 随机延迟，模拟人类行为
const delay = () => {
  const baseDelay = 1000; // 基础延迟 1 秒
  const randomDelay = Math.random() * 2000; // 随机 0-2 秒
  return new Promise(r => setTimeout(r, baseDelay + randomDelay));
};
```

## 输出格式

### TXT 格式
```
小说标题
作者：XXX

第一章 标题

正文内容...

第二章 标题

正文内容...
```

### Markdown 格式
```markdown
# 小说标题

**作者**: XXX

## 目录

- [第一章](#第一章)
- [第二章](#第二章)

---

## 第一章 标题

正文内容...
```

### HTML 格式
- 包含目录导航
- 响应式布局
- 支持在线阅读

### JSON 格式
```json
{
  "novel": {
    "title": "小说标题",
    "author": "作者",
  "description": "简介"
  },
  "chapters": [
    {
      "index": 1,
      "title": "第一章",
      "content": "正文..."
    }
  ]
}
```

## 注意事项

1. **仅爬取公开免费内容**
2. **遵守 robots.txt 规则**
3. **添加适当延迟，避免服务器压力**
4. **支持断点续爬，不丢失进度**
5. **遇到反爬时友好提示用户**