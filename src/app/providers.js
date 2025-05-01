'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import zhCN from 'antd/locale/zh_CN';

export function Providers({ children }) {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        locale={zhCN}
        wave={{ disabled: true }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
} 