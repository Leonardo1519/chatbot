import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import styles from './ChatMessage.module.css';
import { loadUserAvatar } from '../utils/storage';

const { Text, Paragraph } = Typography;

export default function ChatMessage({ message, isTyping }) {
  const [userAvatar, setUserAvatar] = useState(null);
  
  // 加载用户头像
  useEffect(() => {
    const savedAvatar = loadUserAvatar();
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }
  }, []);
  
  const getAvatar = () => {
    if (message.isSender) {
      return userAvatar 
        ? <Avatar src={userAvatar} size={40} /> 
        : <Avatar icon={<UserOutlined />} size={40} />;
    }
    if (message.role === 'professor') {
      return (
        <Avatar
          src="/avatars/Capybara-2.jpg"
          alt="计算机教授"
          size={40}
        />
      );
    }
    return (
      <Avatar
        src="/avatars/Capybara-1.jpg"
        alt="IT专家"
        size={40}
      />
    );
  };

  const getRoleLabel = () => {
    if (message.isSender) return '用户';
    if (message.role === 'professor') return '计算机教授';
    return 'IT专家';
  };

  return (
    <div className={`${styles.messageContainer} ${message.isSender ? styles.senderContainer : styles.receiverContainer}`}>
      <div className={styles.avatarContainer}>
        {getAvatar()}
        <Text type="secondary" className={styles.roleLabel}>{getRoleLabel()}</Text>
      </div>
      <Card
        className={`${styles.message} ${message.isSender ? styles.sender : styles.receiver}`}
        size="small"
        variant="borderless"
      >
        <div className={styles.messageContent}>
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <Paragraph className={styles.paragraph}>{children}</Paragraph>
              ),
              h1: ({ children }) => (
                <Typography.Title level={5} className={styles.heading}>{children}</Typography.Title>
              ),
              h2: ({ children }) => (
                <Typography.Title level={5} className={styles.heading}>{children}</Typography.Title>
              ),
              h3: ({ children }) => (
                <Typography.Title level={5} className={styles.heading}>{children}</Typography.Title>
              ),
              h4: ({ children }) => (
                <Typography.Title level={5} className={styles.heading}>{children}</Typography.Title>
              ),
              h5: ({ children }) => (
                <Typography.Title level={5} className={styles.heading}>{children}</Typography.Title>
              ),
              h6: ({ children }) => (
                <Typography.Title level={5} className={styles.heading}>{children}</Typography.Title>
              ),
              ul: ({ children }) => (
                <ul className={styles.list}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className={styles.list}>{children}</ol>
              ),
              li: ({ children }) => (
                <li className={styles.listItem}>{children}</li>
              ),
              code: ({ children }) => (
                <Text code className={styles.code}>{children}</Text>
              ),
              pre: ({ children }) => (
                <pre className={styles.pre}>{children}</pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className={styles.blockquote}>{children}</blockquote>
              ),
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        {isTyping && (
          <span className={styles.typingIndicator}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </span>
        )}
      </Card>
    </div>
  );
} 