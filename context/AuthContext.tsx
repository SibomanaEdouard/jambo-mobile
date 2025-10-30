import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import * as SecureStore from 'expo-secure-store';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  balance: number;
}

interface AuthContextType {
  user: User | null;
  deviceVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string, deviceId: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [deviceVerified, setDeviceVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const userData = await authService.verifyToken();
        setUser(userData.user);
        setDeviceVerified(userData.deviceVerified);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, deviceId: string) => {
    const authData = await authService.login({ email, password, deviceId });
    await SecureStore.setItemAsync('authToken', authData.token);
    setUser(authData.user);
    setDeviceVerified(authData.deviceVerified);
  };

  const register = async (userData: any) => {
    await authService.register(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
    setDeviceVerified(false);
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      deviceVerified,
      isLoading,
      login,
      register,
      logout,
      updateBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};