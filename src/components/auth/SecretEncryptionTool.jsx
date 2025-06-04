import React, { useState, useEffect } from 'react';
import { Copy, Shield, Eye, EyeOff, Sparkles, Lock, CheckCircle, XCircle } from 'lucide-react';

// Simple encryption/decryption functions
const encryptSecret = (text, salt = "POS_SYSTEM") => {
  const textChars = text.split('').map(char => char.charCodeAt(0));
  const saltChars = salt.split('').map(char => char.charCodeAt(0));
  
  const encrypted = textChars.map((charCode, index) => {
    const saltChar = saltChars[index % saltChars.length];
    return (charCode ^ saltChar).toString(16).padStart(2, '0');
  });
  
  return encrypted.join('');
};

const decryptSecret = (encrypted, salt = "POS_SYSTEM") => {
  try {
    const saltChars = salt.split('').map(char => char.charCodeAt(0));
    
    const hexPairs = [];
    for (let i = 0; i < encrypted.length; i += 2) {
      if (i + 1 < encrypted.length) {
        hexPairs.push(encrypted.substring(i, i + 2));
      }
    }
    
    const decrypted = hexPairs.map((hex, index) => {
      const charCode = parseInt(hex, 16);
      const saltChar = saltChars[index % saltChars.length];
      return String.fromCharCode(charCode ^ saltChar);
    });
    
    return decrypted.join('');
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
};

const SecretEncryptionTool = () => {
  const [secretText, setSecretText] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showGenerator, setShowGenerator] = useState(true);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState({ success: false, message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (secretText) {
      setEncryptedText(encryptSecret(secretText));
    } else {
      setEncryptedText('');
    }
  }, [secretText]);

  const handleCopy = () => {
    if (encryptedText) {
      navigator.clipboard.writeText(encryptedText);
      setCopied(true);
      setIsAnimating(true);
      setTimeout(() => {
        setCopied(false);
        setIsAnimating(false);
      }, 2000);
    }
  };

  const handleTestDecryption = () => {
    if (!testInput) {
      setTestResult({ success: false, message: 'Please enter an encrypted code to test' });
      return;
    }

    try {
      const decrypted = decryptSecret(testInput);
      setTestResult({ 
        success: true, 
        message: `Decrypted value: "${decrypted}". This is what will be compared with your .env variable.` 
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Invalid encrypted code format' });
    }
  };

  const switchMode = (mode) => {
    setShowGenerator(mode);
    setTestResult({ success: false, message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Main container with glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-blue-200/50 p-8 transition-all duration-500 hover:bg-white/90">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2 flex items-center justify-center gap-2">
              Secret Encryption Tool
              <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            </h1>
            <p className="text-blue-700 text-sm">Secure your sensitive data with style</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex mb-8 bg-blue-50 rounded-2xl p-1 backdrop-blur-sm border border-blue-100">
            <button 
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                showGenerator 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
              }`}
              onClick={() => switchMode(true)}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Generate
            </button>
            <button 
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                !showGenerator 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
              }`}
              onClick={() => switchMode(false)}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Test
            </button>
          </div>

          {showGenerator ? (
            <div className="space-y-6">
              {/* Secret input */}
              <div className="group">
                <label className="block text-blue-800 text-sm font-medium mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Enter Secret Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={secretText}
                    onChange={(e) => setSecretText(e.target.value)}
                    placeholder="Enter your secret code"
                    className="w-full px-4 py-4 bg-white/70 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 placeholder-blue-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Encrypted output */}
              <div className="group">
                <label className="block text-blue-800 text-sm font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Encrypted Code for .env File
                </label>
                <div className="flex rounded-2xl overflow-hidden bg-white/70 border border-blue-200 backdrop-blur-sm">
                  <input
                    type="text"
                    value={encryptedText}
                    readOnly
                    className="flex-1 px-4 py-4 bg-transparent text-blue-900 placeholder-blue-400 focus:outline-none"
                    placeholder="Encrypted code will appear here"
                  />
                  <button
                    onClick={handleCopy}
                    disabled={!encryptedText}
                    className={`px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 ${
                      isAnimating ? 'animate-pulse' : ''
                    }`}
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-blue-800 font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  How to Use
                </h3>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>1. Enter your desired secret code above</p>
                  <p>2. Copy the encrypted value</p>
                  <p>3. Add it to your .env file as:</p>
                  <div className="bg-blue-900 rounded-xl p-3 mt-3 font-mono text-xs">
                    <code className="text-green-400">
                      VITE_SECRET_CODE="{encryptedText || '[your-encrypted-code]'}"
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Test input */}
              <div className="group">
                <label className="block text-blue-800 text-sm font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Test Encrypted Code
                </label>
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Paste encrypted code to test"
                  className="w-full px-4 py-4 bg-white/70 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 placeholder-blue-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
                />
              </div>

              <button
                onClick={handleTestDecryption}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-2xl font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Test Decryption
              </button>

              {testResult.message && (
                <div className={`p-4 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                  testResult.success 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-white rounded-full animate-bounce delay-1000 opacity-80 border-2 border-blue-300"></div>
      </div>
    </div>
  );
};

export default SecretEncryptionTool;