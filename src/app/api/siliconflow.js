import { OpenAI } from 'openai';
import { getApiKey, validateApiKey } from '../utils/storage';

// 创建OpenAI客户端实例，配置为使用SiliconFlow的API
export const createClient = (apiKey) => {
  // 如果未提供API密钥，则使用默认密钥
  const actualApiKey = apiKey || getApiKey();
  
  return new OpenAI({
    apiKey: actualApiKey,
    baseURL: 'https://api.siliconflow.cn/v1',
    dangerouslyAllowBrowser: true, // 允许在浏览器中使用API密钥
  });
};

// 处理API错误
export function handleApiError(error) {
  console.error('API错误详情:', error);
  
  // 检查是否有响应状态码
  if (error.status === 401 || (error.message && error.message.includes('401'))) {
    return {
      success: false,
      error: 'API密钥无效或已过期，请检查您的API密钥是否正确',
      errorCode: 401,
      shouldRetry: false
    };
  } else if (error.status === 429 || (error.message && error.message.includes('429'))) {
    return {
      success: false,
      error: '请求过于频繁，请稍后再试',
      errorCode: 429,
      shouldRetry: true
    };
  } else if (error.message && error.message.includes('Connection error')) {
    return {
      success: false,
      error: '网络连接错误，请检查您的网络连接或SiliconFlow服务是否可用',
      errorCode: 'NETWORK_ERROR',
      shouldRetry: true
    };
  }
  
  // 默认错误信息
  return {
    success: false,
    error: error.message || '调用API时出错',
    errorCode: error.status || 'UNKNOWN',
    shouldRetry: false
  };
}

// 向SiliconFlow发送对话消息并获取响应
export async function sendMessage(apiKey, messages, model = 'deepseek-ai/DeepSeek-V2.5', temperature = 0.7) {
  try {
    // 确保有API密钥
    const actualApiKey = apiKey || getApiKey();
    
    if (!actualApiKey || actualApiKey.trim() === '') {
      return {
        success: false,
        error: 'API密钥未提供，请在设置中配置有效的API密钥',
        errorCode: 'NO_API_KEY',
        shouldRetry: false
      };
    }
    
    // 验证API密钥
    const isValid = await validateApiKey(actualApiKey);
    if (!isValid) {
      return {
        success: false,
        error: 'API密钥无效或已过期，请检查您的API密钥是否正确',
        errorCode: 'INVALID_API_KEY',
        shouldRetry: false
      };
    }
    
    const client = createClient(actualApiKey);
    
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的IT专家，擅长软件开发和算法设计。你可以提供以下方面的专业建议：\n1. 软件架构设计\n2. 编程语言选择\n3. 算法优化\n4. 代码审查\n5. 技术选型\n6. 性能优化\n7. 安全最佳实践\n8. 开发工具推荐\n\n回答格式要求：\n1. 使用 Markdown 格式进行回答\n2. 使用 #、##、### 等标记来区分标题层级\n3. 使用 * 或 - 来创建无序列表\n4. 使用 1.、2.、3. 等来创建有序列表\n5. 使用 ``` 来创建代码块\n6. 使用 * 或 _ 来强调重要内容\n7. 使用 > 来引用重要内容\n8. 使用空行来分隔段落\n\n示例格式：\n\n# 主要标题\n\n## 子标题\n\n这是第一段内容。\n\n### 具体步骤\n\n1. 第一步\n2. 第二步\n\n### 代码示例\n\n```python\nprint("Hello World")\n```\n\n### 注意事项\n\n* 重要提示1\n* 重要提示2\n\n请使用 Markdown 格式来组织你的回答，使内容更加清晰易读。'
        },
        ...messages.map(msg => ({
          role: msg.isSender ? 'user' : 'assistant',
          content: msg.text
        }))
      ],
      temperature: temperature,
      max_tokens: 1024,
      stream: false // 非流式响应
    });

    return {
      success: true,
      data: response.choices[0].message.content
    };
  } catch (error) {
    console.error('SiliconFlow API调用失败:', error);
    return handleApiError(error);
  }
}

// 流式发送消息并获取响应
export async function streamMessage(apiKey, messages, onChunk, onComplete, onError, model = 'deepseek-ai/DeepSeek-V2.5', temperature = 0.7) {
  try {
    // 确保有API密钥
    const actualApiKey = apiKey || getApiKey();
    
    if (!actualApiKey || actualApiKey.trim() === '') {
      const error = 'API密钥未提供，请在设置中配置有效的API密钥';
      onError(error);
      return {
        success: false,
        error: error,
        errorCode: 'NO_API_KEY',
        shouldRetry: false
      };
    }
    
    // 验证API密钥
    const isValid = await validateApiKey(actualApiKey);
    if (!isValid) {
      const error = 'API密钥无效或已过期，请检查您的API密钥是否正确';
      onError(error);
      return {
        success: false,
        error: error,
        errorCode: 'INVALID_API_KEY',
        shouldRetry: false
      };
    }
    
    const client = createClient(actualApiKey);
    
    const stream = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的IT专家，擅长软件开发和算法设计。你可以提供以下方面的专业建议：\n1. 软件架构设计\n2. 编程语言选择\n3. 算法优化\n4. 代码审查\n5. 技术选型\n6. 性能优化\n7. 安全最佳实践\n8. 开发工具推荐\n\n回答格式要求：\n1. 使用 Markdown 格式进行回答\n2. 使用 #、##、### 等标记来区分标题层级\n3. 使用 * 或 - 来创建无序列表\n4. 使用 1.、2.、3. 等来创建有序列表\n5. 使用 ``` 来创建代码块\n6. 使用 * 或 _ 来强调重要内容\n7. 使用 > 来引用重要内容\n8. 使用空行来分隔段落\n\n示例格式：\n\n# 主要标题\n\n## 子标题\n\n这是第一段内容。\n\n### 具体步骤\n\n1. 第一步\n2. 第二步\n\n### 代码示例\n\n```python\nprint("Hello World")\n```\n\n### 注意事项\n\n* 重要提示1\n* 重要提示2\n\n请使用 Markdown 格式来组织你的回答，使内容更加清晰易读。'
        },
        ...messages.map(msg => ({
          role: msg.isSender ? 'user' : 'assistant',
          content: msg.text
        }))
      ],
      temperature: temperature,
      max_tokens: 1024,
      stream: true // 流式响应
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      onChunk(content);
    }
    
    onComplete(fullResponse);
    return { success: true };
  } catch (error) {
    console.error('SiliconFlow API流式调用失败:', error);
    const errorResult = handleApiError(error);
    onError(errorResult.error);
    return errorResult;
  }
} 