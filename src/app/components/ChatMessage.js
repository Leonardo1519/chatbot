import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState, memo, useMemo, useRef } from 'react';
import styles from './ChatMessage.module.css';
import { loadUserAvatar, getTheme, getThemeColor, AVAILABLE_THEMES } from '../utils/storage';
import ClientOnly from './ClientOnly';

const { Text, Paragraph } = Typography;

// 使用memo优化MarkdownContent组件，只有当content变化时才重新渲染
const MarkdownContent = memo(({ content }) => {
  const markdownRef = useRef(null);
  
  // 使用硬件加速和GPU渲染优化
  return (
    <ClientOnly>
      <div 
        ref={markdownRef} 
        className={styles.markdownContainer}
        style={{
          transform: 'translateZ(0)', // 修改为更标准的3D变换
          willChange: 'auto', // 改为auto，避免过度使用willChange
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          // 使用更现代的内容控制方式
          contain: 'content',
          // 移除contentVisibility，它可能导致闪烁
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // 防止任何动画效果引起的闪烁
          transition: 'none',
          transitionProperty: 'none',
          animation: 'none',
          // 阻止子元素重绘引起的闪烁
          isolation: 'isolate',
          // 添加新的稳定性属性
          height: 'auto',
          position: 'static',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <Paragraph className={styles.paragraph} style={{margin: '0.5em 0'}}>
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
            // 配置链接在新窗口打开, 移除linkTarget属性
            a: ({ node, children, href }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ClientOnly>
  );
}, (prevProps, nextProps) => {
  // 完全相同内容直接跳过渲染更新
  if (prevProps.content === nextProps.content) return true;
  
  // 确保内容只是在增加（流式输出情况）
  if (nextProps.content.startsWith(prevProps.content)) {
    const additionalContent = nextProps.content.slice(prevProps.content.length);
    
    // 设置固定更新频率，优化渲染性能与视觉效果的平衡
    const minUpdateLength = 10; // 固定每至少10个字符更新一次
    
    // 当新增内容小于阈值时不更新，除非包含特殊MD标记
    if (additionalContent.length < minUpdateLength && 
        !/[#*`_~\[\](){}>\-+\n]/.test(additionalContent)) {
      return true; // 跳过更新
    }
    
    // 检测到Markdown标记字符时总是更新，确保格式正确渲染
    if (/[#*`_~\[\](){}>\-+\n]/.test(additionalContent)) {
      return false; // 强制更新
    }
  }
  
  // 默认允许更新
  return false;
});

// 添加displayName以方便调试
MarkdownContent.displayName = 'MarkdownContent';

// 使用memo优化头像组件，防止在消息内容更新时重新渲染头像
const MemoizedAvatar = memo(({ isSender, userAvatar }) => {
  // 返回对应的头像
  if (isSender) {
    return userAvatar 
      ? <Avatar 
          src={userAvatar} 
          size={40}
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        /> 
      : <Avatar 
          icon={<UserOutlined />} 
          size={40}
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        />;
  }
  return (
    <Avatar
      src="/avatars/Capybara-1.jpg"
      alt="小卡"
      size={40}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    />
  );
}, (prevProps, nextProps) => {
  // 只有当用户头像变化时才重新渲染
  if (prevProps.isSender !== nextProps.isSender) return false;
  if (prevProps.isSender && nextProps.isSender) {
    return prevProps.userAvatar === nextProps.userAvatar;
  }
  return true;
});

MemoizedAvatar.displayName = 'MemoizedAvatar';

// 使用memo优化角色标签组件
const MemoizedRoleLabel = memo(({ isSender }) => {
  return (
    <Text 
      type="secondary" 
      className={styles.roleLabel}
      style={{
        transform: 'translateZ(0)',
        transition: 'none',
      }}
    >
      {isSender ? '用户' : '小卡'}
    </Text>
  );
}, (prevProps, nextProps) => prevProps.isSender === nextProps.isSender);

MemoizedRoleLabel.displayName = 'MemoizedRoleLabel';

// 使用memo优化整个ChatMessage组件
const ChatMessage = memo(({ message, isTyping }) => {
  const [userAvatar, setUserAvatar] = useState(null);
  const [aiContent, setAIContent] = useState('');
  const [currentTheme, setCurrentTheme] = useState('');
  const [contentStable, setContentStable] = useState(false);
  const contentRef = useRef('');
  const prevContentLengthRef = useRef(0);
  
  // 调试日志，查看主题变化
  useEffect(() => {
    console.log("当前主题:", currentTheme);
  }, [currentTheme]);
  
  // 加载用户头像和主题
  useEffect(() => {
    const savedAvatar = loadUserAvatar();
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }
    
    // 监听头像变更事件
    const handleAvatarChange = (event) => {
      // 不再从event.detail中获取头像，而是直接从localStorage加载
      // 这确保只有在点击保存按钮后才会更新头像
      const updatedAvatar = loadUserAvatar();
      if (updatedAvatar) {
        setUserAvatar(updatedAvatar);
      }
    };
    
    // 获取当前主题
    const theme = getTheme();
    setCurrentTheme(theme);
    
    // 监听主题变化
    const handleThemeChange = () => {
      console.log('主题变化被触发');
      const newTheme = getTheme();
      setCurrentTheme(newTheme);
      
      // 强制重新渲染
      setContentStable(prev => !prev);
    };
    
    // 添加CSS变量监听以实时响应主题变化
    const observeCSSVariableChanges = () => {
      if (typeof window === 'undefined' || !window.MutationObserver) return null;
      
      const targetNode = document.documentElement;
      const config = { attributes: true, attributeFilter: ['style'] };
      
      const callback = (mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'style') {
            // 当CSS变量变化时，获取新的主题色值
            const root = document.documentElement;
            const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
            if (primaryColor) {
              // 立即更新主题，不需要通过getTheme，直接响应CSS变量变化
              setCurrentTheme(prev => {
                // 如果主题色没变，则不触发更新
                if (getThemeColor(prev) === primaryColor) return prev;
                // 根据颜色值反查主题名
                const themeEntry = AVAILABLE_THEMES.find(t => t.primary === primaryColor);
                return themeEntry ? themeEntry.key : prev;
              });
              
              // 强制重新渲染
              setContentStable(prev => !prev);
            }
          }
        }
      };
      
      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);
      
      return observer;
    };
    
    // 启动CSS变量监听
    const observer = observeCSSVariableChanges();
    
    // 添加事件监听
    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChange', handleThemeChange);
    window.addEventListener('avatarChange', handleAvatarChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('avatarChange', handleAvatarChange);
      if (observer) observer.disconnect();
    };
  }, []);
  
  // 生成基于主题的样式
  const themeStyles = useMemo(() => {
    // 获取主题颜色
    const themeColor = getThemeColor(currentTheme);
    
    // 将十六进制颜色转换为RGB数组
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
      return result ? 
        [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : 
        [24, 144, 255]; // 默认蓝色RGB
    };
    
    const rgbArray = hexToRgb(themeColor);
    
    return {
      // 用户气泡样式 - 使用主题色的淡化背景
      senderBubble: {
        backgroundColor: `rgba(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]}, 0.1)`,
        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
        border: 'none'
      },
      // 用户文本样式
      senderText: {
        color: '#000000',
      },
      // AI专家文本样式
      receiverText: {
        color: '#000000',
      },
      // 输入指示器点样式 - 使用主题色
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
          // 直接处理消息内容
          setAIContent(newText.trim());
          
          // 更新引用内容
          contentRef.current = newText;
          
          // 始终保持稳定状态，避免状态切换引起的闪烁
          setContentStable(true);
          prevContentLengthRef.current = newText.length;
        }
      };
      
      // 直接处理内容，不使用延迟
      handleContent();
    }
  }, [message.text, message.isSender]);
  
  // 给MarkdownContent组件添加样式
  const MarkdownContentWithStyle = memo(({ content, textStyle }) => {
    // 使用硬件加速和稳定渲染技术
    return (
      <div 
        style={{
          ...textStyle,
          transform: 'translateZ(0)', 
          position: 'relative',
          minHeight: '24px',
          // 更优化的内容控制
          contain: 'content', 
          // 移除可能引起闪烁的contentVisibility
          // 完全移除任何可能的动画和过渡效果
          animation: 'none',
          animationDuration: '0s',
          transition: 'none',
          transitionDuration: '0s',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          pointerEvents: content ? 'auto' : 'none',
          // 添加下列稳定性属性防止布局变动
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          boxSizing: 'border-box',
          // 强制文本渲染稳定
          textRendering: 'optimizeSpeed',
          // 禁用GPU合成层动画
          willChange: 'auto',
        }} 
        className={styles.messageContentWrapper}
      >
        <MarkdownContent content={content} />
      </div>
    );
  }, (prevProps, nextProps) => {
    // 内容完全相同，不需要重新渲染
    if (prevProps.content === nextProps.content) {
      return true;
    }
    
    // 空内容检查
    if (!prevProps.content || !nextProps.content) {
      return prevProps.content === nextProps.content;
    }
    
    // 只处理增量更新场景（流式输出）
    if (nextProps.content.startsWith(prevProps.content)) {
      // 新内容比旧内容多出的字符
      const newContent = nextProps.content.slice(prevProps.content.length);
      
      // 固定更新策略：每10字符更新一次，但遇到Markdown控制字符时立即更新
      const hasMarkdownSyntax = /[#*`_~\[\](){}>!\-+\n]/.test(newContent);
      
      // 当增量内容足够小且不包含特殊语法时跳过更新
      if (newContent.length < 10 && !hasMarkdownSyntax) {
        return true; // 跳过当前渲染
      }
      
      // 当有特殊Markdown语法字符时强制渲染
      if (hasMarkdownSyntax) {
        return false; // 强制渲染
      }
    }
    
    // 默认允许更新
    return false;
  });
  
  MarkdownContentWithStyle.displayName = 'MarkdownContentWithStyle';

  // 如果是用户消息，直接显示
  if (message.isSender) {
    return (
      <div className={`${styles.messageContainer} ${styles.senderContainer}`}>
        <div className={styles.avatarContainer}>
          <MemoizedAvatar isSender={message.isSender} userAvatar={userAvatar} />
          <MemoizedRoleLabel isSender={message.isSender} />
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
  
  // 如果是AI回复，显示小卡回复
  return (
    <div className={`${styles.messageContainer} ${styles.receiverContainer}`}>
      <div className={styles.avatarContainer}>
        <MemoizedAvatar isSender={message.isSender} userAvatar={userAvatar} />
        <MemoizedRoleLabel isSender={message.isSender} />
      </div>
      <div className={`${styles.message} ${styles.receiver}`}>
        <MarkdownContentWithStyle content={aiContent} textStyle={themeStyles.receiverText} />
        {isTyping && (
          <div className={styles.typingIndicatorContainer}>
            <span className={styles.typingIndicator}>
              <span className={styles.dot} style={themeStyles.dot}></span>
              <span className={styles.dot} style={themeStyles.dot}></span>
              <span className={styles.dot} style={themeStyles.dot}></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage; 