// 检查是否在客户端环境
export const isClient = typeof window !== 'undefined';

// 尝试从环境变量中获取API密钥
const getEnvApiKey = () => {
  try {
    return (typeof process !== 'undefined' && 
            process.env && 
            process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY) || '';
  } catch (e) {
    return '';
  }
};

// 预设的API密钥 - 优先使用环境变量
// 注意：在生产环境中，应该使用环境变量而不是在代码中硬编码API密钥
export const DEFAULT_API_KEY = getEnvApiKey() || 
  'sk-koputwketvnnikxxsrcfldtiebmgigjbcnliiskzsxyvuvui'; // 如果环境变量不可用，使用备用密钥

// 默认主题颜色
export const DEFAULT_THEME = 'blue';

// 可用的主题颜色列表
export const AVAILABLE_THEMES = [
  { key: 'blue', name: '蓝色', primary: '#1890ff' },
  { key: 'green', name: '绿色', primary: '#52c41a' },
  { key: 'purple', name: '紫色', primary: '#722ed1' },
  { key: 'orange', name: '橙色', primary: '#fa8c16' },
  { key: 'red', name: '红色', primary: '#f5222d' }
];

// 获取API密钥，优先使用用户配置的密钥，如果没有则使用默认密钥
export function getApiKey() {
  if (!isClient) return DEFAULT_API_KEY;
  
  try {
    const settings = localStorage.getItem('chatSettings');
    const parsedSettings = settings ? JSON.parse(settings) : {};
    
    // 如果用户设置了密钥且不为空
    if (parsedSettings.apiKey && parsedSettings.apiKey.trim() !== '') {
      return parsedSettings.apiKey;
    }
    
    // 检查环境变量
    const envApiKey = getEnvApiKey();
    if (envApiKey && envApiKey.trim() !== '') {
      return envApiKey;
    }
    
    // 如果都没有，返回默认密钥
    return DEFAULT_API_KEY;
  } catch (error) {
    console.error('获取API密钥时出错:', error);
    return DEFAULT_API_KEY;
  }
}

// 获取当前主题
export function getTheme() {
  if (!isClient) return DEFAULT_THEME;
  
  try {
    // 从localStorage读取保存的主题
    const settings = localStorage.getItem('chatSettings');
    const parsedSettings = settings ? JSON.parse(settings) : {};
    
    // 如果有保存的主题并且是有效主题，则返回保存的主题
    if (parsedSettings.theme && AVAILABLE_THEMES.some(t => t.key === parsedSettings.theme)) {
      return parsedSettings.theme;
    }
    
    // 否则返回默认主题
    return DEFAULT_THEME;
  } catch (error) {
    console.error('获取主题时出错:', error);
    return DEFAULT_THEME;
  }
}

// 获取主题色值
export function getThemeColor(theme = null) {
  const currentTheme = theme || getTheme();
  const themeObj = AVAILABLE_THEMES.find(t => t.key === currentTheme);
  return themeObj ? themeObj.primary : AVAILABLE_THEMES[0].primary;
}

// 验证API密钥是否有效
export async function validateApiKey(apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }

  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V2.5',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    
    if (response.status === 401) {
      return false;
    }
    
    return response.status === 200;
  } catch (error) {
    console.error('验证API密钥时出错:', error);
    return false;
  }
}

// 检查API密钥是否有效并更新状态
export async function checkAndUpdateApiKeyStatus() {
  if (!isClient) return false;
  
  try {
    const currentKey = getApiKey();
    const isValid = await validateApiKey(currentKey);
    
    if (!isValid) {
      // 如果密钥无效，清除本地存储的密钥
      const settings = localStorage.getItem('chatSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        delete parsedSettings.apiKey;
        localStorage.setItem('chatSettings', JSON.stringify(parsedSettings));
      }
    }
    
    return isValid;
  } catch (error) {
    console.error('检查API密钥状态时出错:', error);
    return false;
  }
}

// 保存设置到localStorage
export function saveSettings(settings) {
  if (!isClient) return false;
  
  try {
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('保存设置时出错:', error);
    return false;
  }
}

// 从localStorage加载设置
export function loadSettings() {
  if (!isClient) return {};
  
  try {
    const settings = localStorage.getItem('chatSettings');
    const parsedSettings = settings ? JSON.parse(settings) : {};
    
    // 确保返回的设置包含默认值
    if (!parsedSettings.model) {
      parsedSettings.model = 'deepseek-ai/DeepSeek-V2.5';
    }
    
    if (parsedSettings.temperature === undefined) {
      parsedSettings.temperature = 0.5; // 设置为平衡值
    }
    
    // 确保默认主题为蓝色
    if (!parsedSettings.theme) {
      parsedSettings.theme = DEFAULT_THEME; // 蓝色主题
    }
    
    return parsedSettings;
  } catch (error) {
    console.error('加载设置时出错:', error);
    return {};
  }
}

// 保存聊天历史到localStorage
export function saveHistory(messages) {
  if (!isClient) return false;
  
  try {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('保存聊天历史时出错:', error);
    return false;
  }
}

// 从localStorage加载聊天历史
export function loadHistory() {
  if (!isClient) return [];
  
  try {
    const history = localStorage.getItem('chatHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('加载聊天历史时出错:', error);
    return [];
  }
}

// 保存会话到localStorage
export function saveSessions(sessions) {
  if (!isClient) return false;
  
  try {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('保存会话时出错:', error);
    return false;
  }
}

// 从localStorage加载会话
export function loadSessions() {
  if (!isClient) return [];
  
  try {
    const sessions = localStorage.getItem('chatSessions');
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('加载会话时出错:', error);
    return [];
  }
}

// 保存用户头像
export function saveUserAvatar(avatarDataUrl) {
  if (!isClient) return false;
  
  try {
    localStorage.setItem('userAvatar', avatarDataUrl);
    return true;
  } catch (error) {
    console.error('保存用户头像时出错:', error);
    return false;
  }
}

// 加载用户头像
export function loadUserAvatar() {
  if (!isClient) return null;
  
  try {
    return localStorage.getItem('userAvatar');
  } catch (error) {
    console.error('加载用户头像时出错:', error);
    return null;
  }
} 