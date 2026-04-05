# 反爬处理指南

## 常见反爬机制

### 1. 请求频率限制

**检测方式**：
- 短时间内大量请求返回 429 状态码
- 页面显示"访问过于频繁"提示

**处理方案**：
```javascript
// 指数退避策略
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await sleep(delay);
    }
  }
};
```

### 2. User-Agent 检测

**检测方式**：
- 返回 403 Forbidden
- 页面提示"请使用浏览器访问"

**处理方案**：
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

const getRandomUA = () => userAgents[Math.floor(Math.random() * userAgents.length)];
```

### 3. Cookie/Session 验证

**检测方式**：
- 需要登录才能访问内容
- Session 过期后返回登录页

**处理方案**：
```javascript
// 使用 Playwright 保持会话
const context = await browser.newContext();
const page = await context.newPage();

// 如果需要登录，提示用户
if (isLoginPage) {
  console.log('该网站需要登录，请在浏览器中手动登录后继续');
  // 等待用户操作
}
```

### 4. JavaScript 动态加载

**检测方式**：
- 源码中没有内容
- 需要 JS 执行后才能看到章节

**处理方案**：
```javascript
// 使用 Playwright 等待内容加载
await page.waitForSelector('#content', { timeout: 10000 });
await page.waitForTimeout(1000); // 额外等待确保内容完全加载
```

### 5. 抽屉式/点击加载

**检测方式**：
- 章节列表不完整
- 有"加载更多"或"展开"按钮

**处理方案**：
```javascript
// 模拟点击展开
const expandButton = await page.$('.load-more, .expand-btn');
while (expandButton) {
  await expandButton.click();
  await page.waitForTimeout(500);
  expandButton = await page.$('.load-more, .expand-btn');
}
```

### 6. 滚动加载

**检测方式**：
- 向下滚动时加载更多内容
- 滚动到底部才能看到全部章节

**处理方案**：
```javascript
// 模拟滚动到底部
const scrollToBottom = async (page) => {
  let lastHeight = 0;
  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }
};
```

### 7. 验证码

**检测方式**：
- 图片验证码
- 滑块验证
- 点选验证

**处理方案**：
```javascript
// 检测验证码
const captcha = await page.$('.captcha, #captcha, .verify-code');
if (captcha) {
  console.log('检测到验证码，请手动完成验证后继续...');
  // 等待验证码消失
  await page.waitForSelector('.captcha', { state: 'detached', timeout: 60000 });
}
```

### 8. IP 封禁

**检测方式**：
- 返回 403/503 错误
- 页面显示"访问被拒绝"

**处理方案**：
- 提示用户更换网络
- 降低请求频率
- 使用代理（需用户配置）

## 最佳实践

1. **尊重网站规则**
   - 检查 robots.txt
   - 设置合理的请求延迟
   - 避开高峰期

2. **模拟真实用户**
   - 随机延迟
   - 随机 UA
   - 自然的行为模式

3. **错误处理**
   - 失败时自动重试（指数退避）
   - 保存已爬取进度
   - 提供友好的错误提示

4. **断点续爬**
   - 每爬取一章立即保存
   - 支持从任意位置继续
   - 不重复、不遗漏