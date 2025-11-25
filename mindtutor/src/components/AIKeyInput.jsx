import React, { useState } from 'react';
// import { useTheme } from '../contexts/ThemeContext';

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-...',
    validation: (key) => key.startsWith('sk-') && key.length > 20,
    features: ['GPT-4', 'Advanced reasoning', 'Long-form content'],
  },
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    validation: (key) => key.startsWith('sk-ant-') && key.length > 20,
    features: ['Claude', 'Safety-focused', 'Educational content'],
  },
  grok: {
    name: 'Grok (xAI)',
    placeholder: 'xai-...',
    validation: (key) => key.startsWith('xai-') && key.length > 10,
    features: ['Real-time knowledge', 'Humorous responses', 'Fast generation'],
  },
  custom: {
    name: 'Custom/OpenAI-compatible',
    placeholder: 'Your API key...',
    validation: (key) => key.length > 10,
    features: ['Flexible integration', 'Custom models', 'Advanced features'],
  },
};

export default function AIKeyInput({ apiKey, setApiKey }) {
  // const { darkMode } = useTheme();
  const darkMode = false;
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Detect provider from existing key - moved to handleApiKeyChange

  const validateKey = (key, provider) => {
    const validator = AI_PROVIDERS[provider]?.validation;
    return validator ? validator(key) : false;
  };

  const handleSave = async () => {
    setValidationError('');
    setIsValidating(true);

    // Validate the key format
    if (!validateKey(tempKey, selectedProvider)) {
      setValidationError(
        `Invalid ${AI_PROVIDERS[selectedProvider].name} API key format`
      );
      setIsValidating(false);
      return;
    }

    // Optional: Test the key with a simple API call
    if (tempKey) {
      try {
        const isValid = await testApiKey(tempKey, selectedProvider);
        if (!isValid) {
          setValidationError(
            'API key validation failed. Please check your key.'
          );
          setIsValidating(false);
          return;
        }
        setTestResult('success');
      } catch {
        setValidationError('Unable to validate API key. It may still work.');
        setTestResult('warning');
      }
    }

    // Save to localStorage with provider info
    const keyData = {
      key: tempKey,
      provider: selectedProvider,
      lastValidated: new Date().toISOString(),
    };
    localStorage.setItem('mindtutor_apikey', JSON.stringify(keyData));
    setApiKey(tempKey);
    setIsEditing(false);
    setIsValidating(false);
  };

  const testApiKey = async (key, provider) => {
    // Simple test - in a real implementation, you'd make a test API call
    // For now, just validate the format
    return validateKey(key, provider);
  };

  const handleClear = () => {
    localStorage.removeItem('mindtutor_apikey');
    setApiKey('');
    setTempKey('');
    setSelectedProvider('openai');
    setValidationError('');
    setTestResult(null);
    setIsEditing(false);
  };

  const getStoredKeyData = () => {
    try {
      const stored = localStorage.getItem('mindtutor_apikey');
      return stored
        ? JSON.parse(stored)
        : { key: apiKey || '', provider: 'openai' };
    } catch {
      return { key: apiKey || '', provider: 'openai' };
    }
  };

  const keyData = getStoredKeyData();

  return (
    <div className="mt-4">
      {!isEditing ? (
        <div>
          {apiKey ? (
            <div className="text-xs">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                >
                  ✓ {AI_PROVIDERS[keyData.provider]?.name || 'API Key'}{' '}
                  Connected
                </span>
                {testResult === 'success' && (
                  <span className="text-xs text-green-500">✓</span>
                )}
              </div>
              <div className="mb-2">
                <div
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Provider: {AI_PROVIDERS[keyData.provider]?.name || 'Unknown'}
                </div>
                <div
                  className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                >
                  Features:{' '}
                  {AI_PROVIDERS[keyData.provider]?.features
                    ?.slice(0, 2)
                    .join(', ') || 'Enhanced AI'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    darkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={handleClear}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    darkMode
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`text-xs px-3 py-2 rounded w-full transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              + Add API Key (Unlock Enhanced Features)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Provider Selection */}
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              AI Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setValidationError('');
              }}
              className={`w-full text-xs px-2 py-1 border rounded focus:ring-1 transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                <option key={key} value={key}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              API Key
            </label>
            <input
              id="api-key-input"
              name="apiKey"
              type="password"
              value={tempKey}
              onChange={(e) => {
                setTempKey(e.target.value);
                setValidationError('');
              }}
              placeholder={
                AI_PROVIDERS[selectedProvider]?.placeholder ||
                'Enter API key...'
              }
              className={`w-full text-xs px-2 py-1 border rounded focus:ring-1 transition-colors ${
                validationError
                  ? 'border-red-500 focus:ring-red-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400'
                    : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationError && (
              <p className="text-xs text-red-500 mt-1">{validationError}</p>
            )}
          </div>

          {/* Features Preview */}
          <div
            className={`text-xs p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}
          >
            <div
              className={`font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Enhanced Features:
            </div>
            <ul
              className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {AI_PROVIDERS[selectedProvider]?.features?.map(
                (feature, index) => (
                  <li key={index}>• {feature}</li>
                )
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isValidating}
              className={`text-xs px-2 py-1 rounded flex-1 transition-colors disabled:opacity-50 ${
                darkMode
                  ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600'
                  : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400'
              }`}
            >
              {isValidating ? 'Validating...' : 'Save & Test'}
            </button>
            <button
              onClick={() => {
                setTempKey(apiKey);
                setSelectedProvider(keyData.provider);
                setValidationError('');
                setIsEditing(false);
              }}
              className={`text-xs px-2 py-1 rounded flex-1 transition-colors ${
                darkMode
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <div
            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <p className="mb-1">
              💡 <strong>Optional:</strong> API key enables advanced AI features
              like longer lessons and enhanced explanations.
            </p>
            <p>🔒 Your key is stored locally and never sent to our servers.</p>
          </div>
        </div>
      )}
    </div>
  );
}
