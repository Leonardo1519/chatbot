'use client';

import { useState, useEffect } from 'react';

// 这个组件确保其子组件只在客户端渲染
export default function ClientOnly({ children, fallback = null }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return fallback;
  }

  return children;
} 