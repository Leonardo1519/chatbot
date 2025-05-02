import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState, memo, useMemo, useRef } from 'react';
import styles from './ChatMessage.module.css';
import { loadUserAvatar, getTheme, getThemeColor } from '../utils/storage';
import ClientOnly from './ClientOnly';

const { Text, Paragraph } = Typography;

// 使用memo优化MarkdownContent组件，只有当content变化时才重新渲染
const MarkdownContent = memo(({ content }) => {
  // 使用useRef跟踪内容变化
  const contentRef = useRef('');
  const [renderedContent, setRenderedContent] = useState(content);
  
  // 使用防抖处理内容更新，避免频繁重渲染Markdown
  useEffect(() => {
    if (content === contentRef.current) return;
    
    const lengthDiff = Math.abs(content.length - contentRef.current.length);
    const hasSubstantialChange = lengthDiff > 100;
    
    // 只有当内容变化足够大时，才立即更新
    if (hasSubstantialChange) {
      contentRef.current = content;
      setRenderedContent(content);
    } else {
      // 对于小的增量更新，使用requestAnimationFrame平滑渲染
      requestAnimationFrame(() => {
        contentRef.current = content;
        setRenderedContent(content);
      });
    }
  }, [content]);
  
  return (
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
        {renderedContent}
      </ReactMarkdown>
    </ClientOnly>
  );
});

// 添加displayName以方便调试
MarkdownContent.displayName = 'MarkdownContent';

// 使用memo优化整个ChatMessage组件
const ChatMessage = memo(({ message, isTyping }) => {
  const [userAvatar, setUserAvatar] = useState(null);
  const [expertContent, setExpertContent] = useState('');
  const [professorContent, setProfessorContent] = useState('');
  const [currentTheme, setCurrentTheme] = useState('');
  const [contentStable, setContentStable] = useState(false);
  const contentRef = useRef('');
  const prevContentLengthRef = useRef(0);
  
  // 加载用户头像和主题
  useEffect(() => {
    const savedAvatar = loadUserAvatar();
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }
    
    // 获取当前主题
    const theme = getTheme();
    setCurrentTheme(theme);
    
    // 监听主题变化
    const handleThemeChange = () => {
      const newTheme = getTheme();
      setCurrentTheme(newTheme);
    };
    
    // 添加CSS变量监听以实时响应主题变化
    const observeCSSVariableChanges = () => {
      if (typeof window === 'undefined' || !window.MutationObserver) return;
      
      const targetNode = document.documentElement;
      const config = { attributes: true, attributeFilter: ['style'] };
      
      const callback = () => {
        // 当CSS变量变化时，强制重新获取主题
        handleThemeChange();
      };
      
      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);
      
      return () => observer.disconnect();
    };
    
    // 启动CSS变量监听
    const unobserve = observeCSSVariableChanges();
    
    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChange', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChange', handleThemeChange);
      if (unobserve) unobserve();
    };
  }, []);
  
  // 生成基于主题的样式
  const themeStyles = useMemo(() => {
    // 获取主题颜色
    const themeColor = getThemeColor(currentTheme);
    
    // 动态生成颜色变体
    const lightThemeColor = `${themeColor}15`; // 更淡的颜色用于背景 (15% 透明度)
    const mediumThemeColor = `${themeColor}25`; // 中等强度用于用户消息 (25% 透明度)
    const borderThemeColor = `${themeColor}40`; // 中等强度用于边框 (40% 透明度)
    const professorThemeColor = `${themeColor}10`; // 最淡的颜色用于教授消息 (10% 透明度)
    
    return {
      // 用户气泡样式
      senderBubble: {
        backgroundColor: mediumThemeColor,
        border: `1px solid ${borderThemeColor}`,
      },
      // 用户文本样式
      senderText: {
        color: '#000000',
      },
      // AI专家气泡样式
      receiverBubble: {
        backgroundColor: lightThemeColor,
        border: `1px solid ${borderThemeColor}`,
        transition: 'background-color 0.3s ease',
        willChange: 'contents', // 提示浏览器这个元素内容会改变
      },
      // AI专家文本样式
      receiverText: {
        color: '#000000',
      },
      // 教授气泡样式
      professorBubble: {
        backgroundColor: professorThemeColor,
        border: `1px solid ${borderThemeColor}`,
        transition: 'background-color 0.3s ease',
        willChange: 'contents', // 提示浏览器这个元素内容会改变
      },
      // 教授文本样式
      professorText: {
        color: '#000000',
      },
      // 输入指示器点样式
      dot: {
        backgroundColor: themeColor
      }
    };
  }, [currentTheme]);
  
  // 优化内容稳定性
  useEffect(() => {
    if (!message.isSender && message.text) {
      // 如果内容长度变化较大，标记为不稳定以减少闪烁
      const lengthDiff = Math.abs(message.text.length - prevContentLengthRef.current);
      
      // 仅当内容大量变化时才重新设置不稳定状态
      if (lengthDiff > 50) {
        setContentStable(false);
        prevContentLengthRef.current = message.text.length;
        
        // 使用requestAnimationFrame确保DOM稳定
        requestAnimationFrame(() => {
          setContentStable(true);
        });
      } else {
        prevContentLengthRef.current = message.text.length;
      }
      
      // 使用防抖分析内容分割
      if (contentRef.current !== message.text) {
        contentRef.current = message.text;
        
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

  // 给MarkdownContent组件添加样式
  const MarkdownContentWithStyle = memo(({ content, textStyle }) => (
    <div style={textStyle} className={contentStable ? styles.stableContent : ''}>
      <MarkdownContent content={content} />
    </div>
  ));
  
  MarkdownContentWithStyle.displayName = 'MarkdownContentWithStyle';

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
          <div 
            className={`${styles.messageContent}`}
            style={themeStyles.senderBubble}
          >
            <MarkdownContentWithStyle content={message.text} textStyle={themeStyles.senderText} />
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
          <div 
            className={`${styles.messageContent}`}
            style={themeStyles.receiverBubble}
          >
            <MarkdownContentWithStyle content={expertContent} textStyle={themeStyles.receiverText} />
          </div>
          {isTyping && (
            <span className={styles.typingIndicator}>
              <span className={styles.dot} style={themeStyles.dot}></span>
              <span className={styles.dot} style={themeStyles.dot}></span>
              <span className={styles.dot} style={themeStyles.dot}></span>
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
            <div 
              className={`${styles.messageContent}`}
              style={themeStyles.professorBubble}
            >
              <MarkdownContentWithStyle content={professorContent} textStyle={themeStyles.professorText} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage; 