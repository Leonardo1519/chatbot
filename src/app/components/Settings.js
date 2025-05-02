import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, Button, Space, Radio, Spin, Alert, Divider, Upload, Avatar, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined, LoadingOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import styles from './Settings.module.css';
import { isClient, DEFAULT_API_KEY, validateApiKey, checkAndUpdateApiKeyStatus, saveUserAvatar, loadUserAvatar, AVAILABLE_THEMES, DEFAULT_THEME, saveSettings, loadSettings, getThemeColor } from '../utils/storage';

const { Option } = Select;

export default function Settings({ visible, onClose, settings, onSave }) {
  const [form] = Form.useForm();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V2.5');
  const [temperature, setTemperature] = useState(0.5);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [currentThemeColor, setCurrentThemeColor] = useState('');
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isAutoValidating, setIsAutoValidating] = useState(false);
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

  // 获取当前主题颜色
  useEffect(() => {
    if (isClient) {
      // 当选择新主题时更新主题颜色
      const updateThemeColor = () => {
        const themeObj = AVAILABLE_THEMES.find(t => t.key === theme);
        if (themeObj) {
          setCurrentThemeColor(themeObj.primary);
        }
      };
      
      // 从CSS变量获取当前主题颜色
      const getCssVariableColor = () => {
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          const computedColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
          return computedColor || getThemeColor(DEFAULT_THEME);
        }
        return getThemeColor(DEFAULT_THEME);
      };
      
      // 初始化颜色
      setCurrentThemeColor(getCssVariableColor());
      
      // 监听主题变化
      const handleThemeChange = () => {
        setCurrentThemeColor(getCssVariableColor());
      };
      
      window.addEventListener('themeChange', handleThemeChange);
      
      // 如果当前选中了主题，应用该主题的颜色
      updateThemeColor();
      
      return () => {
        window.removeEventListener('themeChange', handleThemeChange);
      };
    }
  }, [theme]);

  // 加载用户头像
  useEffect(() => {
    if (isClient) {
      const savedAvatar = loadUserAvatar();
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      }
    }
  }, []);

  // 初始化组件状态
  useEffect(() => {
    // 从设置中获取用户的主题偏好
    if (settings) {
      setApiKey(settings.apiKey || '');
      // 首次加载时使用默认值，之后保留用户设置
      setModel(settings.model || 'deepseek-ai/DeepSeek-V2.5');
      
      // 如果settings中有温度设置，使用用户设置的值；否则使用默认值0.5
      const tempValue = settings.temperature !== undefined ? settings.temperature : 0.5;
      setTemperature(tempValue);
      
      // 使用用户保存的主题设置或默认主题
      setTheme(settings.theme || DEFAULT_THEME);
      
      setIsUsingDefaultKey(settings.apiKey === DEFAULT_API_KEY);
      
      // 使用用户保存的设置，包括主题
      form.setFieldsValue({
        ...settings,
        model: settings.model || 'deepseek-ai/DeepSeek-V2.5',
        temperature: tempValue, // 确保表单中的温度值与状态一致
        theme: settings.theme || DEFAULT_THEME
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
    // 保存用户选择的值
    const updatedValues = {
      ...values,
      model: values.model,
      temperature: values.temperature, // 确保温度值正确保存
      theme: values.theme
    };
    
    // 只在点击保存按钮时应用主题颜色
    if (isClient) {
      const themeObj = AVAILABLE_THEMES.find(t => t.key === values.theme) || AVAILABLE_THEMES[0];
      
      // 强制应用颜色设置
      const root = document.documentElement;
      root.style.setProperty('--primary-color', themeObj.primary);
      
      // 创建一个临时样式表强制应用主题颜色
      const stylesheet = document.createElement('style');
      stylesheet.textContent = `
        :root {
          --primary-color: ${themeObj.primary} !important;
        }
      `;
      document.head.appendChild(stylesheet);
      setTimeout(() => document.head.removeChild(stylesheet), 100);
      
      // 触发主题变化事件
      window.dispatchEvent(new CustomEvent('themeChange'));
    }
    
    // 关闭设置面板，保存设置
    onSave(updatedValues);
  };
  
  // 处理取消按钮点击
  const handleCancel = () => {
    // 重置表单值为原始设置值
    form.setFieldsValue({
      ...settings,
      model: settings.model || 'deepseek-ai/DeepSeek-V2.5',
      temperature: settings.temperature !== undefined ? settings.temperature : 0.5,
      theme: settings.theme || DEFAULT_THEME
    });
    
    // 重置状态值
    setApiKey(settings.apiKey || '');
    setModel(settings.model || 'deepseek-ai/DeepSeek-V2.5');
    setTemperature(settings.temperature !== undefined ? settings.temperature : 0.5);
    setTheme(settings.theme || DEFAULT_THEME);
    
    // 清除验证错误消息
    setValidationError('');
    
    // 不应用任何颜色变更，直接关闭设置面板
    onClose();
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

  // 处理主题变更
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    
    // 当选择新主题时立即更新主题色（仅用于预览）
    const themeObj = AVAILABLE_THEMES.find(t => t.key === newTheme);
    if (themeObj) {
      setCurrentThemeColor(themeObj.primary);
    }
    
    // 更新表单数据
    form.setFieldsValue({ theme: newTheme });
    
    // 不在选择主题时立即应用颜色变更，只是预览颜色
    // 实际的颜色变更会在点击保存按钮时应用
  };

  // 处理温度滑块值变化
  const handleTemperatureChange = (value) => {
    setTemperature(value);
    form.setFieldsValue({ temperature: value });
  };
  
  if (!visible) return null;
  
  // 如果没有设置当前主题色，使用主题对应的颜色或默认颜色
  const themeColor = currentThemeColor || getThemeColor(theme);
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{...settings}}
      onFinish={handleSubmit}
      className={styles.settingsForm}
    >
      <Divider orientation="center">个人设置</Divider>
      
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
            style={{ borderColor: themeColor, color: themeColor }}
          >
            {uploading ? '上传中...' : '更改头像'}
          </Button>
        </Upload>
        <div className={styles.avatarTips}>
          支持JPG, PNG格式, 小于2MB的图片文件
        </div>
      </div>

      <Divider orientation="center">界面设置</Divider>
      <Form.Item
        label="主题颜色"
        name="theme"
        rules={[{ required: true, message: '请选择主题颜色' }]}
        tooltip="选择不同的主题颜色，改变界面的整体风格"
      >
        <Radio.Group 
          className={styles.themeSelector}
          onChange={handleThemeChange}
          value={theme}
          buttonStyle="solid"
        >
          {AVAILABLE_THEMES.map((themeItem) => (
            <Radio.Button 
              key={themeItem.key} 
              value={themeItem.key}
              style={{
                backgroundColor: themeItem.primary,
                borderColor: themeItem.primary,
                color: 'white',
                fontWeight: theme === themeItem.key ? 'bold' : 'normal',
                cursor: 'pointer',
                outline: theme === themeItem.key ? `2px solid ${themeItem.primary}` : 'none',
                outlineOffset: '2px'
              }}
            >
              {themeItem.name}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>

      <div style={{ marginBottom: '50px' }}></div>

      <Divider orientation="center">接口设置</Divider>
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
          <Spin indicator={<LoadingOutlined style={{ fontSize: 16, marginRight: 8, color: themeColor }} />} />
          <span style={{ color: themeColor }}>正在验证API密钥...</span>
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
          onChange={handleTemperatureChange}
          value={temperature}
          trackStyle={{ backgroundColor: themeColor }}
          handleStyle={{ borderColor: themeColor, backgroundColor: themeColor }}
        />
      </Form.Item>

      <Form.Item>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '30px' 
        }}>
          <Space size="small">
            <Button 
              type="primary" 
              htmlType="submit"
              style={{ backgroundColor: themeColor, borderColor: themeColor }}
            >
              保存
            </Button>
            <Button 
              onClick={handleCancel}
              style={{ borderColor: themeColor, color: themeColor }}
            >
              取消
            </Button>
          </Space>
        </div>
      </Form.Item>
    </Form>
  );
} 