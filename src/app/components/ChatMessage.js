import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState, memo } from 'react';
import styles from './ChatMessage.module.css';
import { loadUserAvatar } from '../utils/storage';
import ClientOnly from './ClientOnly';

const { Text, Paragraph } = Typography;

// 使用memo优化MarkdownContent组件，只有当content变化时才重新渲染
const MarkdownContent = memo(({ content }) => (
  <ClientOnly>
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <Paragraph className={styles.paragraph}>
            {children}
          </Paragraph>
        ),
        h1: ({ children }) => (
          <Typography.Title level={5} className={styles.heading}>
            {children}
          </Typography.Title>
        ),
        h2: ({ children }) => (
          <Typography.Title level={5} className={styles.heading}>
            {children}
          </Typography.Title>
        ),
        h3: ({ children }) => (
          <Typography.Title level={5} className={styles.heading}>
            {children}
          </Typography.Title>
        ),
        h4: ({ children }) => (
          <Typography.Title level={5} className={styles.heading}>
            {children}
          </Typography.Title>
        ),
        h5: ({ children }) => (
          <Typography.Title level={5} className={styles.heading}>
            {children}
          </Typography.Title>
        ),
        h6: ({ children }) => (
          <Typography.Title level={5} className={styles.heading}>
            {children}
          </Typography.Title>
        ),
        ul: ({ children }) => (
          <ul className={styles.list}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className={styles.list}>{children}</ol>
        ),
        li: ({ children }) => (
          <li className={styles.listItem}>
            {children}
          </li>
        ),
        code: ({ children }) => (
          <Text code className={styles.code}>
            {children}
          </Text>
        ),
        pre: ({ children }) => (
          <pre className={styles.pre}>
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className={styles.blockquote}>
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </ClientOnly>
));

// 添加displayName以方便调试
MarkdownContent.displayName = 'MarkdownContent';

export default function ChatMessage({ message, isTyping }) {
  const [userAvatar, setUserAvatar] = useState(null);
  const [expertContent, setExpertContent] = useState('');
  const [professorContent, setProfessorContent] = useState('');
  
  // 加载用户头像
  useEffect(() => {
    const savedAvatar = loadUserAvatar();
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }
  }, []);
  
  // 当消息内容变化时，处理分割IT专家和教授的回复
  useEffect(() => {
    if (!message.isSender && message.text) {
      const parts = message.text.split('【计算机教授点评】');
      if (parts.length > 1) {
        // 删除IT专家标签
        const expertPart = parts[0].replace('【IT专家】', '').trim();
        setExpertContent(expertPart);
        setProfessorContent(parts[1].trim());
      } else {
        // 如果没有找到分隔符，就把全部内容都设为IT专家的
        setExpertContent(message.text.replace('【IT专家】', '').trim());
        setProfessorContent('');
      }
    }
  }, [message.text, message.isSender]);
  
  const getAvatar = (role) => {
    if (message.isSender) {
      return userAvatar 
        ? <Avatar src={userAvatar} size={40} /> 
        : <Avatar icon={<UserOutlined />} size={40} />;
    }
    if (role === 'professor') {
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

  const getRoleLabel = (role) => {
    if (message.isSender) return '用户';
    if (role === 'professor') return '计算机教授';
    return 'IT专家';
  };

  // 如果是用户消息，直接显示
  if (message.isSender) {
    return (
      <div className={`${styles.messageContainer} ${styles.senderContainer}`}>
        <div className={styles.avatarContainer}>
          {getAvatar()}
          <Text 
            type="secondary" 
            className={styles.roleLabel}
          >
            {getRoleLabel()}
          </Text>
        </div>
        <div className={`${styles.message} ${styles.sender}`}>
          <div className={`${styles.messageContent}`}>
            <MarkdownContent content={message.text} />
          </div>
        </div>
      </div>
    );
  }
  
  // 如果是AI回复，显示IT专家和教授的回复（如果有）
  return (
    <>
      {/* IT专家回复 */}
      <div className={`${styles.messageContainer} ${styles.receiverContainer}`}>
        <div className={styles.avatarContainer}>
          {getAvatar('expert')}
          <Text 
            type="secondary" 
            className={styles.roleLabel}
          >
            {getRoleLabel('expert')}
          </Text>
        </div>
        <div className={`${styles.message} ${styles.receiver}`}>
          <div className={`${styles.messageContent}`}>
            <MarkdownContent content={expertContent} />
          </div>
          {isTyping && (
            <span className={styles.typingIndicator}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </span>
          )}
        </div>
      </div>
      
      {/* 如果有教授点评，则显示 */}
      {professorContent && (
        <div className={`${styles.messageContainer} ${styles.receiverContainer}`}>
          <div className={styles.avatarContainer}>
            {getAvatar('professor')}
            <Text 
              type="secondary" 
              className={styles.roleLabel}
            >
              {getRoleLabel('professor')}
            </Text>
          </div>
          <div className={`${styles.message} ${styles.professorMessage}`}>
            <div className={`${styles.messageContent}`}>
              <MarkdownContent content={professorContent} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 