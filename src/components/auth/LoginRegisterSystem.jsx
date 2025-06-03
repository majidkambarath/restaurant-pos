import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../../api/axios';

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

const LoginRegisterSystem = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    restaurantName: "",
    terminalName: "",
    baseUrl: "",
    secretCode: "",
  });

  // Check if user is already logged in
  useEffect(() => {
    const terminalName = localStorage.getItem("terminalName");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    if (terminalName && isLoggedIn) {
      navigate("/pos");
    }
  }, [navigate]);

  // Handle input changes
  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submissions
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if terminal name exists in local storage
      const terminalName = localStorage.getItem("terminalName");
      
      if (!terminalName) {
        setError("No terminal registered for this device. Please register first.");
        
        // Set a timeout to switch to register tab after a delay (10 seconds = 10000ms instead of 3 minutes)
        setTimeout(() => {
          setIsLogin(false); // Switch to registration tab
          setError(null); // Clear error message
        }, 10000); // 10 seconds
        
        return;
      }
      
    
      // Make API call for login authentication with validated credentials
      const response = await axios.post('/login', {
        username: loginForm.username,
        password: loginForm.password,
        terminalName: terminalName
      });
      
      // Check if the login was successful
      if (response.data.success) {
        setSuccess(`Login successful! Logging in to terminal: ${terminalName}`);
        
        // Store login info and user data
        localStorage.setItem("userId", response.data.data.userId);
        localStorage.setItem("userName", response.data.data.userName);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("lastLoginTime", new Date().toISOString());
        
        // Redirect to POS system after short delay
        setTimeout(() => {
          navigate("/pos");
        }, 1500);
      } else {
        throw new Error(response.data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to log in. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!registerForm.restaurantName || !registerForm.terminalName  || !registerForm.secretCode) {
        throw new Error("All fields are required");
      }

      // // Validate baseUrl format
      // try {
      //   new URL(registerForm.baseUrl);
      // } catch (urlError) {
      //   throw new Error("Please enter a valid URL for the base URL");
      // }

      // Get the encrypted secret code from environment variables
      const encryptedSecretCode = import.meta.env.VITE_SECRET_CODE;
      
      // Decrypt the secret code to compare with user's input
      const decryptedSecretCode = decryptSecret(encryptedSecretCode);
      
      // Check if the entered secret code matches the decrypted one
      if (registerForm.secretCode !== decryptedSecretCode) {
        throw new Error("Invalid secret code. Registration failed.");
      }
      
      // Store registration information
      const registrationTime = new Date().toISOString();
      localStorage.setItem("terminalName", registerForm.terminalName);
      localStorage.setItem("restaurantName", registerForm.restaurantName);
      localStorage.setItem("baseUrl", registerForm.baseUrl);
      localStorage.setItem("registrationTime", registrationTime);
      
      setSuccess("Registration successful! Please login to continue.");
      
      // Switch to login tab after registration
      setTimeout(() => {
        setIsLogin(true); // Switch to login tab
        setSuccess(null); // Clear success message
        setRegisterForm({
          restaurantName: "",
          terminalName: "",
          baseUrl: "",
          secretCode: "",
        });
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || err.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Logo and Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-white p-2 rounded-full shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-blue-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">POS</h1>
            <p className="text-blue-100 text-sm">Your restaurant management solution</p>
          </div>
          
          {/* Toggle Buttons */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 text-center font-medium border-b-2 ${
                isLogin ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
              } hover:text-blue-600 transition-colors`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-4 text-center font-medium border-b-2 ${
                !isLogin ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
              } hover:text-blue-600 transition-colors`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>
          
          {/* Forms */}
          <div className="p-6">
            {isLogin ? (
              <form onSubmit={handleLoginSubmit}>
                <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
                  Welcome Back
                </h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={loginForm.username}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                    />
                    <div 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500 hover:text-gray-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500 hover:text-gray-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Logging in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
                  Register Terminal
                </h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Restaurant Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="restaurantName"
                      placeholder="Enter restaurant name"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={registerForm.restaurantName}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Terminal Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="terminalName"
                      placeholder="Enter terminal name"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={registerForm.terminalName}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Base URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
                        />
                      </svg>
                    </div>
                    <input
                      type="url"
                      name="baseUrl"
                      placeholder="https://api.example.com"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={registerForm.baseUrl}
                      onChange={handleRegisterChange}
                      // required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the API base URL for your server
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Secret Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="secretCode"
                      placeholder="Enter secret code"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={registerForm.secretCode}
                      onChange={handleRegisterChange}
                      required
                    />
                    <div 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500 hover:text-gray-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500 hover:text-gray-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the secret code provided by your administrator
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registering...
                    </div>
                  ) : (
                    "Register"
                  )}
                </button>
              </form>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {/* Success message */}
            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-center text-gray-500 text-xs mt-4">
          &copy; {new Date().getFullYear()} POS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginRegisterSystem;