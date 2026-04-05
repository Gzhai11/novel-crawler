# 反爬机制应对指南

## 常见反爬机制

### 1. 请求头检测

| 检测类型 | 说明 | 应对方案 |
|----------|------|---------|
| User-Agent | 检测浏览器标识 | 设置常见浏览器 UA |
| Referer | 检测来源页面 | 设置目标网站首页 |
| Accept-Language | 检测语言 | 设置 `zh-CN,zh;q=0.9` |
| Accept-Encoding | 检测压缩支持 | 设置 `gzip, deflate` |

**推荐请求头配置**：

```python
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://example.com/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}
```

### 2. Cookie 和会话

| 情况 | 说明 | 应对方案 |
|------|------|---------|
| 登录验证 | 需要登录才能访问 | 手动登录后获取 Cookie |
| 会话跟踪 | 追踪用户行为 | 维持会话，保存 Cookie |
| Token 验证 | 动态生成 token | 解析页面提取 token |

### 3. 访问频率限制

| 限制类型 | 应对方案 |
|----------|---------|
| IP 封禁 | 使用代理池 |
| 频率限制 | 添加随机延迟 1-5 秒 |
| 并发限制 | 串行请求，控制并发数 |
| 时间窗口限制 | 分散请求时间 |

### 4. JavaScript 渲染

| 情况 | 说明 | 应对方案 |
|------|------|---------|
| 动态加载内容 | 需要 JS 执行 | 使用 Selenium/Playwright |
| 滚动加载 | 需要滚动触发 | 模拟滚动操作 |
| 点击加载 | 需要点击触发 | 模拟点击操作 |

### 5. 内容加密

| 加密类型 | 识别方式 | 应对方案 |
|----------|---------|---------|
| Base64 编码 | 文本包含 `==` | Base64 解码 |
| Unicode 编码 | `\uXXXX` 格式 | Unicode 解码 |
| 自定义加密 | 混淆的 JS 函数 | 分析解密函数 |
| 字体加密 | 特殊字体显示 | OCR 或字体映射 |

### 6. 验证码

| 类型 | 应对方案 |
|------|---------|
| 图片验证码 | OCR 识别（tesseract） |
| 滑动验证码 | 模拟轨迹拖动 |
| 点选验证码 | 图像识别 + 点击 |
| 短信验证码 | 需人工介入 |

## 应对策略流程

```
┌─────────────────────────────────────────────┐
│              反爬检测与应对流程               │
├─────────────────────────────────────────────┤
│  1. 发送测试请求                            │
│       ↓                                     │
│  2. 检查响应状态                            │
│       ├── 200 OK → 继续分析                 │
│       ├── 403 Forbidden → 请求头问题        │
│       ├── 429 Too Many → 频率限制          │
│       └── 其他错误 → 特殊处理               │
│       ↓                                     │
│  3. 检查内容完整性                          │
│       ├── 内容正常 → 分析结构               │
│       ├── 内容为空 → JS 渲染问题            │
│       ├── 乱码 → 编码问题                   │
│       └── 验证码页面 → 验证码处理           │
│       ↓                                     │
│  4. 应用对应策略                            │
│       ↓                                     │
│  5. 重试验证                                │
└─────────────────────────────────────────────┘
```

## 特殊网站类型处理

### 需要登录的网站

```python
# 方案1：使用 Cookie
cookies = {'session_id': 'xxx', 'user_token': 'xxx'}
response = requests.get(url, cookies=cookies)

# 方案2：模拟登录
session = requests.Session()
login_data = {'username': 'xxx', 'password': 'xxx'}
session.post(login_url, data=login_data)
response = session.get(content_url)
```

### 动态加载的网站

```python
# 使用 Playwright
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(url)
    page.wait_for_selector('.content')  # 等待内容加载
    content = page.inner_text('.content')
```

### 字体加密的网站

```python
# 字体映射方案
font_map = {
    'custom_font_char': 'real_char',
    # ... 从字体文件中提取映射关系
}

def decrypt_text(encrypted_text, font_map):
    return ''.join(font_map.get(c, c) for c in encrypted_text)
```

## 合规性建议

### 遵守 robots.txt

```python
import urllib.robotparser

rp = urllib.robotparser.RobotFileParser()
rp.set_url('https://example.com/robots.txt')
rp.read()

if rp.can_fetch('*', url):
    # 允许爬取
    pass
```

### 合理延迟

```python
import time
import random

def crawl_with_delay(url):
    response = requests.get(url)
    # 随机延迟 1-3 秒
    time.sleep(random.uniform(1, 3))
    return response
```

### 标识身份

```python
headers = {
    'User-Agent': 'MyNovelCrawler/1.0 (Educational Purpose; contact@example.com)',
}
```

## 检测清单

在分析网站时，检查以下项目：

- [ ] robots.txt 是否允许爬取
- [ ] 是否需要设置 User-Agent
- [ ] 是否需要 Referer
- [ ] 是否需要 Cookie
- [ ] 是否有频率限制
- [ ] 内容是否需要 JS 渲染
- [ ] 是否有验证码
- [ ] 是否有内容加密
- [ ] 编码格式是什么
- [ ] 是否需要登录