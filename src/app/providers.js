'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { StyleProvider, createCache } from '@ant-design/cssinjs';
import zhCN from 'antd/locale/zh_CN';
import ClientOnly from './components/ClientOnly';

// 创建一个缓存实例
const cache = createCache();

export function Providers({ children }) {
  return (
    <ClientOnly>
      <StyleProvider hashPriority="high" cache={cache}>
        <ConfigProvider
          locale={zhCN}
          wave={{ disabled: true }}
        >
          {children}
        </ConfigProvider>
      </StyleProvider>
    </ClientOnly>
  );
} 