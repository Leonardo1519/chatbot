// 检查是否在客户端环境
export const isClient = typeof window !== 'undefined';

// 预设的API密钥
// 注意：在实际生产环境中，存储API密钥应该更加安全，比如使用环境变量或专门的密钥管理服务
export const DEFAULT_API_KEY = 'sk-koputwketvnnikxxsrcfldtiebmgigjbcnliiskzsxyvuvui'; // 这是一个示例密钥，需要替换为您实际的SiliconFlow API密钥

// 获取API密钥，优先使用用户配置的密钥，如果没有则使用默认密钥
export function getApiKey() {
  if (!isClient) return DEFAULT_API_KEY;
  
  try {
    const settings = localStorage.getItem('chatSettings');
    const parsedSettings = settings ? JSON.parse(settings) : {};
    return parsedSettings.apiKey || DEFAULT_API_KEY;
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