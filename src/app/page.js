'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Typography, Button, Space, Layout, Row, Col } from 'antd';
import { MessageOutlined, RobotOutlined, SettingOutlined, BookOutlined, HighlightOutlined, HeartOutlined } from '@ant-design/icons';
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
        background: linear-gradient(135deg, #c41d7f 0%, #9e1068 100%) !important;
        border: none !important;
        box-shadow: 0 4px 15px rgba(196, 29, 127, 0.3) !important;
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
          <div className={styles.avatarContainer}>
            <Image 
              src="/avatars/frontPage-avatar.png" 
              alt="艺设圆圆" 
              width={200} 
              height={200}
              className={styles.frontPageAvatar}
              priority
              unoptimized
            />
          </div>
          <Title level={2} className={styles.title}>
            艺设圆圆 思政伙伴
          </Title>
          <Paragraph className={styles.description}>
            传承中华文脉，弘扬时代精神。专注于思想政治教育、非遗文化传承与非遗创新设计的智能对话助手。
          </Paragraph>
          <Row gutter={[32, 32]} className={styles.features} justify="center" align="stretch">
            <Col xs={24} sm={24} md={8} lg={8} xl={8} style={{ width: '100%', maxWidth: '420px' }}>
              <Card className={styles.featureCard}>
                <BookOutlined className={styles.featureIcon} />
                <Title level={4}>思政教育</Title>
                <Paragraph>深入浅出讲解马克思主义理论、<br />社会主义核心价值观与党史知识</Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8} style={{ width: '100%', maxWidth: '420px' }}>
              <Card className={styles.featureCard}>
                <HeartOutlined className={styles.featureIcon} />
                <Title level={4}>非遗传承</Title>
                <Paragraph>探索中华非物质文化遗产，了解<br />传统手工艺、民俗文化与技艺传承</Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8} style={{ width: '100%', maxWidth: '420px' }}>
              <Card className={styles.featureCard}>
                <HighlightOutlined className={styles.featureIcon} />
                <Title level={4}>非遗设计</Title>
                <Paragraph>融合传统与现代，探讨非遗元素在文创产品与现代设计中的创新应用</Paragraph>
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
                  background: 'linear-gradient(135deg, #c41d7f 0%, #9e1068 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(196, 29, 127, 0.3)'
                }}
              >
                开始对话
              </Button>
            </Link>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
