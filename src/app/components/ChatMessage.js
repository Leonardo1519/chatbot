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
  const markdownRef = useRef(null);
  
  // 渐进式渲染，减少视觉闪烁
  useEffect(() => {
    if (markdownRef.current) {
      markdownRef.current.style.opacity = '0';
      requestAnimationFrame(() => {
        if (markdownRef.current) {
          markdownRef.current.style.opacity = '1';
        }
      });
    }
  }, [content]);
  
  return (
    <ClientOnly>
      <div ref={markdownRef} style={{ transition: 'opacity 0.05s ease-in-out' }}>
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
      </div>
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
    
    // 添加系统颜色模式变化的监听
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = () => {
      // 当系统颜色方案变化时，强制更新
      setCurrentTheme(prevTheme => {
        // 触发重新渲染
        return prevTheme;
      });
    };
    
    // 根据浏览器支持的API添加事件监听
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleColorSchemeChange);
    } else if (mediaQueryList.addListener) {
      // 旧版浏览器兼容
      mediaQueryList.addListener(handleColorSchemeChange);
    }
    
    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChange', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChange', handleThemeChange);
      
      // 移除颜色模式变化的监听
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleColorSchemeChange);
      } else if (mediaQueryList.removeListener) {
        // 旧版浏览器兼容
        mediaQueryList.removeListener(handleColorSchemeChange);
      }
      
      if (unobserve) unobserve();
    };
  }, []);
  
  // 生成基于主题的样式
  const themeStyles = useMemo(() => {
    // 获取主题颜色
    const themeColor = getThemeColor(currentTheme);
    
    // 动态生成颜色变体
    // 获取CSS变量中定义的值，确保与系统主题匹配
    const getCSSVariable = (varName, fallback) => {
      if (typeof window === 'undefined') return fallback;
      const rootStyle = getComputedStyle(document.documentElement);
      return rootStyle.getPropertyValue(varName).trim() || fallback;
    };
    
    // 检测系统是否为深色模式
    const isDarkMode = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 根据深色/浅色模式调整透明度和颜色
    // 深色模式下增加亮度，浅色模式下降低亮度
    const userBgOpacity = isDarkMode ? '35' : '25'; // 用户消息背景透明度
    const userBorderOpacity = isDarkMode ? '50' : '40'; // 用户消息边框透明度
    const expertBgOpacity = isDarkMode ? '25' : '15'; // 专家消息背景透明度
    const expertBorderOpacity = isDarkMode ? '40' : '30'; // 专家消息边框透明度
    const professorBgOpacity = isDarkMode ? '20' : '10'; // 教授消息背景透明度
    const professorBorderOpacity = isDarkMode ? '35' : '25'; // 教授消息边框透明度
    
    // 从CSS变量获取文本颜色
    const textColor = getCSSVariable('--bubble-text-color', isDarkMode ? '#f0f0f0' : '#000000');
    // 从CSS变量获取阴影效果
    const shadowEffect = getCSSVariable('--bubble-shadow', isDarkMode ? 
      '0 1px 3px rgba(0, 0, 0, 0.2)' : 
      '0 1px 2px rgba(0, 0, 0, 0.05)');
    
    // 生成各种透明度的主题色
    const lightThemeColor = `${themeColor}${expertBgOpacity}`; // 专家背景色
    const mediumThemeColor = `${themeColor}${userBgOpacity}`; // 用户背景色
    const userBorderThemeColor = `${themeColor}${userBorderOpacity}`; // 用户边框色
    const expertBorderThemeColor = `${themeColor}${expertBorderOpacity}`; // 专家边框色
    const professorThemeColor = `${themeColor}${professorBgOpacity}`; // 教授背景色
    const professorBorderThemeColor = `${themeColor}${professorBorderOpacity}`; // 教授边框色
    
    return {
      // 用户气泡样式
      senderBubble: {
        backgroundColor: mediumThemeColor,
        border: `1px solid ${userBorderThemeColor}`,
        boxShadow: shadowEffect,
      },
      // 用户文本样式
      senderText: {
        color: textColor,
      },
      // AI专家气泡样式
      receiverBubble: {
        backgroundColor: lightThemeColor,
        border: `1px solid ${expertBorderThemeColor}`,
        boxShadow: shadowEffect,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        willChange: 'contents', // 提示浏览器这个元素内容会改变
      },
      // AI专家文本样式
      receiverText: {
        color: textColor,
      },
      // 教授气泡样式
      professorBubble: {
        backgroundColor: professorThemeColor,
        border: `1px solid ${professorBorderThemeColor}`,
        boxShadow: shadowEffect,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        willChange: 'contents', // 提示浏览器这个元素内容会改变
      },
      // 教授文本样式
      professorText: {
        color: textColor,
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
      // 使用更可靠的内容处理方式
      const handleContent = () => {
        const newText = message.text;
        
        // 检查内容是否发生变化，避免不必要的更新
        if (contentRef.current !== newText) {
          // 拆分消息内容
          const parts = newText.split('【计算机教授点评】');
          if (parts.length > 1) {
            // 删除IT专家标签
            const expertPart = parts[0].replace('【IT专家】', '').trim();
            setExpertContent(expertPart);
            setProfessorContent(parts[1].trim());
          } else {
            // 如果没有找到分隔符，就把全部内容都设为IT专家的
            setExpertContent(newText.replace('【IT专家】', '').trim());
            setProfessorContent('');
          }
          
          // 更新引用内容
          contentRef.current = newText;
          
          // 取消之前计划的所有状态更新
          if (window.rafId) {
            cancelAnimationFrame(window.rafId);
          }
          
          // 只有当内容大幅变化时才触发稳定性处理
          const lengthDiff = Math.abs(newText.length - prevContentLengthRef.current);
          if (lengthDiff > 50) {
            // 使用单个requestAnimationFrame
            window.rafId = requestAnimationFrame(() => {
              // 设置为不稳定状态的时间很短，几乎察觉不到
              setContentStable(false);
              
              // 立即在下一帧恢复稳定
              window.rafId = requestAnimationFrame(() => {
                prevContentLengthRef.current = newText.length;
                setContentStable(true);
              });
            });
          } else {
            prevContentLengthRef.current = newText.length;
          }
        }
      };
      
      // 使用防抖处理，减少处理频率
      const debounceTime = 80; // 80ms防抖
      const timeoutId = setTimeout(handleContent, debounceTime);
      
      return () => {
        clearTimeout(timeoutId);
        if (window.rafId) {
          cancelAnimationFrame(window.rafId);
        }
      };
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
  const MarkdownContentWithStyle = memo(({ content, textStyle }) => {
    // 计算字符数估算高度，减少布局变化导致的闪烁
    const estimatedHeight = useMemo(() => {
      if (!content) return 'auto';
      // 粗略估算：每40个字符一行，每行20px高度
      const charCount = content.length;
      const lines = charCount / 40;
      const baseHeight = Math.max(24, lines * 20);
      
      // 添加额外空间以适应Markdown格式
      const extraSpace = content.includes('```') ? 100 : 0;
      return `${baseHeight + extraSpace}px`;
    }, [content]);
    
    return (
      <div 
        style={{
          ...textStyle,
          transform: 'translateZ(0)',
          transition: 'opacity 0.05s ease-in-out',
          position: 'relative',
          minHeight: estimatedHeight,
        }} 
        className={`${contentStable ? styles.stableContent : styles.unstableContent}`}
      >
        <MarkdownContent content={content} />
      </div>
    );
  });
  
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