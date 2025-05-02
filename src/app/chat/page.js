'use client';

import { useEffect, useState, useRef } from 'react';
import { Layout, Input, Button, Drawer, List, Typography, Space, Tooltip, Modal } from 'antd';
import { SendOutlined, SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ChatMessage from '../components/ChatMessage';
import Settings from '../components/Settings';
import styles from './page.module.css';
import { saveSettings, loadSettings, saveHistory, loadHistory, isClient, DEFAULT_API_KEY, getApiKey, saveSessions, loadSessions, getTheme, getThemeColor, DEFAULT_THEME, AVAILABLE_THEMES } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { streamMessage } from '../api/siliconflow.js';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

// 默认欢迎消息
const DEFAULT_WELCOME_MESSAGE = { 
  text: '【IT专家】\n你好！我是卡皮巴拉IT专家，擅长软件开发和算法设计。有什么技术问题我可以帮助你的吗？\n\n【计算机教授点评】\n欢迎你！作为计算机学科的教授，我也会对IT专家的回答进行点评和补充，从学术和教育角度提供更深入的见解。请随时提问！', 
  isSender: false
};

// 默认设置
const DEFAULT_SETTINGS = {
  apiKey: DEFAULT_API_KEY, // 使用预设的API密钥
  model: 'deepseek-ai/DeepSeek-V2.5',
  temperature: 0.5,  // 设置为平衡值0.5
  themeColor: 'blue'
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
  
  // 主题
  const [currentTheme, setCurrentTheme] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  
  // 监听主题变化
  useEffect(() => {
    if (isClient) {
      // 初始设置主题颜色
      const theme = getTheme();
      setCurrentTheme(theme);
      
      // 从CSS变量获取主题颜色，确保使用最新的颜色设置
      const getCurrentPrimaryColor = () => {
        const root = document.documentElement;
        const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
        return primaryColor || getThemeColor(theme);
      };
      
      setPrimaryColor(getCurrentPrimaryColor());
      
      const handleThemeChange = () => {
        const newTheme = getTheme();
        setCurrentTheme(newTheme);
        // 使用CSS变量中的颜色，确保颜色变化即时反映
        setPrimaryColor(getCurrentPrimaryColor());
      };
      
      window.addEventListener('storage', handleThemeChange);
      window.addEventListener('themeChange', handleThemeChange);
      
      return () => {
        window.removeEventListener('storage', handleThemeChange);
        window.removeEventListener('themeChange', handleThemeChange);
      };
    }
  }, []);

  // 初始化加载设置和历史消息 - 仅在客户端执行
  useEffect(() => {
    if (isClient) {
      const savedSettings = loadSettings();
      
      if (Object.keys(savedSettings).length > 0) {
        // 如果已有保存的设置，只在API密钥为空时设置默认值
        if (!savedSettings.apiKey) {
          savedSettings.apiKey = DEFAULT_API_KEY;
        }
        // 强制使用蓝色主题作为默认值
        savedSettings.theme = DEFAULT_THEME;
        setSettings(savedSettings);
        saveSettings(savedSettings);
      } else {
        // 首次使用时，设置默认值
        setSettings(DEFAULT_SETTINGS);
        saveSettings(DEFAULT_SETTINGS);
      }
      
      // 强制使用蓝色主题设置CSS变量
      const themeObj = AVAILABLE_THEMES.find(t => t.key === DEFAULT_THEME);
      if (themeObj && document.documentElement) {
        document.documentElement.style.setProperty('--primary-color', themeObj.primary);
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

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = { text: inputText.trim(), isSender: true };
    const aiMessage = { text: '', isSender: false };
    
    // 清空输入框
    setInputText('');
    
    // 添加用户消息到聊天
    const newMessages = [...messages, userMessage, aiMessage];
    setMessages(newMessages);
    updateCurrentSession(newMessages.slice(0, -1)); // 不要立即保存空的AI消息
    
    // 设置正在输入状态
    setIsTyping(true);
    
    try {
      // 用户可能在设置中自定义了API密钥和模型，从设置中获取
      const { apiKey, model, temperature } = settings;
      
      // 流式响应的当前文本
      let currentText = '';
      // 缓冲区和上次更新时间戳，用于节流更新
      let buffer = '';
      let lastUpdateTime = Date.now();
      // 优化更新间隔 - 增加到150ms以减轻渲染负担
      const throttleInterval = 150;
      // 批量更新大小 - 增加文本缓冲阈值
      const batchSize = 25;
      // 用于取消requestAnimationFrame的ID
      let rafId = null;
      
      // 更新消息的函数 - 使用requestAnimationFrame优化
      const updateMessageWithText = (text) => {
        // 取消之前计划的任何更新
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        // 使用requestAnimationFrame确保在下一帧渲染
        rafId = requestAnimationFrame(() => {
          setMessages(prev => {
            // 创建消息数组的副本
            const updated = [...prev];
            // 找到最后一条AI消息并更新其文本
            const lastAiMsgIndex = updated.length - 1;
            if (lastAiMsgIndex >= 0 && !updated[lastAiMsgIndex].isSender) {
              updated[lastAiMsgIndex] = {
                ...updated[lastAiMsgIndex],
                text: text
              };
            }
            return updated;
          });
          
          // 滚动到底部的逻辑
          if (chatMessagesRef.current) {
            // 检查是否在底部
            const isScrolledToBottom = 
              chatMessagesRef.current.scrollHeight - chatMessagesRef.current.clientHeight <= 
              chatMessagesRef.current.scrollTop + 50;
              
            // 只有当用户在底部时才自动滚动
            if (isScrolledToBottom) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
          }
        });
      };
      
      // 调用流式API
      await streamMessage(
        apiKey,
        newMessages.slice(0, -1), // 只发送用户消息，不包括空的AI消息
        (chunk) => {
          // 累加文本到缓冲区
          buffer += chunk;
          
          // 当前时间
          const now = Date.now();
          
          // 如果积累了足够的文本或者距离上次更新已经超过节流间隔，则更新界面
          if (buffer.length > batchSize || now - lastUpdateTime > throttleInterval) {
            // 更新当前文本并清空缓冲区
            currentText += buffer;
            buffer = '';
            
            // 更新时间戳
            lastUpdateTime = now;
            
            // 更新UI
            updateMessageWithText(currentText);
          }
        },
        (fullResponse) => {
          // 完成响应，确保任何缓冲区中剩余的文本都被添加
          currentText += buffer;
          setIsTyping(false);
          
          // 确保最终文本是完整的
          const finalMessages = [...messages, userMessage, { text: fullResponse, isSender: false }];
          
          // 清除任何正在进行的动画帧
          if (rafId) {
            cancelAnimationFrame(rafId);
          }
          
          // 使用setTimeout延迟最终更新以避免与流式更新冲突
          setTimeout(() => {
            setMessages(finalMessages);
            updateCurrentSession(finalMessages);
            
            // 最后一次滚动到底部
            if (chatMessagesRef.current) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
          }, 100);
        },
        (error) => {
          // 处理错误
          console.error('API调用出错:', error);
          const { message, shouldOpenSettings } = getFriendlyErrorMessage(error);
          setError(message);
          
          // 如果需要，自动打开设置面板
          if (shouldOpenSettings) {
            setIsSettingsOpen(true);
          }
          
          setIsTyping(false);
          
          // 更新为错误消息
          const errorMessages = [...messages, userMessage, { 
            text: '抱歉，我遇到了一些问题。' + message, 
            isSender: false 
          }];
          setMessages(errorMessages);
          updateCurrentSession(errorMessages);
        },
        model,
        temperature
      );
    } catch (error) {
      console.error('发送消息时出错:', error);
      const { message, shouldOpenSettings } = getFriendlyErrorMessage(error);
      setError(message);
      
      if (shouldOpenSettings) {
        setIsSettingsOpen(true);
      }
      
      setIsTyping(false);
      
      // 更新为错误消息
      const errorMessages = [...messages, userMessage, { 
        text: '抱歉，我遇到了一些问题。' + message, 
        isSender: false 
      }];
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
    
    // 允许用户在当前会话中应用新主题，但实际保存到存储中的仍是默认蓝色主题
    const currentTheme = newSettings.theme;
    
    // 为保存到存储中的设置强制使用蓝色主题
    const savedSettings = {
      ...newSettings,
      theme: DEFAULT_THEME // 实际存储的主题始终为蓝色
    };
    
    // 状态中使用用户选择的临时主题
    newSettings.theme = currentTheme;
    setSettings(newSettings);
    
    if (isClient) {
      // 保存设置到localStorage (实际存储的主题始终为蓝色)
      saveSettings(savedSettings);
      
      // 应用用户选择的临时主题颜色
      const themeObj = AVAILABLE_THEMES.find(t => t.key === currentTheme) || AVAILABLE_THEMES[0];
      
      if (themeObj) {
        // 设置CSS变量
        document.documentElement.style.setProperty('--primary-color', themeObj.primary);
        
        // 创建一个临时样式表强制应用主题颜色
        const stylesheet = document.createElement('style');
        stylesheet.textContent = `
          :root {
            --primary-color: ${themeObj.primary} !important;
          }
        `;
        document.head.appendChild(stylesheet);
        setTimeout(() => document.head.removeChild(stylesheet), 100);
      }
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
    
    // 关闭设置面板
    setIsSettingsOpen(false);
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
    <Layout className={styles.main}>
      <Sider width={250} theme="light" className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Title level={4}>聊天会话</Title>
          <Button
            icon={<PlusOutlined />}
            onClick={createNewSession}
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            新会话
          </Button>
        </div>
        <List
          className={styles.sessionList}
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              className={`${styles.sessionItem} ${session.id === currentSessionId ? styles.active : ''}`}
              onClick={() => switchSession(session.id)}
              style={session.id === currentSessionId ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
            >
              <div className={styles.sessionTitle}>
                {editingSessionId === session.id ? (
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleTitleEditComplete}
                    autoFocus
                  />
                ) : (
                  <span>{session.title}</span>
                )}
              </div>
              <div className={styles.sessionActions}>
                <Tooltip title="编辑">
                  <EditOutlined
                    className={styles.sessionAction}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(session);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <DeleteOutlined
                    className={`${styles.sessionAction} ${styles.delete}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  />
                </Tooltip>
              </div>
            </List.Item>
          )}
        />
      </Sider>
      <Layout>
        <Content className={styles.chatContainer}>
          <div className={styles.messagesContainer} ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                isTyping={isTyping && index === messages.length - 1}
              />
            ))}
          </div>
          <div className={styles.inputContainer}>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={!inputText.trim()}
              style={{ 
                backgroundColor: inputText.trim() ? primaryColor : `${primaryColor}50`, 
                borderColor: inputText.trim() ? primaryColor : `${primaryColor}50`,
                color: 'white',
                opacity: inputText.trim() ? 1 : 0.7
              }}
            >
              发送
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsOpen(true)}
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              设置
            </Button>
          </div>
        </Content>
      </Layout>
      <Drawer
        title="设置"
        placement="right"
        onClose={() => setIsSettingsOpen(false)}
        open={isSettingsOpen}
        width={400}
      >
        <Settings
          visible={isSettingsOpen}
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      </Drawer>
      {error && (
        <Modal
          title="错误"
          open={!!error}
          onOk={() => setError('')}
          onCancel={() => setError('')}
        >
          <p>{error}</p>
        </Modal>
      )}
    </Layout>
  );
} 