import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, Button, Space, Radio, Spin, Alert, Divider, Upload, Avatar, message, App } from 'antd';
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
  const [previewThemeColor, setPreviewThemeColor] = useState(''); // 用于预览的主题颜色
  const [savedThemeColor, setSavedThemeColor] = useState(''); // 用于已保存的主题颜色，控制按钮和滑块颜色
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isAutoValidating, setIsAutoValidating] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage(); // 使用message hook
  
  const models = [
    { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
    { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B' },
    { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B' },
    { id: 'baichuan-inc/Baichuan3-Turbo', name: 'Baichuan3 Turbo' }
  ];

  // 设置初始主题色
  useEffect(() => {
    if (isClient) {
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
      const initialColor = getCssVariableColor();
      setPreviewThemeColor(initialColor);
      setSavedThemeColor(initialColor); // 初始设置保存的颜色
    }
  }, []);

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
      
      // 使用当前settings中的温度值
      setTemperature(settings.temperature);
      
      // 使用用户保存的主题设置或默认主题
      const savedTheme = settings.theme || DEFAULT_THEME;
      setTheme(savedTheme);
      
      // 设置主题预览颜色
      const themeObj = AVAILABLE_THEMES.find(t => t.key === savedTheme);
      if (themeObj) {
        setPreviewThemeColor(themeObj.primary);
        setSavedThemeColor(themeObj.primary); // 设置保存的颜色值
      }
      
      setIsUsingDefaultKey(settings.apiKey === DEFAULT_API_KEY);
      
      // 使用用户保存的设置，包括主题
      form.setFieldsValue({
        ...settings,
        model: settings.model || 'deepseek-ai/DeepSeek-V2.5',
        temperature: settings.temperature, // 确保表单中的温度值与状态一致
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

  // 应用主题样式的通用函数
  const applyThemeStyles = (themeColor) => {
    // 确保有颜色值
    if (!themeColor) {
      themeColor = '#1890ff'; // 默认蓝色
    }
    
    const styleText = `
      :root {
        --primary-color: ${themeColor} !important;
      }
      
      /* 滑块相关样式 */
      .ant-slider-track {
        background-color: ${themeColor} !important;
      }
      .ant-slider-handle {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
      }
      .ant-slider:hover .ant-slider-track {
        background-color: ${themeColor} !important;
      }
      .ant-slider:hover .ant-slider-handle {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
      }
      .ant-slider-handle:focus,
      .ant-slider-handle-dragging,
      .ant-slider-handle:active {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
        box-shadow: none !important;
      }
      .ant-slider-dot-active {
        border-color: ${themeColor} !important;
      }
      /* 所有可能的交互状态 */
      .ant-slider-handle-click-focused {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
      }
      .ant-slider-handle.ant-tooltip-open {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
      }
      /* 固定轨道底色不变 */
      .ant-slider-rail {
        background-color: #f0f0f0 !important;
      }
      /* 标记文字悬停时状态 */
      .ant-slider-mark-text:hover ~ .ant-slider-handle,
      .ant-slider-mark-text:hover ~ .ant-slider-track {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
        box-shadow: none !important;
      }
      /* 滑块悬停时状态 */
      .ant-slider-handle:hover {
        border-color: ${themeColor} !important;
        background-color: ${themeColor} !important;
        box-shadow: none !important;
      }
      
      /* 下拉菜单相关样式 */
      .ant-select-dropdown .ant-select-item-option-selected {
        background-color: ${themeColor}10 !important;
      }
      .ant-select-dropdown .ant-select-item-option-active {
        background-color: ${themeColor}20 !important;
      }
      .ant-select-item-option-content {
        color: inherit !important;
      }
      .ant-select-dropdown .ant-select-item-option-selected .ant-select-item-option-content {
        color: ${themeColor} !important;
        font-weight: bold !important;
      }
      .ant-select-dropdown .ant-select-item-option-active .ant-select-item-option-content {
        color: ${themeColor} !important;
      }
      .ant-select:hover .ant-select-selector,
      .ant-select-focused .ant-select-selector,
      .ant-select-selector:hover,
      .ant-select-selector:focus {
        border-color: ${themeColor} !important;
      }
      .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
        border-color: ${themeColor} !important;
        box-shadow: 0 0 0 2px ${themeColor}20 !important;
      }
    `;
    
    // 移除旧样式表
    const oldStyleElements = document.querySelectorAll('style[data-theme-style="true"]');
    oldStyleElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // 创建和添加新样式表
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-theme-style', 'true');
    styleElement.textContent = styleText;
    document.head.appendChild(styleElement);
    
    // 直接修改所有滑块元素
    setTimeout(() => {
      const sliderTracks = document.querySelectorAll('.ant-slider-track');
      const sliderHandles = document.querySelectorAll('.ant-slider-handle');
      const sliderDots = document.querySelectorAll('.ant-slider-dot-active');
      
      sliderTracks.forEach(track => {
        track.style.backgroundColor = themeColor;
      });
      
      sliderHandles.forEach(handle => {
        handle.style.borderColor = themeColor;
        handle.style.backgroundColor = themeColor;
        handle.style.boxShadow = 'none';
      });
      
      sliderDots.forEach(dot => {
        dot.style.borderColor = themeColor;
      });
    }, 10);
    
    return styleElement; // 返回创建的样式元素，便于后续清理
  };

  const handleSubmit = (values) => {
    // 保存用户选择的值
    const updatedValues = {
      ...values,
      model: values.model,
      temperature: values.temperature, // 确保温度值正确保存
      theme: values.theme
    };
    
    // 保存当前的头像到localStorage
    if (userAvatar) {
      saveUserAvatar(userAvatar);
    }
    
    // 只在点击保存按钮时应用主题颜色到全局
    if (isClient) {
      const themeObj = AVAILABLE_THEMES.find(t => t.key === values.theme) || AVAILABLE_THEMES[0];
      
      // 更新已保存的主题颜色
      setSavedThemeColor(themeObj.primary);
      
      // 强制应用颜色设置
      const root = document.documentElement;
      root.style.setProperty('--primary-color', themeObj.primary);
      
      // 使用通用函数应用主题样式，并获取返回的样式元素
      const styleElement = applyThemeStyles(themeObj.primary);
      
      // 确保我们不会重复添加相同的样式
      setTimeout(() => {
        if (styleElement && styleElement.parentNode) {
          // 保留样式不移除
        }
      }, 100);
      
      // 更新界面元素样式，使其与新的主题颜色一致
      setTimeout(() => {
        const sliderTracks = document.querySelectorAll('.ant-slider-track');
        const sliderHandles = document.querySelectorAll('.ant-slider-handle');
        const sliderDots = document.querySelectorAll('.ant-slider-dot-active');
        
        sliderTracks.forEach(track => {
          track.style.backgroundColor = themeObj.primary;
        });
        
        sliderHandles.forEach(handle => {
          handle.style.borderColor = themeObj.primary;
          handle.style.backgroundColor = themeObj.primary;
        });
        
        sliderDots.forEach(dot => {
          dot.style.borderColor = themeObj.primary;
        });
        
        // 添加对下拉菜单的样式更新
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-theme-selector', 'true');
        styleElement.textContent = `
          /* 下拉菜单样式 */
          .ant-select-dropdown .ant-select-item-option-selected {
            background-color: ${themeObj.primary}10 !important;
          }
          .ant-select-dropdown .ant-select-item-option-active {
            background-color: ${themeObj.primary}20 !important;
          }
          .ant-select-dropdown .ant-select-item-option-selected .ant-select-item-option-content {
            color: ${themeObj.primary} !important;
            font-weight: bold !important;
          }
          .ant-select-dropdown .ant-select-item-option-active .ant-select-item-option-content {
            color: ${themeObj.primary} !important;
          }
          .ant-select:hover .ant-select-selector,
          .ant-select-focused .ant-select-selector,
          .ant-select-selector:hover,
          .ant-select-selector:focus {
            border-color: ${themeObj.primary} !important;
          }
          .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
            border-color: ${themeObj.primary} !important;
            box-shadow: 0 0 0 2px ${themeObj.primary}20 !important;
          }
          
          /* 应用滑块相关样式 */
          .ant-slider-track {
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider-handle {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider:hover .ant-slider-track {
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider:hover .ant-slider-handle {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider-handle:focus {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider-dot-active {
            border-color: ${themeObj.primary} !important;
          }
          .ant-slider-handle-dragging {
            border-color: ${themeObj.primary} !important;
            box-shadow: none !important;
          }
          .ant-slider-handle:hover, 
          .ant-slider-handle:active,
          .ant-slider-handle-click-focused,
          .ant-slider-handle.ant-tooltip-open {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
            box-shadow: none !important;
          }
          .ant-slider-mark-text:hover ~ .ant-slider-handle,
          .ant-slider-mark-text:hover ~ .ant-slider-track {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
            box-shadow: none !important;
          }
        `;
        
        // 移除旧样式
        const oldSelectStyleElements = document.querySelectorAll('style[data-theme-selector="true"]');
        oldSelectStyleElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        // 移除旧的滑块样式
        const oldStyleElements = document.querySelectorAll('style[data-theme-slider="true"]');
        oldStyleElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        // 添加新样式
        document.head.appendChild(styleElement);
      }, 10);
      
      // 保存主题设置到localStorage，确保下次会话中可以使用
      const currentSettings = loadSettings();
      const newSettings = { ...currentSettings, theme: values.theme };
      saveSettings(newSettings);
      
      // 触发主题变化事件
      window.dispatchEvent(new CustomEvent('themeChange'));
      
      // 在保存设置时触发头像更新事件
      window.dispatchEvent(new CustomEvent('avatarChange'));
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
    
    // 重置头像为之前保存的头像
    const savedAvatar = loadUserAvatar();
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    } else {
      setUserAvatar(null);
    }
    
    // 重置主题预览颜色为当前保存的设置
    const currentTheme = settings.theme || DEFAULT_THEME;
    const themeObj = AVAILABLE_THEMES.find(t => t.key === currentTheme);
    if (themeObj) {
      setPreviewThemeColor(themeObj.primary);
    }
    
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
      messageApi.error('您只能上传图片文件!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error('图片必须小于2MB!');
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
        // 仅在本地状态中预览头像，不保存到localStorage
        setUserAvatar(dataUrl);
        setUploading(false);
        messageApi.success('头像上传成功!');
        // 移除这里的avatarChange事件触发，改为在保存设置时触发
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
    
    // 当选择新主题时，只更新预览主题色，但不更新已保存的主题色
    const themeObj = AVAILABLE_THEMES.find(t => t.key === newTheme);
    if (themeObj && isClient) {
      // 只设置预览颜色，不设置保存的颜色
      setPreviewThemeColor(themeObj.primary);
      
      // 不应用到界面元素样式，只保留当前已保存的样式
      // 移除下面的代码，这些会导致立即更新滑块等元素样式
      /*
      // 立即更新滑块样式
      setTimeout(() => {
        const sliderTracks = document.querySelectorAll('.ant-slider-track');
        const sliderHandles = document.querySelectorAll('.ant-slider-handle');
        const sliderDots = document.querySelectorAll('.ant-slider-dot-active');
        
        sliderTracks.forEach(track => {
          track.style.backgroundColor = themeObj.primary;
        });
        
        sliderHandles.forEach(handle => {
          handle.style.borderColor = themeObj.primary;
          handle.style.backgroundColor = themeObj.primary;
        });
        
        sliderDots.forEach(dot => {
          dot.style.borderColor = themeObj.primary;
        });
        
        // 应用自定义样式
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-theme-slider', 'true');
        styleElement.textContent = `
          .ant-slider-track {
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider-handle {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider:hover .ant-slider-track {
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider:hover .ant-slider-handle {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider-handle:focus {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
          }
          .ant-slider-dot-active {
            border-color: ${themeObj.primary} !important;
          }
          .ant-slider-handle-dragging {
            border-color: ${themeObj.primary} !important;
            box-shadow: none !important;
          }
          .ant-slider-handle:hover, 
          .ant-slider-handle:active,
          .ant-slider-handle-click-focused,
          .ant-slider-handle.ant-tooltip-open {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
            box-shadow: none !important;
          }
          .ant-slider-mark-text:hover ~ .ant-slider-handle,
          .ant-slider-mark-text:hover ~ .ant-slider-track {
            border-color: ${themeObj.primary} !important;
            background-color: ${themeObj.primary} !important;
            box-shadow: none !important;
          }
        `;
        
        // 移除旧样式
        const oldStyleElements = document.querySelectorAll('style[data-theme-slider="true"]');
        oldStyleElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        document.head.appendChild(styleElement);
      }, 10);
      */
    }
    
    // 更新表单数据
    form.setFieldsValue({ theme: newTheme });
  };

  // 处理温度滑块值变化
  const handleTemperatureChange = (value) => {
    setTemperature(value);
    form.setFieldsValue({ temperature: value });
    
    // 确保温度滑块使用已保存的主题色而不是预览的主题色
    setTimeout(() => {
      const sliderTracks = document.querySelectorAll('.ant-slider-track');
      const sliderHandles = document.querySelectorAll('.ant-slider-handle');
      const sliderDots = document.querySelectorAll('.ant-slider-dot-active');
      
      // 使用已保存的主题色，而不是当前CSS变量的值
      const currentThemeColor = savedThemeColor;
      
      sliderTracks.forEach(track => {
        track.style.backgroundColor = currentThemeColor;
      });
      
      sliderHandles.forEach(handle => {
        handle.style.borderColor = currentThemeColor;
        handle.style.backgroundColor = currentThemeColor;
      });
      
      sliderDots.forEach(dot => {
        dot.style.borderColor = currentThemeColor;
      });
      
      // 应用关键样式以确保所有状态都正确
      const sliderStyle = document.createElement('style');
      sliderStyle.setAttribute('data-temp-slider-fix', 'true');
      sliderStyle.textContent = `
        .ant-slider-track { background-color: ${currentThemeColor} !important; }
        .ant-slider-handle { 
          border-color: ${currentThemeColor} !important; 
          background-color: ${currentThemeColor} !important; 
        }
        .ant-slider-dot-active { border-color: ${currentThemeColor} !important; }
        .ant-slider:hover .ant-slider-track { background-color: ${currentThemeColor} !important; }
        .ant-slider:hover .ant-slider-handle { 
          border-color: ${currentThemeColor} !important; 
          background-color: ${currentThemeColor} !important; 
        }
        .ant-slider-handle:hover, 
        .ant-slider-handle:focus,
        .ant-slider-handle:active,
        .ant-slider-handle-dragging,
        .ant-slider-handle-click-focused,
        .ant-slider-handle.ant-tooltip-open {
          border-color: ${currentThemeColor} !important;
          background-color: ${currentThemeColor} !important;
          box-shadow: none !important;
        }
        
        /* 下拉菜单样式 */
        .ant-select-dropdown .ant-select-item-option-selected {
          background-color: ${currentThemeColor}10 !important;
        }
        .ant-select-dropdown .ant-select-item-option-active {
          background-color: ${currentThemeColor}20 !important;
        }
        .ant-select-dropdown .ant-select-item-option-selected .ant-select-item-option-content {
          color: ${currentThemeColor} !important;
          font-weight: bold !important;
        }
        .ant-select-dropdown .ant-select-item-option-active .ant-select-item-option-content {
          color: ${currentThemeColor} !important;
        }
        .ant-select:hover .ant-select-selector,
        .ant-select-focused .ant-select-selector,
        .ant-select-selector:hover,
        .ant-select-selector:focus {
          border-color: ${currentThemeColor} !important;
        }
        .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
          border-color: ${currentThemeColor} !important;
          box-shadow: 0 0 0 2px ${currentThemeColor}20 !important;
        }
      `;
      
      // 移除之前可能存在的样式
      const oldStyles = document.querySelectorAll('style[data-temp-slider-fix="true"]');
      oldStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));
      
      // 添加新样式
      document.head.appendChild(sliderStyle);
    }, 10);
  };

  // 生成基于主题色的安全的盒阴影
  const getSafeBoxShadow = (color) => {
    try {
      // 检查颜色值是否为有效十六进制颜色
      if (!color || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return `0 0 0 2px rgba(24, 144, 255, 0.2)`; // 默认蓝色阴影
      }

      // 将十六进制颜色转换为RGB
      const hexToRgb = color.replace('#', '').match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ');
      return `0 0 0 2px rgba(${hexToRgb}, 0.2)`;
    } catch (e) {
      return `0 0 0 2px rgba(24, 144, 255, 0.2)`; // 出错时返回默认值
    }
  };

  // 添加用于修复标记文字悬停问题的脚本
  useEffect(() => {
    if (!visible) return;
    
    // 为标记文字添加鼠标事件，防止悬停在标记上时改变滑块样式
    const fixSliderMarkHover = () => {
      // 等待组件渲染完成
      setTimeout(() => {
        const markTexts = document.querySelectorAll('.ant-slider-mark-text');
        
        markTexts.forEach(text => {
          // 鼠标进入标记文字
          text.addEventListener('mouseenter', (e) => {
            const slider = e.target.closest('.ant-slider');
            if (slider) {
              // 添加自定义类名
              slider.classList.add('mark-hovered');
            }
          });
          
          // 鼠标离开标记文字
          text.addEventListener('mouseleave', (e) => {
            const slider = e.target.closest('.ant-slider');
            if (slider) {
              // 移除自定义类名
              slider.classList.remove('mark-hovered');
            }
          });
        });
        
        // 使用已保存的主题色而不是获取当前CSS变量
        const currentThemeColor = savedThemeColor;
        
        // 添加自定义样式
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          .ant-slider.mark-hovered .ant-slider-handle,
          .ant-slider.mark-hovered:hover .ant-slider-handle {
            border-color: ${currentThemeColor} !important;
            box-shadow: none !important;
            background-color: ${currentThemeColor} !important;
          }
          /* 确保轨道(track)使用主题颜色 */
          .ant-slider-track,
          .ant-slider.mark-hovered .ant-slider-track,
          .ant-slider.mark-hovered:hover .ant-slider-track {
            background-color: ${currentThemeColor} !important;
          }
          /* 移除所有滑块状态下的高光 */
          .ant-slider .ant-slider-handle,
          .ant-slider .ant-slider-handle:focus,
          .ant-slider:hover .ant-slider-handle,
          .ant-slider .ant-slider-handle:active,
          .ant-slider .ant-slider-handle-click-focused,
          .ant-slider .ant-slider-handle-dragging {
            box-shadow: none !important;
          }
          /* 设置所有交互状态下滑轨变色 */
          .ant-slider:hover .ant-slider-track,
          .ant-slider-track:active,
          .ant-slider:active .ant-slider-track {
            background-color: ${currentThemeColor} !important;
          }
          /* 悬停时保持滑轨底色不变 */
          .ant-slider:hover .ant-slider-rail {
            background-color: #f0f0f0 !important;
          }
          /* 标记文字悬停时的样式 */
          .ant-slider-mark-text:hover {
            cursor: pointer;
            font-weight: bold;
          }
          /* 确保滑块悬停时使用主题色 */
          .ant-slider-handle:hover,
          .ant-slider:hover .ant-slider-handle,
          .ant-slider .ant-slider-handle:hover,
          .ant-slider .ant-slider-handle.ant-tooltip-open {
            border-color: ${currentThemeColor} !important;
            background-color: ${currentThemeColor} !important;
            box-shadow: none !important;
          }
          /* 极高优先级选择器，强制覆盖所有样式 */
          html body .ant-slider-handle:hover {
            border-color: ${currentThemeColor} !important;
            background-color: ${currentThemeColor} !important;
            box-shadow: none !important;
          }
          /* 确保点(dot)的激活状态使用主题色 */
          .ant-slider-dot-active {
            border-color: ${currentThemeColor} !important;
          }
          /* 当鼠标悬停在标记文字上时，保持主题色 */
          .ant-slider-mark-text:hover ~ .ant-slider-handle,
          .ant-slider-mark-text:hover ~ .ant-slider-track {
            border-color: ${currentThemeColor} !important;
            background-color: ${currentThemeColor} !important;
            box-shadow: none !important;
          }
          
          /* 下拉菜单样式 */
          .ant-select-dropdown .ant-select-item-option-selected {
            background-color: ${currentThemeColor}10 !important;
          }
          .ant-select-dropdown .ant-select-item-option-active {
            background-color: ${currentThemeColor}20 !important;
          }
          .ant-select-dropdown .ant-select-item-option-selected .ant-select-item-option-content {
            color: ${currentThemeColor} !important;
            font-weight: bold !important;
          }
          .ant-select-dropdown .ant-select-item-option-active .ant-select-item-option-content {
            color: ${currentThemeColor} !important;
          }
          .ant-select:hover .ant-select-selector,
          .ant-select-focused .ant-select-selector,
          .ant-select-selector:hover,
          .ant-select-selector:focus {
            border-color: ${currentThemeColor} !important;
          }
          .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
            border-color: ${currentThemeColor} !important;
            box-shadow: 0 0 0 2px ${currentThemeColor}20 !important;
          }
        `;
        document.head.appendChild(styleElement);
        
        return () => {
          // 清理时移除添加的样式
          if (styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
          }
        };
      }, 100);
    };
    
    const cleanup = fixSliderMarkHover();
    return cleanup;
  }, [visible]);

  if (!visible) return null;
  
  return (
    <div className={styles.settingsDrawer}>
      {contextHolder}
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
              style={{ borderColor: savedThemeColor, color: savedThemeColor }}
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
            <Spin indicator={<LoadingOutlined style={{ fontSize: 16, marginRight: 8, color: savedThemeColor }} />} />
            <span style={{ color: savedThemeColor }}>正在验证API密钥...</span>
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
            <Select 
              placeholder="选择模型" 
              onChange={(value) => setModel(value)}
              dropdownStyle={{ 
                borderRadius: '4px',
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
              }}
              style={{
                borderColor: savedThemeColor
              }}
            >
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
              0: { label: '精确' },
              0.5: { label: '平衡' },
              1: { label: '创意' }
            }}
            onChange={handleTemperatureChange}
            value={temperature}
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
                style={{ backgroundColor: savedThemeColor, borderColor: savedThemeColor }}
              >
                保存
              </Button>
              <Button 
                onClick={handleCancel}
                style={{ borderColor: savedThemeColor, color: savedThemeColor }}
              >
                取消
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
} 