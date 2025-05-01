'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, Typography, Button, Space, Layout, Row, Col } from 'antd';
import { MessageOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function Home() {
  // 强制刷新样式
  useEffect(() => {
    // 刷新页面样式，解决可能的缓存问题
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .${styles.chatButton} {
        height: 60px !important;
        padding: 0 50px !important;
        font-size: 20px !important;
        border-radius: 30px !important;
        background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
        border: none !important;
        box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3) !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <Layout className={styles.main}>
      <Content className={styles.content}>
        <div className={styles.center}>
          <Title level={2} className={styles.title}>
            <RobotOutlined /> 卡皮巴拉AI助手
          </Title>
          <Paragraph className={styles.description}>
            欢迎使用卡皮巴拉AI助手，这是一个智能的对话系统，可以帮助你解答各种问题。
          </Paragraph>
          <Row gutter={[32, 32]} className={styles.features} justify="center" align="stretch">
            <Col xs={24} sm={24} md={8} lg={8} xl={8} style={{ width: '100%', maxWidth: '360px' }}>
              <Card className={styles.featureCard}>
                <MessageOutlined className={styles.featureIcon} />
                <Title level={4}>智能对话</Title>
                <Paragraph>基于先进的AI模型，提供流畅自然的对话体验</Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8} style={{ width: '100%', maxWidth: '360px' }}>
              <Card className={styles.featureCard}>
                <RobotOutlined className={styles.featureIcon} />
                <Title level={4}>专业解答</Title>
                <Paragraph>由IT专家和计算机教授提供专业的技术支持</Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8} style={{ width: '100%', maxWidth: '360px' }}>
              <Card className={styles.featureCard}>
                <SettingOutlined className={styles.featureIcon} />
                <Title level={4}>灵活配置</Title>
                <Paragraph>支持自定义设置，满足不同场景的需求</Paragraph>
              </Card>
            </Col>
          </Row>
          <div className={styles.buttonContainer}>
            <Link href="/chat" className={styles.chatButtonLink}>
              <Button 
                type="primary" 
                size="large" 
                icon={<MessageOutlined />}
                className={styles.chatButton}
                style={{ 
                  height: '60px', 
                  padding: '0 50px', 
                  fontSize: '20px', 
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)'
                }}
              >
                进入聊天室
              </Button>
            </Link>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
