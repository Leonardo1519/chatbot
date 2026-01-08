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
          content: '你是一位专业的圆圆，擅长思想政治教育、非遗文化传承与非遗设计领域。你可以提供以下方面的专业知识和建议：\n\n## 思想政治教育\n- 马克思主义基本原理\n- 中国特色社会主义理论体系\n- 习近平新时代中国特色社会主义思想\n- 社会主义核心价值观\n- 爱国主义教育与民族精神\n- 中国近现代史与党史\n- 形势与政策分析\n\n## 非物质文化遗产\n- 中国非遗项目介绍与保护\n- 传统手工艺（剪纸、刺绣、陶瓷、编织等）\n- 传统表演艺术（戏曲、民乐、舞蹈等）\n- 民俗文化与节庆习俗\n- 传统医药与养生文化\n- 口头传统与民间文学\n- 非遗传承人与技艺传承\n\n## 非遗设计与创新\n- 非遗元素在现代设计中的应用\n- 传统纹样与图案设计\n- 非遗文创产品开发\n- 传统工艺与现代技术融合\n- 非遗品牌化与市场推广\n- 非遗数字化保护与展示\n\n回答格式要求：\n1. 使用 Markdown 格式进行回答\n2. 使用 #、##、### 等标记来区分标题层级\n3. 使用 * 或 - 来创建无序列表\n4. 使用 1.、2.、3. 等来创建有序列表\n5. 使用 * 或 _ 来强调重要内容\n6. 使用 > 来引用重要内容\n7. 使用空行来分隔段落\n\n请使用上述格式来组织你的回答，使内容更加清晰易读。在回答中注重弘扬中华优秀传统文化，传播正能量。'
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
          content: '你是一位专业的圆圆，擅长思想政治教育、非遗文化传承与非遗设计领域。你可以提供以下方面的专业知识和建议：\n\n## 思想政治教育\n- 马克思主义基本原理\n- 中国特色社会主义理论体系\n- 习近平新时代中国特色社会主义思想\n- 社会主义核心价值观\n- 爱国主义教育与民族精神\n- 中国近现代史与党史\n- 形势与政策分析\n\n## 非物质文化遗产\n- 中国非遗项目介绍与保护\n- 传统手工艺（剪纸、刺绣、陶瓷、编织等）\n- 传统表演艺术（戏曲、民乐、舞蹈等）\n- 民俗文化与节庆习俗\n- 传统医药与养生文化\n- 口头传统与民间文学\n- 非遗传承人与技艺传承\n\n## 非遗设计与创新\n- 非遗元素在现代设计中的应用\n- 传统纹样与图案设计\n- 非遗文创产品开发\n- 传统工艺与现代技术融合\n- 非遗品牌化与市场推广\n- 非遗数字化保护与展示\n\n回答格式要求：\n1. 使用 Markdown 格式进行回答\n2. 使用 #、##、### 等标记来区分标题层级\n3. 使用 * 或 - 来创建无序列表\n4. 使用 1.、2.、3. 等来创建有序列表\n5. 使用 * 或 _ 来强调重要内容\n6. 使用 > 来引用重要内容\n7. 使用空行来分隔段落\n\n请使用上述格式来组织你的回答，使内容更加清晰易读。在回答中注重弘扬中华优秀传统文化，传播正能量。'
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
    let buffer = '';
    let lastCallTime = Date.now();
    
    // 优化参数设置 - 增大阈值来减少UI更新频率
    const bufferThreshold = 30; // 增大缓冲区大小，大幅减少UI更新频率
    const timeThreshold = 250; // 增加时间阈值，确保更新间隔更长
    
    // 处理特殊标记的状态变量
    let hasSpecialChars = false;
    let markdownBlockOpen = false;
    let lastMdSyntaxTime = 0;
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      buffer += content;
      
      const now = Date.now();
      
      // 检查特殊Markdown语法
      if (/[#*`_~\[\](){}>!\-+\n]/.test(content)) {
        hasSpecialChars = true;
        lastMdSyntaxTime = now;
      }
      
      // 检测代码块开始/结束
      if (content.includes('```')) {
        markdownBlockOpen = !markdownBlockOpen;
        // 代码块状态变化时立即更新
        onChunk(buffer);
        buffer = '';
        lastCallTime = now;
        continue;
      }
      
      // 触发更新的条件：
      // 1. 缓冲区足够大
      // 2. 时间间隔足够长
      // 3. 检测到Markdown语法且积累了足够的缓冲
      // 4. 减少所有更新频率，特别是代码块内部
      const shouldUpdate = 
        buffer.length >= bufferThreshold ||
        now - lastCallTime >= timeThreshold || 
        (hasSpecialChars && buffer.length > 8 && now - lastMdSyntaxTime < 150); // 增加更新阈值
      
      if (shouldUpdate) {
        onChunk(buffer);
        buffer = '';
        lastCallTime = now;
        hasSpecialChars = false;
      }
    }
    
    // 处理可能剩余的缓冲区内容
    if (buffer.length > 0) {
      onChunk(buffer);
    }
    
    // 确保最终响应完整
    onComplete(fullResponse);
    return { success: true };
  } catch (error) {
    console.error('SiliconFlow API流式调用失败:', error);
    const errorResult = handleApiError(error);
    onError(errorResult.error);
    return errorResult;
  }
} 