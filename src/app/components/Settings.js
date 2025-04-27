import { useState, useEffect } from 'react';
import styles from './Settings.module.css';
import { isClient, DEFAULT_API_KEY } from '../utils/storage';

export default function Settings({ visible, onClose, settings, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V2.5');
  const [temperature, setTemperature] = useState(0.7);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(false);
  
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

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入有效的API密钥');
      return;
    }
    
    onSave({
      apiKey: apiKey.trim(),
      model,
      temperature
    });
    onClose();
  };
  
  const toggleApiHelp = () => {
    setShowApiHelp(!showApiHelp);
  };
  
  if (!visible) return null;
  
  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsPanel}>
        <h2>SiliconFlow设置</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="apiKey">SiliconFlow API密钥</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsUsingDefaultKey(e.target.value === DEFAULT_API_KEY);
            }}
            placeholder="输入您的API密钥"
            className={styles.input}
          />
          
          {isUsingDefaultKey && (
            <div className={styles.defaultKeyNotice}>
              <p>您正在使用预设的API密钥。此密钥已预先配置，可直接使用。</p>
              <p>如需使用自己的API密钥，请按照下面的步骤获取并替换。</p>
            </div>
          )}
          
          <div className={styles.helpLink}>
            <button onClick={toggleApiHelp} className={styles.helpButton}>
              {showApiHelp ? '隐藏帮助' : '如何获取API密钥？'}
            </button>
          </div>
          
          {showApiHelp && (
            <div className={styles.apiHelpBox}>
              <h4>获取SiliconFlow API密钥的步骤：</h4>
              <ol>
                <li>打开 <a href="https://cloud.siliconflow.cn" target="_blank" rel="noopener noreferrer">SiliconCloud官网</a> 并注册/登录您的账号</li>
                <li>登录后，点击右上角的头像，选择"账户管理"</li>
                <li>在左侧菜单中选择"API密钥"</li>
                <li>点击"新建"按钮创建新的API密钥</li>
                <li>创建后，复制生成的密钥并粘贴到上面的输入框中</li>
              </ol>
              <p className={styles.apiNote}>注意：新用户注册后会获得免费的测试额度。API密钥需要妥善保管，避免泄露。</p>
              <p className={styles.apiNote}>如果遇到"401错误"，表示API密钥无效或已过期，请重新创建一个新的密钥。</p>
            </div>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="model">选择模型</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={styles.select}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <small>不同模型的能力和响应速度可能有所不同</small>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="temperature">温度 ({temperature})</label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <small>较低的值生成更确定性的回答，较高的值生成更多样化的回答</small>
        </div>
        
        <div className={styles.buttonGroup}>
          <button onClick={onClose} className={styles.cancelButton}>取消</button>
          <button onClick={handleSave} className={styles.saveButton}>保存</button>
        </div>
      </div>
    </div>
  );
} 