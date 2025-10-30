import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { transactionService, Transaction } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardScreen = ({ navigation }: any) => {
  const { user, updateBalance, logout } = useAuth();
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  const loadTransactionHistory = async () => {
    try {
      const history = await transactionService.getHistory(1, 5);
      setTransactions(history.transactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactionHistory();
    setRefreshing(false);
  };

  const handleTransaction = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (transactionType === 'deposit') {
        response = await transactionService.deposit(transactionAmount, description);
      } else {
        response = await transactionService.withdraw(transactionAmount, description);
      }

      updateBalance(response.transaction.balanceAfter);
      Alert.alert('Success', response.message);
      setAmount('');
      setDescription('');
      loadTransactionHistory();
    } catch (error: any) {
      Alert.alert('Transaction Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const lowBalance = user && user.balance < 1000;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credit Jambo</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {lowBalance && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color="#d97706" />
          <Text style={styles.warningText}>
            Your balance is low. Please consider making a deposit.
          </Text>
        </View>
      )}

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(user?.balance || 0)}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      {/* Transaction Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Make a {transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
        </Text>

        <View style={styles.transactionTypeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionType === 'deposit' && styles.typeButtonActive,
            ]}
            onPress={() => setTransactionType('deposit')}
          >
            <Ionicons
              name="add"
              size={20}
              color={transactionType === 'deposit' ? '#2563eb' : '#6b7280'}
            />
            <Text
              style={[
                styles.typeButtonText,
                transactionType === 'deposit' && styles.typeButtonTextActive,
              ]}
            >
              Deposit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionType === 'withdraw' && styles.typeButtonActive,
            ]}
            onPress={() => setTransactionType('withdraw')}
          >
            <Ionicons
              name="remove"
              size={20}
              color={transactionType === 'withdraw' ? '#2563eb' : '#6b7280'}
            />
            <Text
              style={[
                styles.typeButtonText,
                transactionType === 'withdraw' && styles.typeButtonTextActive,
              ]}
            >
              Withdraw
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Amount (RWF)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.transactionButton, loading && styles.disabledButton]}
          onPress={handleTransaction}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size="small" color="#fff" />
          ) : (
            <Text style={styles.transactionButtonText}>
              {transactionType === 'deposit' ? 'Deposit' : 'Withdraw'} Funds
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <View style={styles.transactionHeader}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Ionicons name="time-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {historyLoading ? (
          <LoadingSpinner />
        ) : transactions.length === 0 ? (
          <Text style={styles.noTransactions}>No transactions yet</Text>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View
                  style={[
                    styles.transactionIcon,
                    transaction.type === 'deposit'
                      ? styles.depositIcon
                      : styles.withdrawIcon,
                  ]}
                >
                  <Ionicons
                    name={transaction.type === 'deposit' ? 'add' : 'remove'}
                    size={16}
                    color="#fff"
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionAmount}>
                <Text
                  style={[
                    styles.amountText,
                    transaction.type === 'deposit'
                      ? styles.depositAmount
                      : styles.withdrawAmount,
                  ]}
                >
                  {transaction.type === 'deposit' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.balanceText}>
                  Bal: {formatCurrency(transaction.balanceAfter)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    padding: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    margin: 20,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    color: '#d97706',
    fontSize: 14,
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  typeButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    marginLeft: 8,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#2563eb',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  transactionButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  transactionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noTransactions: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  depositIcon: {
    backgroundColor: '#10b981',
  },
  withdrawIcon: {
    backgroundColor: '#ef4444',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  depositAmount: {
    color: '#10b981',
  },
  withdrawAmount: {
    color: '#ef4444',
  },
  balanceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default DashboardScreen;