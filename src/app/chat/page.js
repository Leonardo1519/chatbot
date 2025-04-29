'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import Settings from '../components/Settings';
import ChatMessage from '../components/ChatMessage';
import ClientOnly from '../components/ClientOnly';
import ApiKeyInfo from '../components/ApiKeyInfo';
import EnvTest from '../components/EnvTest';
import { streamMessage } from '../api/siliconflow';
import { saveSettings, loadSettings, saveHistory, loadHistory, isClient, DEFAULT_API_KEY, getApiKey, saveSessions, loadSessions } from '../utils/storage';

// 默认欢迎消息
const DEFAULT_WELCOME_MESSAGE = { 
  text: '你好！我是卡皮巴拉IT专家。有什么我可以帮助你的吗？', 
  isSender: false,
  role: 'it_expert'
};

// 默认设置
const DEFAULT_SETTINGS = {
  apiKey: DEFAULT_API_KEY, // 使用预设的API密钥
  model: 'deepseek-ai/DeepSeek-V2.5',
  temperature: 0.7
};

// 聊天会话结构
const DEFAULT_SESSION = {
  id: Date.now(),
  title: '新会话',
  messages: [DEFAULT_WELCOME_MESSAGE],
  createdAt: new Date().toISOString()
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
  const [sessions, setSessions] = useState([DEFAULT_SESSION]);
  const [currentSessionId, setCurrentSessionId] = useState(DEFAULT_SESSION.id);
  const [messages, setMessages] = useState(DEFAULT_SESSION.messages);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inputText, setInputText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const chatMessagesRef = useRef(null);
  
  // 初始化加载设置和历史消息 - 仅在客户端执行
  useEffect(() => {
    if (isClient) {
      const savedSettings = loadSettings();
      if (Object.keys(savedSettings).length > 0) {
        if (!savedSettings.apiKey) {
          savedSettings.apiKey = DEFAULT_API_KEY;
          saveSettings(savedSettings);
        }
        setSettings(savedSettings);
      } else {
        saveSettings(DEFAULT_SETTINGS);
      }
      
      const savedSessions = loadSessions();
      if (savedSessions.length > 0) {
        setSessions(savedSessions);
        setCurrentSessionId(savedSessions[0].id);
        setMessages(savedSessions[0].messages);
      }
      
      setIsLoaded(true);
    }
  }, []);

  // 保存会话到localStorage
  useEffect(() => {
    if (isClient && isLoaded && sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions, isLoaded]);

  // 创建新会话
  const createNewSession = () => {
    const newSession = {
      ...DEFAULT_SESSION,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
  };

  // 切换会话
  const switchSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  // 更新当前会话的消息
  const updateCurrentSession = (newMessages) => {
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: newMessages }
        : session
    ));
  };

  // 重命名会话
  const renameSession = (sessionId, newTitle) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: newTitle }
        : session
    ));
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // 删除会话
  const deleteSession = (sessionId) => {
    if (window.confirm('确定要删除这个会话吗？')) {
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      // 如果删除的是当前会话，切换到第一个会话
      if (sessionId === currentSessionId && newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
        setMessages(newSessions[0].messages);
      } else if (newSessions.length === 0) {
        // 如果没有会话了，创建一个新的
        createNewSession();
      }
    }
  };

  // 开始编辑会话标题
  const startEditing = (session) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // 处理标题编辑完成
  const handleTitleEditComplete = (e) => {
    if (e.key === 'Enter') {
      renameSession(editingSessionId, editingTitle);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  // 发送消息到SiliconFlow API
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    // 清除之前的错误
    setError('');
    
    // 获取当前API密钥（优先使用用户设置的，没有则使用默认值）
    const apiKey = getApiKey();
    
    // 添加用户消息
    const userMessage = { text: inputText, isSender: true };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateCurrentSession(newMessages);
    setInputText('');
    
    // 创建临时AI回应消息用于显示"正在输入"状态
    const tempAiMessage = { text: '', isSender: false, role: 'it_expert' };
    setMessages(prev => [...prev, tempAiMessage]);
    setIsTyping(true);
    
    try {
      let aiReply = '';
      
      // 使用流式API获取IT专家的响应
      await streamMessage(
        apiKey,
        newMessages,
        (chunk) => {
          // 收到流式响应的一个片段
          aiReply += chunk;
          const updatedMessages = [...newMessages, { ...tempAiMessage, text: aiReply }];
          setMessages(updatedMessages);
          updateCurrentSession(updatedMessages);
        },
        async (fullResponse) => {
          // IT专家回复完成后，让计算机教授点评
          const professorMessage = { text: '', isSender: false, role: 'professor' };
          setMessages(prev => [...prev, professorMessage]);
          
          // 构建教授点评的提示词
          const professorPrompt = `作为一位计算机教授，请对以下IT专家的回答进行专业点评：\n\n${fullResponse}`;
          
          // 获取教授的点评
          let professorReply = '';
          await streamMessage(
            apiKey,
            [...newMessages, { ...tempAiMessage, text: fullResponse }, { text: professorPrompt, isSender: true }],
            (chunk) => {
              professorReply += chunk;
              const updatedMessages = [...newMessages, 
                { ...tempAiMessage, text: fullResponse },
                { ...professorMessage, text: professorReply }
              ];
              setMessages(updatedMessages);
              updateCurrentSession(updatedMessages);
            },
            () => {
              setIsTyping(false);
            },
            (error) => {
              console.error('教授点评出错:', error);
              const { message } = getFriendlyErrorMessage(error);
              setError(message);
              setIsTyping(false);
            }
          );
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
          const errorMessages = [...newMessages, { ...tempAiMessage, text: '抱歉，我遇到了一些问题。' + message }];
          setMessages(errorMessages);
          updateCurrentSession(errorMessages);
        }
      );
    } catch (error) {
      console.error('发送消息时出错:', error);
      const { message, shouldOpenSettings } = getFriendlyErrorMessage(error);
      setError(message);
      
      if (shouldOpenSettings) {
        setIsSettingsOpen(true);
      }
      
      setIsTyping(false);
      const errorMessages = [...newMessages, { ...tempAiMessage, text: '抱歉，我遇到了一些问题。' + message }];
      setMessages(errorMessages);
      updateCurrentSession(errorMessages);
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
        <div className={styles.chatTitle}>卡皮巴拉IT专家</div>
        <div className={styles.chatControls}>
          <ClientOnly>
            <button 
              className={styles.controlButton} 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              title="聊天历史"
            >
              📚
            </button>
            <button 
              className={styles.controlButton} 
              onClick={createNewSession}
              title="新建会话"
            >
              ➕
            </button>
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
      
      <div className={styles.mainContent}>
        {isHistoryOpen && (
          <div className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h3>聊天历史</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsHistoryOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.historyList}>
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`${styles.historyItem} ${session.id === currentSessionId ? styles.active : ''}`}
                >
                  <div className={styles.historyItemContent}>
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleTitleEditComplete}
                        onBlur={() => renameSession(session.id, editingTitle)}
                        className={styles.titleInput}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className={styles.historyTitle}
                        onClick={() => switchSession(session.id)}
                      >
                        {session.title}
                      </div>
                    )}
                    <div className={styles.historyDate}>
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.historyItemActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => startEditing(session)}
                      title="重命名"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => deleteSession(session.id)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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