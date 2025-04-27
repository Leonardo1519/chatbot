'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { text: '你好！欢迎使用聊天界面。', isSender: false }
  ]);
  const [inputText, setInputText] = useState('');
  const chatMessagesRef = useRef(null);
  
  // 模拟自动回复
  const autoReplies = [
    "你好！",
    "很高兴和你聊天！",
    "今天天气怎么样？",
    "这是一个简单的聊天界面演示。",
    "有什么我可以帮助你的吗？",
    "请继续说...",
    "理解了！",
    "这个问题很有趣。",
    "需要更多信息吗？"
  ];
  
  // 滚动到聊天窗口底部
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 获取随机回复
  const getRandomReply = () => {
    const randomIndex = Math.floor(Math.random() * autoReplies.length);
    return autoReplies[randomIndex];
  };
  
  // 发送消息
  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    // 添加用户消息
    setMessages([...messages, { text: inputText, isSender: true }]);
    setInputText('');
    
    // 模拟回复延迟
    setTimeout(() => {
      const reply = getRandomReply();
      setMessages(currentMessages => [...currentMessages, { text: reply, isSender: false }]);
    }, 1000);
  };
  
  // 处理键盘按下事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>聊天室</div>
      <div className={styles.chatMessages} ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${message.isSender ? styles.sender : styles.receiver}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className={styles.inputArea}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.messageInput}
          placeholder="输入消息..."
          autoFocus
        />
        <button 
          className={styles.sendButton}
          onClick={sendMessage}
        >
          发送
        </button>
      </div>
    </div>
  );
} 