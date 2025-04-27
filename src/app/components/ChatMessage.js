import styles from './ChatMessage.module.css';

export default function ChatMessage({ message, isTyping }) {
  return (
    <div className={`${styles.message} ${message.isSender ? styles.sender : styles.receiver}`}>
      {message.text}
      {isTyping && (
        <span className={styles.typingIndicator}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </span>
      )}
    </div>
  );
} 