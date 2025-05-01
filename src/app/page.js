'use client';

import Link from 'next/link';
import { Card, Typography, Button, Space, Layout, Row, Col } from 'antd';
import { MessageOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function Home() {
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
            <Link href="/chat">
              <Button type="primary" size="large" icon={<MessageOutlined />}>
                进入聊天室
              </Button>
            </Link>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
