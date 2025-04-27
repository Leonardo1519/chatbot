'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_API_KEY, getApiKey } from '../utils/storage';
import styles from './ApiKeyInfo.module.css';

// 这个组件用于显示API密钥的来源信息，在开发和调试时很有用
export default function ApiKeyInfo() {
  const [apiKeySource, setApiKeySource] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查API密钥来源
    const currentKey = getApiKey();
    const envKeyExists = typeof process !== 'undefined' && 
                          process.env && 
                          process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY;
    
    if (currentKey === DEFAULT_API_KEY) {
      if (envKeyExists) {
        setApiKeySource('环境变量');
      } else {
        setApiKeySource('代码中的备用密钥');
      }
    } else {
      setApiKeySource('用户设置的密钥');
    }
  }, []);

  if (!apiKeySource) return null;

  return (
    <div className={styles.infoContainer}>
      <button 
        className={styles.infoButton}
        onClick={() => setIsVisible(!isVisible)}
        title="显示API密钥来源信息"
      >
        ℹ️
      </button>
      
      {isVisible && (
        <div className={styles.infoPopup}>
          <p>当前使用的API密钥来源: <strong>{apiKeySource}</strong></p>
          {apiKeySource === '环境变量' && (
            <p>您正在使用Vercel环境变量中配置的API密钥</p>
          )}
          {apiKeySource === '代码中的备用密钥' && (
            <p>您正在使用代码中预设的备用API密钥，建议配置环境变量</p>
          )}
          {apiKeySource === '用户设置的密钥' && (
            <p>您正在使用通过设置页面手动配置的API密钥</p>
          )}
        </div>
      )}
    </div>
  );
} 