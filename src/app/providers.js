'use client';

import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { StyleProvider, createCache } from '@ant-design/cssinjs';
import zhCN from 'antd/locale/zh_CN';
import ClientOnly from './components/ClientOnly';
import { getTheme, getThemeColor, DEFAULT_THEME } from './utils/storage';

// 创建一个缓存实例
const cache = createCache();

export function Providers({ children }) {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME);
  const [primaryColor, setPrimaryColor] = useState('#1890ff');

  // 监听localStorage的变化，更新主题
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 初始化主题 - 始终使用默认蓝色主题
    setCurrentTheme(DEFAULT_THEME);
    const themeColor = getThemeColor(DEFAULT_THEME);
    setPrimaryColor(themeColor);
    
    // 设置CSS变量为当前主题色
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeColor);
    
    // 实时监听CSS变量变化的函数
    const observeCSSVariableChanges = () => {
      if (!window.MutationObserver) return null;
      
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'style') {
            // 当root样式变化时，获取最新的primary-color值
            const newColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
            if (newColor && newColor !== primaryColor) {
              setPrimaryColor(newColor);
            }
          }
        }
      });
      
      observer.observe(root, {
        attributes: true,
        attributeFilter: ['style']
      });
      
      return observer;
    };
    
    // 启动CSS变量监听
    const observer = observeCSSVariableChanges();
    
    // 监听storage事件以检测其他标签页的变化
    const handleStorageChange = () => {
      // 获取变更后的主题
      const newTheme = getTheme();
      setCurrentTheme(newTheme);
      const newColor = getThemeColor(newTheme);
      setPrimaryColor(newColor);
      
      // 更新CSS变量
      root.style.setProperty('--primary-color', newColor);
    };
    
    // 创建自定义事件监听器
    window.addEventListener('storage', handleStorageChange);
    
    // 创建一个自定义事件，当在同一标签页内修改主题时触发
    window.addEventListener('themeChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleStorageChange);
      if (observer) observer.disconnect();
    };
  }, [primaryColor]);

  return (
    <ClientOnly>
      <StyleProvider hashPriority="high" cache={cache}>
        <ConfigProvider
          locale={zhCN}
          wave={{ disabled: true }}
          theme={{
            token: {
              colorPrimary: primaryColor,
              borderRadius: 4,
            },
            algorithm: theme.defaultAlgorithm,
          }}
        >
          {children}
        </ConfigProvider>
      </StyleProvider>
    </ClientOnly>
  );
} 