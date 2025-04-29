'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, Drawer, List, Typography, Space, Tooltip, Modal } from 'antd';
import { SendOutlined, SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './page.module.css';
import Settings from '../components/Settings';
import ChatMessage from '../components/ChatMessage';
import ClientOnly from '../components/ClientOnly';
import ApiKeyInfo from '../components/ApiKeyInfo';
import EnvTest from '../components/EnvTest';
import { streamMessage } from '../api/siliconflow';
import { saveSettings, loadSettings, saveHistory, loadHistory, isClient, DEFAULT_API_KEY, getApiKey, saveSessions, loadSessions } from '../utils/storage';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

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
    <Layout className={styles.main}>
      <Sider width={250} theme="light" className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Title level={4}>聊天会话</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewSession}
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
            >
              发送
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsOpen(true)}
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