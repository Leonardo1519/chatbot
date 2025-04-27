# SiliconFlow聊天机器人

基于Next.js和SiliconFlow API开发的聊天机器人应用。

## 功能特点

- 基于SiliconFlow的AI聊天功能
- 流式响应，实时显示AI回复
- 支持自定义模型选择
- 聊天历史保存
- 响应式设计，适配移动设备

## 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/chatbot.git
cd chatbot
```

2. 安装依赖：
```bash
npm install
```

3. 创建`.env.local`文件并添加您的SiliconFlow API密钥：
```
NEXT_PUBLIC_SILICONFLOW_API_KEY=your-api-key-here
```

4. 启动开发服务器：
```bash
npm run dev
```

5. 打开浏览器访问 http://localhost:3000

## 在Vercel上部署

### 方法一：使用Vercel UI

1. 登录[Vercel](https://vercel.com)
2. 点击"Add New..."→"Project"
3. 导入您的GitHub仓库
4. 在"Environment Variables"部分添加：
   - 名称：`NEXT_PUBLIC_SILICONFLOW_API_KEY`
   - 值：您的SiliconFlow API密钥
5. 点击"Deploy"

### 方法二：使用Vercel CLI

1. 全局安装Vercel CLI：
```bash
npm install -g vercel
```

2. 登录Vercel：
```bash
vercel login
```

3. 设置环境变量并部署：
```bash
vercel --env NEXT_PUBLIC_SILICONFLOW_API_KEY=your-api-key-here
```

## 环境变量

应用使用以下环境变量：

- `NEXT_PUBLIC_SILICONFLOW_API_KEY`：您的SiliconFlow API密钥

## 注意事项

- API密钥优先级：用户设置 > 环境变量 > 代码中的备用密钥
- 在生产环境中务必使用环境变量存储API密钥
- 默认情况下，用户不需要手动输入API密钥，应用会自动使用环境变量中的密钥

## 许可证

MIT
