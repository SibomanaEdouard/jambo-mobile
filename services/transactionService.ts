import api from './api';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export const transactionService = {
  deposit: async (amount: number, description: string) => {
    const response = await api.post('/transactions/deposit', { amount, description });
    return response.data;
  },

  withdraw: async (amount: number, description: string) => {
    const response = await api.post('/transactions/withdraw', { amount, description });
    return response.data;
  },

  getHistory: async (page: number = 1, limit: number = 10): Promise<TransactionHistory> => {
    const response = await api.get(`/transactions/history?page=${page}&limit=${limit}`);
    return response.data;
  },
};