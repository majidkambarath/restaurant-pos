import axios from "axios";

// Function to construct baseURL from localStorage IP config
const getBaseURL = () => {
  const baseURL = localStorage.getItem("baseUrl");

  if (baseURL) {
    return `${baseURL}/api/`;
  }

  // Fallback to default if no IP/port stored
  return "http://localhost:4440/api/";
};
console.log(getBaseURL())
// Create axios instance with dynamic baseURL
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to ensure baseURL is always current
axiosInstance.interceptors.request.use(
  (config) => {
    // Update baseURL on each request in case it changed in localStorage
    config.baseURL = getBaseURL();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

