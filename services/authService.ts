import api from './api';

export const authService = {
  login: async (credentials: { email: string; password: string; deviceId: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  checkDeviceStatus: async () => {
    const response = await api.get('/auth/device-status');
    return response.data;
  },
};