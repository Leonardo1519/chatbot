import { OpenAI } from 'openai';
import { getApiKey } from '../utils/storage';

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
      errorCode: 401
    };
  } else if (error.status === 429 || (error.message && error.message.includes('429'))) {
    return {
      success: false,
      error: '请求过于频繁，请稍后再试',
      errorCode: 429
    };
  } else if (error.message && error.message.includes('Connection error')) {
    return {
      success: false,
      error: '网络连接错误，请检查您的网络连接或SiliconFlow服务是否可用',
      errorCode: 'NETWORK_ERROR'
    };
  }
  
  // 默认错误信息
  return {
    success: false,
    error: error.message || '调用API时出错',
    errorCode: error.status || 'UNKNOWN'
  };
}

// 向SiliconFlow发送对话消息并获取响应
export async function sendMessage(apiKey, messages, model = 'deepseek-ai/DeepSeek-V2.5') {
  try {
    // 确保有API密钥
    const actualApiKey = apiKey || getApiKey();
    
    if (!actualApiKey || actualApiKey.trim() === '') {
      return {
        success: false,
        error: 'API密钥未提供，请在设置中配置有效的API密钥',
        errorCode: 'NO_API_KEY'
      };
    }
    
    const client = createClient(actualApiKey);
    
    const response = await client.chat.completions.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.isSender ? 'user' : 'assistant',
        content: msg.text
      })),
      temperature: 0.7,
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
export async function streamMessage(apiKey, messages, onChunk, onComplete, onError, model = 'deepseek-ai/DeepSeek-V2.5') {
  try {
    // 确保有API密钥
    const actualApiKey = apiKey || getApiKey();
    
    if (!actualApiKey || actualApiKey.trim() === '') {
      const error = 'API密钥未提供，请在设置中配置有效的API密钥';
      onError(error);
      return {
        success: false,
        error: error,
        errorCode: 'NO_API_KEY'
      };
    }
    
    const client = createClient(actualApiKey);
    
    const stream = await client.chat.completions.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.isSender ? 'user' : 'assistant',
        content: msg.text
      })),
      temperature: 0.7,
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