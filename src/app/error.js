'use client';

import { Button } from 'antd';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <h2>页面出错了</h2>
      <p>抱歉，出现了一些问题。</p>
      <Button type="primary" onClick={() => reset()}>
        重试
      </Button>
      <Button style={{ marginLeft: '10px' }} onClick={() => window.location.href = '/'}>
        返回首页
      </Button>
    </div>
  );
} 