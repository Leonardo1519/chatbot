import styles from './ChatMessage.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, isTyping }) {
  const getAvatar = () => {
    if (message.isSender) return '👤';
    if (message.role === 'professor') {
      return (
        <Image
          src="/avatars/Capybara-2.jpg"
          alt="计算机教授"
          width={40}
          height={40}
          className={styles.avatarImage}
          priority
        />
      );
    }
    return (
      <Image
        src="/avatars/Capybara-1.jpg"
        alt="IT专家"
        width={40}
        height={40}
        className={styles.avatarImage}
        priority
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
      <div className={styles.avatar}>
        {getAvatar()}
      </div>
      <div className={`${styles.message} ${message.isSender ? styles.sender : styles.receiver}`}>
        <div className={styles.roleLabel}>{getRoleLabel()}</div>
        <div className={styles.messageContent}>
          <ReactMarkdown>{message.text}</ReactMarkdown>
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
  );
} 