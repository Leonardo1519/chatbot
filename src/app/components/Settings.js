import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, Button, Space } from 'antd';
import styles from './Settings.module.css';
import { isClient, DEFAULT_API_KEY, validateApiKey, checkAndUpdateApiKeyStatus } from '../utils/storage';

const { Option } = Select;

export default function Settings({ visible, onClose, settings, onSave }) {
  const [form] = Form.useForm();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V2.5');
  const [temperature, setTemperature] = useState(0.7);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isAutoValidating, setIsAutoValidating] = useState(false);
  
  const models = [
    { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
    { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B' },
    { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B' },
    { id: 'baichuan-inc/Baichuan3-Turbo', name: 'Baichuan3 Turbo' }
  ];

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || '');
      setModel(settings.model || 'deepseek-ai/DeepSeek-V2.5');
      setTemperature(settings.temperature || 0.7);
      
      setIsUsingDefaultKey(settings.apiKey === DEFAULT_API_KEY);
    }
  }, [settings]);

  // 自动验证API密钥
  useEffect(() => {
    const autoValidate = async () => {
      if (apiKey && apiKey.trim() !== '' && !isUsingDefaultKey) {
        setIsAutoValidating(true);
        try {
          const isValid = await validateApiKey(apiKey.trim());
          if (!isValid) {
            setValidationError('API密钥无效或已过期，请检查后重试');
          } else {
            setValidationError('');
          }
        } catch (error) {
          setValidationError('验证API密钥时出错，请稍后重试');
        } finally {
          setIsAutoValidating(false);
        }
      }
    };

    const timeoutId = setTimeout(autoValidate, 1000);
    return () => clearTimeout(timeoutId);
  }, [apiKey, isUsingDefaultKey]);

  const handleSubmit = (values) => {
    onSave(values);
  };
  
  const toggleApiHelp = () => {
    setShowApiHelp(!showApiHelp);
  };
  
  if (!visible) return null;
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={settings}
      onFinish={handleSubmit}
      className={styles.settingsForm}
    >
      <Form.Item
        label="API密钥"
        name="apiKey"
        rules={[{ required: true, message: '请输入API密钥' }]}
      >
        <Input.Password placeholder="输入SiliconFlow API密钥" />
      </Form.Item>

      <Form.Item
        label="模型"
        name="model"
        rules={[{ required: true, message: '请选择模型' }]}
      >
        <Select placeholder="选择模型">
          {models.map((m) => (
            <Option key={m.id} value={m.id}>{m.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="温度"
        name="temperature"
        rules={[{ required: true, message: '请设置温度' }]}
      >
        <Slider
          min={0}
          max={1}
          step={0.1}
          marks={{
            0: '0',
            0.5: '0.5',
            1: '1'
          }}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
          <Button onClick={onClose}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
} 