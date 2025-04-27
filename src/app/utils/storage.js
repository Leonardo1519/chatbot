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
    // 否则返回默认密钥（可能是环境变量或备用密钥）
    return DEFAULT_API_KEY;
  } catch (error) {
    console.error('获取API密钥时出错:', error);
    return DEFAULT_API_KEY;
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
    return settings ? JSON.parse(settings) : {};
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