'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import Settings from '../components/Settings';
import ChatMessage from '../components/ChatMessage';
import ClientOnly from '../components/ClientOnly';
import ApiKeyInfo from '../components/ApiKeyInfo';
import EnvTest from '../components/EnvTest';
import { streamMessage } from '../api/siliconflow';
import { saveSettings, loadSettings, saveHistory, loadHistory, isClient, DEFAULT_API_KEY, getApiKey } from '../utils/storage';

// 默认欢迎消息
const DEFAULT_WELCOME_MESSAGE = { 
  text: '你好！我是SiliconFlow AI助手。有什么我可以帮助你的吗？', 
  isSender: false 
};

// 默认设置
const DEFAULT_SETTINGS = {
  apiKey: DEFAULT_API_KEY, // 使用预设的API密钥
  model: 'deepseek-ai/DeepSeek-V2.5',
  temperature: 0.7
};

// 获取用户友好的错误消息
function getFriendlyErrorMessage(error) {
  const errorMsg = error.toString().toLowerCase();
  
  // API密钥错误
  if (errorMsg.includes('401') || errorMsg.includes('api key') || errorMsg.includes('无效') || errorMsg.includes('过期')) {
    return {
      message: '您的API密钥无效或已过期。请在设置中重新输入正确的SiliconFlow API密钥。',
      shouldOpenSettings: true
    };
  } 
  // 网络连接错误
  else if (errorMsg.includes('connection error') || errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
    return {
      message: '网络连接错误。请检查您的网络连接或SiliconFlow服务是否可用。建议稍后再试。',
      shouldOpenSettings: false
    };
  } 
  // 请求限制错误
  else if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('too many requests') || errorMsg.includes('频繁')) {
    return {
      message: 'API请求过于频繁，请稍后再试。',
      shouldOpenSettings: false
    };
  } 
  // 模型错误
  else if (errorMsg.includes('model')) {
    return {
      message: '所选模型暂时不可用或不存在，请在设置中选择其他模型。',
      shouldOpenSettings: true
    };
  }
  
  // 默认错误
  return {
    message: `出现错误: ${error}。请检查设置或稍后重试。`,
    shouldOpenSettings: false
  };
}

export default function ChatPage() {
  // 使用固定的初始状态，避免服务端/客户端渲染不一致
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inputText, setInputText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const chatMessagesRef = useRef(null);
  
  // 初始化加载设置和历史消息 - 仅在客户端执行
  useEffect(() => {
    if (isClient) {
      const savedSettings = loadSettings();
      if (Object.keys(savedSettings).length > 0) {
        // 确保有API密钥，如果没有则使用默认值
        if (!savedSettings.apiKey) {
          savedSettings.apiKey = DEFAULT_API_KEY;
          saveSettings(savedSettings);
        }
        setSettings(savedSettings);
      } else {
        // 如果没有保存的设置，使用默认设置（包含预设API密钥）
        saveSettings(DEFAULT_SETTINGS);
      }
      
      const savedHistory = loadHistory();
      if (savedHistory.length > 0) {
        setMessages(savedHistory);
      }
      
      setIsLoaded(true);
    }
  }, []);
  
  // 保存消息历史到localStorage - 仅在客户端执行且初始加载完成后
  useEffect(() => {
    if (isClient && isLoaded && messages.length > 0) {
      saveHistory(messages);
    }
  }, [messages, isLoaded]);
  
  // 滚动到聊天窗口底部
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  
  // 发送消息到SiliconFlow API
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    // 清除之前的错误
    setError('');
    
    // 获取当前API密钥（优先使用用户设置的，没有则使用默认值）
    const apiKey = getApiKey();
    
    // 添加用户消息
    const userMessage = { text: inputText, isSender: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 创建临时AI回应消息用于显示"正在输入"状态
    const tempAiMessage = { text: '', isSender: false };
    setMessages(prev => [...prev, tempAiMessage]);
    setIsTyping(true);
    
    try {
      let aiReply = '';
      
      // 使用流式API获取响应
      await streamMessage(
        apiKey,
        [...messages, userMessage], // 包含历史消息和当前用户消息
        (chunk) => {
          // 收到流式响应的一个片段
          aiReply += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...tempAiMessage, text: aiReply };
            return updated;
          });
        },
        (fullResponse) => {
          // 完成响应
          setIsTyping(false);
        },
        (error) => {
          // 出错
          console.error('API调用出错:', error);
          const { message, shouldOpenSettings } = getFriendlyErrorMessage(error);
          setError(message);
          
          // 如果需要，自动打开设置面板
          if (shouldOpenSettings) {
            setIsSettingsOpen(true);
          }
          
          setIsTyping(false);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...tempAiMessage, text: '抱歉，我遇到了一些问题。' + message };
            return updated;
          });
        },
        settings.model
      );
    } catch (error) {
      console.error('发送消息时出错:', error);
      const { message, shouldOpenSettings } = getFriendlyErrorMessage(error);
      setError(message);
      
      // 如果需要，自动打开设置面板
      if (shouldOpenSettings) {
        setIsSettingsOpen(true);
      }
      
      setIsTyping(false);
    }
  };
  
  // 处理键盘按下事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 阻止默认行为（添加换行）
      sendMessage();
    }
  };
  
  // 保存设置
  const handleSaveSettings = (newSettings) => {
    // 检查API密钥是否发生变化
    const apiKeyChanged = settings.apiKey !== newSettings.apiKey;
    
    setSettings(newSettings);
    if (isClient) {
      saveSettings(newSettings);
    }
    setError(''); // 清除错误消息
    
    // 如果API密钥已更改，且之前有错误，显示鼓励消息
    if (apiKeyChanged && error && error.includes('API密钥')) {
      const encourageMessage = { 
        text: 'API密钥已更新。您现在可以开始聊天了！', 
        isSender: false 
      };
      setMessages(prev => [...prev, encourageMessage]);
    }
  };
  
  // 清空聊天 - 使用客户端确认
  const clearChat = () => {
    const clearChatHistory = () => {
      const welcomeMessage = { text: '聊天已清空。有什么我可以帮助你的吗？', isSender: false };
      setMessages([welcomeMessage]);
      if (isClient) {
        saveHistory([welcomeMessage]);
      }
    };
    
    // 只在客户端执行确认对话框
    if (isClient) {
      if (window.confirm('确定要清空聊天记录吗？')) {
        clearChatHistory();
      }
    }
  };
  
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatTitle}>SiliconFlow AI助手</div>
        <div className={styles.chatControls}>
          <ClientOnly>
            <button 
              className={styles.controlButton} 
              onClick={clearChat}
              title="清空聊天"
            >
              🗑️
            </button>
          </ClientOnly>
          <button 
            className={styles.controlButton} 
            onClick={() => setIsSettingsOpen(true)}
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      <div className={styles.chatMessages} ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message}
            isTyping={isTyping && index === messages.length - 1}
          />
        ))}
        
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
      
      <div className={styles.inputArea}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          className={styles.messageInput}
          placeholder="输入消息..."
          rows={1}
          autoFocus
        />
        <button 
          className={styles.sendButton}
          onClick={sendMessage}
          disabled={isTyping}
        >
          {isTyping ? '发送中...' : '发送'}
        </button>
      </div>
      
      <ClientOnly>
        <Settings 
          visible={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          settings={settings}
          onSave={handleSaveSettings}
        />
      </ClientOnly>
      
      <ClientOnly>
        <ApiKeyInfo />
      </ClientOnly>
      
      {process.env.NODE_ENV === 'development' && (
        <ClientOnly>
          <EnvTest />
        </ClientOnly>
      )}
    </div>
  );
} 