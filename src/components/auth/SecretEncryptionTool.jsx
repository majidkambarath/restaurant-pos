import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';

// Simple encryption/decryption functions
const encryptSecret = (text, salt = "POS_SYSTEM") => {
  // Convert text and salt to arrays of character codes
  const textChars = text.split('').map(char => char.charCodeAt(0));
  const saltChars = salt.split('').map(char => char.charCodeAt(0));
  
  // XOR each character of the text with a character from the salt (cycling through salt if needed)
  const encrypted = textChars.map((charCode, index) => {
    const saltChar = saltChars[index % saltChars.length];
    return (charCode ^ saltChar).toString(16).padStart(2, '0'); // XOR and convert to hex
  });
  
  return encrypted.join(''); // Join the hex values
};

const decryptSecret = (encrypted, salt = "POS_SYSTEM") => {
  try {
    // Convert salt to array of character codes
    const saltChars = salt.split('').map(char => char.charCodeAt(0));
    
    // Split the encrypted string into pairs of hex characters
    const hexPairs = [];
    for (let i = 0; i < encrypted.length; i += 2) {
      if (i + 1 < encrypted.length) {
        hexPairs.push(encrypted.substring(i, i + 2));
      }
    }
    
    // Convert hex pairs to numbers and XOR with salt
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

  // Update encrypted text whenever secret text changes
  useEffect(() => {
    if (secretText) {
      setEncryptedText(encryptSecret(secretText));
    } else {
      setEncryptedText('');
    }
  }, [secretText]);

  // Copy encrypted text to clipboard
  const handleCopy = () => {
    if (encryptedText) {
      navigator.clipboard.writeText(encryptedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Test decryption
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Secret Code Encryption Tool</h2>
      
      {/* Toggle between generator and tester */}
      <div className="flex mb-4 border-b">
        <button 
          className={`py-2 px-4 font-medium ${showGenerator ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setShowGenerator(true)}
        >
          Generate Encrypted Code
        </button>
        <button 
          className={`py-2 px-4 font-medium ${!showGenerator ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setShowGenerator(false)}
        >
          Test Decryption
        </button>
      </div>
      
      {showGenerator ? (
        <>
          {/* Secret text input */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Enter Secret Code
            </label>
            <input
              type="text"
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Enter your secret code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Encrypted output */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Encrypted Code for .env File
            </label>
            <div className="flex">
              <input
                type="text"
                value={encryptedText}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                placeholder="Encrypted code will appear here"
              />
              <button
                onClick={handleCopy}
                className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none"
                disabled={!encryptedText}
              >
                <Copy size={16} />
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-1">Copied to clipboard!</p>
            )}
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4 rounded">
            <p className="text-sm text-blue-700">
              1. Enter your desired secret code above<br />
              2. Copy the encrypted value<br />
              3. Add it to your .env file as:<br />
              <code className="bg-blue-100 px-1 rounded">VITE_SECRET_CODE="{encryptedText || '[your-encrypted-code]'}"</code>
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Test decryption */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Test Encrypted Code
            </label>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Paste encrypted code to test"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleTestDecryption}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none mb-4 w-full"
          >
            Test Decryption
          </button>
          
          {testResult.message && (
            <div className={`p-3 rounded mt-2 ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testResult.message}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SecretEncryptionTool;