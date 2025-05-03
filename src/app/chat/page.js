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
  text: '你好！我是小卡，擅长软件开发和算法设计。有什么技术问题我可以帮助你的吗？', 
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

// 防抖函数，用于减少函数调用频率
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export default function ChatPage() {
  const [sessions, setSessions] = useState([DEFAULT_SESSION]);
  const [currentSessionId, setCurrentSessionId] = useState(DEFAULT_SESSION.id);
  const [messages, setMessages] = useState(DEFAULT_SESSION.messages);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  const chatMessagesRef = useRef(null);
  
  // 防抖更新消息，避免频繁状态更新
  const debouncedSetMessages = useRef(
    debounce((newMessages) => {
      setMessages(newMessages);
    }, 100)
  ).current;
  
  // 主题
  const [currentTheme, setCurrentTheme] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  
  // 流式处理状态变量
  const rafId = useRef(null);
  const finalUpdateTimeout = useRef(null);
  
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
      
      // 确保主题色变化会触发更新
      const observeCSSVariableChanges = () => {
        if (typeof window === 'undefined' || !window.MutationObserver) return null;
        
        const targetNode = document.documentElement;
        const config = { attributes: true, attributeFilter: ['style'] };
        
        const callback = (mutations) => {
          for (const mutation of mutations) {
            if (mutation.attributeName === 'style') {
              // 当CSS变量变化时，获取新的主题色值并更新
              setPrimaryColor(getCurrentPrimaryColor());
            }
          }
        };
        
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
        
        return observer;
      };
      
      // 启动CSS变量监听
      const observer = observeCSSVariableChanges();
      
      return () => {
        window.removeEventListener('storage', handleThemeChange);
        window.removeEventListener('themeChange', handleThemeChange);
        if (observer) observer.disconnect();
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
        // 每次启动应用时，将温度重置为默认值0.5
        savedSettings.temperature = 0.5;
        // 始终将主题设置为默认蓝色主题
        savedSettings.theme = DEFAULT_THEME;
        setSettings(savedSettings);
        saveSettings(savedSettings);
      } else {
        // 首次使用时，设置默认值
        setSettings(DEFAULT_SETTINGS);
        saveSettings(DEFAULT_SETTINGS);
      }
      
      // 使用默认蓝色主题设置CSS变量
      const themeObj = AVAILABLE_THEMES.find(t => t.key === DEFAULT_THEME);
      if (themeObj && document.documentElement) {
        document.documentElement.style.setProperty('--primary-color', themeObj.primary);
        
        // 将十六进制颜色转换为RGB
        const hexToRgb = (hex) => {
          const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
          const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
          return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '24, 144, 255'; // 默认蓝色RGB
        };
        
        // 更新RGB变量
        const rgbValue = hexToRgb(themeObj.primary);
        document.documentElement.style.setProperty('--primary-color-rgb', rgbValue);
        
        console.log('页面初始化: 设置RGB颜色值', rgbValue);
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
    // 如果没有输入内容或者已经在typing状态，不发送
    if (!inputValue.trim() || isTyping) return;
    
    // 获取当前API密钥和模型设置
    const apiKey = settings.apiKey || '';
    const model = settings.model || 'deepseek-ai/DeepSeek-V2.5';
    const temperature = settings.temperature || 0.7;
    
    // 创建用户消息对象
    const userMessage = { text: inputValue, isSender: true };
    
    // 清空输入框
    setInputValue('');
    
    // 添加用户消息并添加一个空的AI消息作为占位符
    const newMessages = [...messages, userMessage, { text: '', isSender: false }];
    setMessages(newMessages);
    
    // 立即将用户消息添加到历史记录
    updateCurrentSession([...messages, userMessage]);
    
    // 确保聊天窗口滚动到底部
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 0);
    
    // 设置为typing状态
    setIsTyping(true);
    
    try {
      // 跟踪流式响应过程中的文本
      let currentText = '';
      let buffer = '';
      let lastUpdateTime = Date.now();
      
      // 调整批量大小，增强逐字输出效果
      const batchSize = 12;
      
      // 节流间隔 - 控制更新频率，平衡流畅性和性能
      const throttleInterval = 100;
      
      // 更新消息的函数
      const updateMessageWithText = (text) => {
        // 取消之前计划的任何更新
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
        
        // 使用requestAnimationFrame确保在浏览器绘制前进行更新
        rafId.current = requestAnimationFrame(() => {
          // 使用函数式更新确保状态更新正确
          setMessages(prev => {
            // 如果messages数组为空或长度不匹配预期，不做更新
            if (prev.length < 2) return prev;
            
            // 复制一份当前message列表
            const updated = [...prev];
            
            // 更新最后一条消息（AI回复）的文本内容
            updated[updated.length - 1] = { 
              text, 
              isSender: false 
            };
            
            return updated;
          });
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
          
          // 检查是否含有Markdown语法标记
          const hasMarkdown = /[#*`_~\[\](){}>!\-+\n]/.test(chunk);
          
          // 决定何时更新UI
          // 1. 常规更新: 缓冲区足够大或时间间隔足够长
          // 2. 特殊更新: 检测到Markdown语法时更及时更新
          const shouldUpdate = 
            buffer.length >= batchSize || 
            now - lastUpdateTime > throttleInterval ||
            (hasMarkdown && buffer.length > 3);
          
          if (shouldUpdate) {
            // 更新当前文本并清空缓冲区
            currentText += buffer;
            buffer = '';
            
            // 更新时间戳
            lastUpdateTime = now;
            
            // 使用 requestAnimationFrame 与浏览器渲染周期同步
            if (typeof window !== 'undefined') {
              cancelAnimationFrame(rafId.current);
              rafId.current = requestAnimationFrame(() => {
                updateMessageWithText(currentText);
              });
            } else {
              updateMessageWithText(currentText);
            }
          }
        },
        (fullResponse) => {
          // 完成响应，确保任何缓冲区中剩余的文本都被添加
          currentText += buffer;
          
          // 立即标记不再输入
          setIsTyping(false);
          
          // 确保最终文本是完整的
          const finalMessages = [...messages, userMessage, { text: fullResponse, isSender: false }];
          
          // 清除任何正在进行的动画帧
          if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
          }
          
          // 使用防抖函数确保流式响应完全停止后才更新UI
          clearTimeout(finalUpdateTimeout.current);
          finalUpdateTimeout.current = setTimeout(() => {
            // 使用双重缓冲区机制减少闪烁
            setMessages(prev => {
              // 确保最后一条消息内容与fullResponse完全匹配
              if (prev.length > 0 && !prev[prev.length - 1].isSender) {
                const updatedMessages = [...prev];
                updatedMessages[updatedMessages.length - 1] = { text: fullResponse, isSender: false };
                return updatedMessages;
              }
              return finalMessages;
            });
            
            // 使用requestAnimationFrame确保UI更新与浏览器渲染同步
            requestAnimationFrame(() => {
              // 保存会话
              updateCurrentSession(finalMessages);
              
              // 确保滚动到底部
              if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
              }
            });
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
  
  // 处理保存设置
  const handleSaveSettings = (newSettings) => {
    // 检查API密钥是否发生变化
    const apiKeyChanged = settings.apiKey !== newSettings.apiKey;
    
    // 获取用户选择的主题
    const currentTheme = newSettings.theme;
    
    // 保存用户选择的实际主题
    setSettings(newSettings);
    
    if (isClient) {
      // 保存设置到localStorage（包括用户选择的主题）
      saveSettings(newSettings);
      
      // 应用用户选择的主题颜色
      const themeObj = AVAILABLE_THEMES.find(t => t.key === currentTheme) || AVAILABLE_THEMES[0];
      
      if (themeObj) {
        // 设置CSS变量
        document.documentElement.style.setProperty('--primary-color', themeObj.primary);
        
        // 将十六进制颜色转换为RGB
        const hexToRgb = (hex) => {
          const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
          const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
          return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '24, 144, 255'; // 默认蓝色RGB
        };
        
        // 更新RGB变量
        const rgbValue = hexToRgb(themeObj.primary);
        document.documentElement.style.setProperty('--primary-color-rgb', rgbValue);
        
        // 创建一个临时样式表强制应用主题颜色
        const stylesheet = document.createElement('style');
        stylesheet.textContent = `
          :root {
            --primary-color: ${themeObj.primary} !important;
            --primary-color-rgb: ${rgbValue} !important;
          }
        `;
        document.head.appendChild(stylesheet);
        setTimeout(() => document.head.removeChild(stylesheet), 100);
        
        // 触发主题变化事件 - 确保所有组件都能接收到主题变化
        window.dispatchEvent(new CustomEvent('themeChange'));
      }
      
      // 触发头像更新事件，确保所有组件显示最新的头像
      window.dispatchEvent(new CustomEvent('avatarChange'));
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
  
  // 关闭设置面板
  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    
    // 移除触发头像更新事件的代码，仅在Settings组件中保存时触发
  };
  
  useEffect(() => {
    setIsClient(true);
    
    // 清理函数
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (finalUpdateTimeout.current) {
        clearTimeout(finalUpdateTimeout.current);
      }
    };
  }, []);

  return (
    <Layout className={`${styles.main} ${styles.buttonWrapper}`}>
      <Sider width={250} theme="light" className={`${styles.sidebar} ${styles.buttonWrapper}`}>
        <div className={styles.sidebarHeader}>
          <Title level={4}>聊天会话</Title>
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={createNewSession}
            className={styles.themeColorButton}
          >
            新会话
          </Button>
        </div>
        <List
          className={styles.sessionList}
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              className={`${styles.sessionItem} ${session.id === currentSessionId ? `${styles.active} ${styles.activeSessionItem}` : ''}`}
              onClick={() => switchSession(session.id)}
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
                    className={`${styles.sessionAction} ${session.id === currentSessionId ? styles.activeIcon : ''}`}
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
        <Content className={`${styles.chatContainer} ${styles.buttonWrapper}`}>
          <div className={styles.messagesContainer} ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                isTyping={isTyping && index === messages.length - 1}
              />
            ))}
          </div>
          <div className={`${styles.inputContainer} ${styles.buttonWrapper} chat-input-fixed`}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className={styles.messageTextArea}
              variant="outlined"
              style={{ 
                borderColor: '#d9d9d9',
                borderRadius: '4px',
                resize: 'none'
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className={inputValue.trim() ? styles.sendThemeButton : styles.sendThemeButtonDisabled}
            >
              发送
            </Button>
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsOpen(true)}
              className={styles.themeColorButton}
            >
              设置
            </Button>
          </div>
        </Content>
      </Layout>
      <Drawer
        title="设置"
        placement="right"
        onClose={handleCloseSettings}
        open={isSettingsOpen}
        width={400}
      >
        <Settings
          visible={isSettingsOpen}
          settings={settings}
          onSave={handleSaveSettings}
          onClose={handleCloseSettings}
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