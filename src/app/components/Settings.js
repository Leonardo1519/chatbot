import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, Button, Space, Radio, Spin, Alert, Divider, Upload, Avatar, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined, LoadingOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import styles from './Settings.module.css';
import { isClient, DEFAULT_API_KEY, validateApiKey, checkAndUpdateApiKeyStatus, saveUserAvatar, loadUserAvatar } from '../utils/storage';

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
  const [themeColor, setThemeColor] = useState('default');
  const [modelsLoading, setModelsLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const models = [
    { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
    { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B' },
    { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B' },
    { id: 'baichuan-inc/Baichuan3-Turbo', name: 'Baichuan3 Turbo' }
  ];

  const themeOptions = [
    { label: '默认主题', value: 'default' },
    { label: '暗黑主题', value: 'dark' },
    { label: '蓝色主题', value: 'blue' },
    { label: '绿色主题', value: 'green' },
    { label: '紫色主题', value: 'purple' },
  ];

  // 加载用户头像
  useEffect(() => {
    if (isClient) {
      const savedAvatar = loadUserAvatar();
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      }
    }
  }, []);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || '');
      // 首次加载时使用默认值，之后保留用户设置
      setModel(settings.model || 'deepseek-ai/DeepSeek-V2.5');
      setTemperature(settings.temperature || 0.7);
      setThemeColor(settings.themeColor || 'default');
      
      setIsUsingDefaultKey(settings.apiKey === DEFAULT_API_KEY);
      
      // 如果是首次加载或值为空，使用默认值，否则使用用户保存的设置
      form.setFieldsValue({
        ...settings,
        model: settings.model || 'deepseek-ai/DeepSeek-V2.5',
        themeColor: settings.themeColor || 'default'
      });
    }
    
    // 模拟模型加载
    setModelsLoading(true);
    setTimeout(() => {
      setModelsLoading(false);
    }, 1000);
  }, [settings, form]);

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
    // 保存用户选择的值，不强制修改
    const updatedValues = {
      ...values,
      model: values.model,
      themeColor: values.themeColor
    };
    onSave(updatedValues);
  };
  
  const toggleApiHelp = () => {
    setShowApiHelp(!showApiHelp);
  };

  // 处理头像上传前的检查
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('您只能上传图片文件!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于2MB!');
      return false;
    }
    
    return true;
  };

  // 处理头像上传
  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 将文件读取为DataURL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setUserAvatar(dataUrl);
        saveUserAvatar(dataUrl);
        setUploading(false);
        message.success('头像上传成功!');
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  // 自定义上传操作
  const customUpload = async ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess();
    }, 500);
  };
  
  if (!visible) return null;
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{...settings, themeColor: settings?.themeColor || 'default'}}
      onFinish={handleSubmit}
      className={styles.settingsForm}
    >
      <Divider orientation="left">个人设置</Divider>
      
      <div className={styles.avatarUploadContainer}>
        <div className={styles.avatarPreview}>
          {userAvatar ? (
            <Avatar size={64} src={userAvatar} />
          ) : (
            <Avatar size={64} icon={<UserOutlined />} />
          )}
        </div>
        <Upload
          name="avatar"
          listType="picture"
          className={styles.avatarUploader}
          showUploadList={false}
          customRequest={customUpload}
          beforeUpload={beforeUpload}
          onChange={handleAvatarChange}
        >
          <Button 
            icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} 
            className={styles.uploadButton}
          >
            {uploading ? '上传中...' : '更改头像'}
          </Button>
        </Upload>
        <div className={styles.avatarTips}>
          支持JPG, PNG格式, 小于2MB的图片文件
        </div>
      </div>

      <Divider orientation="left">接口设置</Divider>
      <Form.Item
        label="API密钥"
        name="apiKey"
        rules={[{ required: true, message: '请输入API密钥' }]}
      >
        <Input.Password placeholder="输入SiliconFlow API密钥" />
      </Form.Item>

      {validationError && (
        <Alert
          message={validationError}
          type="error"
          showIcon
          className={styles.validationError}
        />
      )}

      {isAutoValidating && (
        <div className={styles.validatingIndicator}>
          <Spin indicator={<LoadingOutlined style={{ marginRight: 8 }} />} />
          <span>正在验证API密钥...</span>
        </div>
      )}

      <Form.Item
        label="模型"
        name="model"
        rules={[{ required: true, message: '请选择模型' }]}
        extra="默认选择 DeepSeek V2.5 模型，您可以根据需要更改"
      >
        {modelsLoading ? (
          <Select placeholder="加载中..." loading />
        ) : (
          <Select placeholder="选择模型" onChange={(value) => setModel(value)}>
            {models.map((m) => (
              <Option key={m.id} value={m.id}>{m.name}</Option>
            ))}
          </Select>
        )}
      </Form.Item>

      <Form.Item
        label="温度"
        name="temperature"
        rules={[{ required: true, message: '请设置温度' }]}
        tooltip="较低的值会生成更确定的、一致的回答，较高的值会增加创意性和多样性"
      >
        <Slider
          min={0}
          max={1}
          step={0.1}
          marks={{
            0: '精确',
            0.5: '平衡',
            1: '创意'
          }}
        />
      </Form.Item>

      <Divider orientation="left">界面设置</Divider>
      <Form.Item
        label="界面主题颜色"
        name="themeColor"
        tooltip="选择聊天界面的主题颜色"
      >
        <Radio.Group 
          options={themeOptions} 
          onChange={(e) => setThemeColor(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          className={styles.themeSelector}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px' 
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