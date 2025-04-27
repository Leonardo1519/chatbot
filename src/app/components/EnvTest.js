'use client';

import { useEffect, useState } from 'react';
import styles from './ApiKeyInfo.module.css';

// 这个组件用于测试环境变量是否正确加载
export default function EnvTest() {
  const [envStatus, setEnvStatus] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查环境变量
    const hasEnvVariable = typeof process !== 'undefined' && 
                           process.env && 
                           process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY;
    
    if (hasEnvVariable) {
      // 不显示实际密钥，只显示前几个字符
      const keyPrefix = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY.substring(0, 8) + '...';
      setEnvStatus(`已检测到环境变量 (${keyPrefix})`);
    } else {
      setEnvStatus('未检测到环境变量');
    }
  }, []);

  if (!envStatus) return null;

  return (
    <div className={styles.infoContainer} style={{ bottom: '50px' }}>
      <button 
        className={styles.infoButton}
        onClick={() => setIsVisible(!isVisible)}
        title="测试环境变量"
        style={{ backgroundColor: '#e6f7ff' }}
      >
        🔍
      </button>
      
      {isVisible && (
        <div className={styles.infoPopup}>
          <p>环境变量状态: <strong>{envStatus}</strong></p>
          <small>此组件仅用于开发环境测试</small>
        </div>
      )}
    </div>
  );
} 