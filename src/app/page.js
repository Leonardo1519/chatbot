import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <h1>聊天应用演示</h1>
        <div className={styles.card}>
          <Link href="/chat">
            <p className={styles.chatButton}>进入聊天室</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
