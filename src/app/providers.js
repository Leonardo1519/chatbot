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
    
    // 将十六进制颜色转换为RGB格式并设置为CSS变量
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };
    // 设置RGB格式的CSS变量，用于透明度设置
    root.style.setProperty('--primary-rgb', hexToRgb(themeColor));
    
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
              
              // 主动触发主题变化事件，确保所有组件都能及时更新
              window.dispatchEvent(new CustomEvent('themeChange'));
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
      // 更新RGB格式的变量
      root.style.setProperty('--primary-rgb', hexToRgb(newColor));
      
      // 主动触发主题变化事件，确保所有组件都能及时更新
      window.dispatchEvent(new CustomEvent('themeChange'));
    };
    
    // 创建自定义事件监听器
    window.addEventListener('storage', handleStorageChange);
    
    // 创建一个自定义事件，当在同一标签页内修改主题时触发
    window.addEventListener('themeChange', handleStorageChange);
    
    // 初始化后立即触发一次主题变化事件，确保所有组件都使用正确的颜色
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('themeChange'));
    }, 100);
    
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
            components: {
              Input: {
                // 自定义Input组件样式
                colorPrimaryHover: undefined, // 禁用默认悬停效果
                activeBorderColor: '#d9d9d9', // 保持描边颜色
                hoverBorderColor: '#d9d9d9',  // 保持描边颜色
              },
              TextArea: {
                // TextArea组件也应用同样设置
                colorPrimaryHover: undefined, 
                activeBorderColor: '#d9d9d9',
                hoverBorderColor: '#d9d9d9',
              },
              Slider: {
                // 添加对Slider组件的主题处理
                handleColor: primaryColor,
                handleActiveColor: primaryColor,
                dotActiveBorderColor: primaryColor,
                dotActiveBgColor: primaryColor,
                trackBgColor: primaryColor,
                railBgColor: `${primaryColor}30`,
              },
            }
          }}
        >
          {children}
        </ConfigProvider>
      </StyleProvider>
    </ClientOnly>
  );
} 