// screens/StatisticsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
// import { getYearlyStats, getMonthlyStats, getCategories, getTransactions } from '../storage/storageService';
import { getYearlyStats, getMonthlyStats } from '@/storage/sqliteService';
import { NavigationParamList, Transaction, MonthData } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineChart, PieChart } from 'react-native-chart-kit';

type StatisticsScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'Statistics'>;
};

interface PieChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [yearlyData, setYearlyData] = useState<MonthData[]>([]);
  const [monthlyExpenseByCategory, setMonthlyExpenseByCategory] = useState<PieChartData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [totalAnnualIncome, setTotalAnnualIncome] = useState(0);
  const [totalAnnualExpense, setTotalAnnualExpense] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);

    // Get yearly statistics
    const yearStats = await getYearlyStats(selectedYear);
    setYearlyData(yearStats);

    // Calculate annual totals
    let annualIncome = 0;
    let annualExpense = 0;
    yearStats.forEach(month => {
      annualIncome += month.income;
      annualExpense += month.expense;
    });

    setTotalAnnualIncome(annualIncome);
    setTotalAnnualExpense(annualExpense);

    // Get current month's expenses by category
    const currentMonth = new Date().getMonth();
    const monthlyStats = await getMonthlyStats(currentMonth, selectedYear);

    // Process expenses by category for pie chart
    const transactions = monthlyStats.transactions.filter(t => t.type === 'expense');
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach(transaction => {
      if (!expensesByCategory[transaction.category]) {
        expensesByCategory[transaction.category] = 0;
      }
      expensesByCategory[transaction.category] += transaction.amount;
    });

    // Convert to pie chart data format
    const pieData = Object.keys(expensesByCategory).map((category, index) => {
      // Generate a color based on index
      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
      return {
        name: category,
        amount: expensesByCategory[category],
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      };
    });

    setMonthlyExpenseByCategory(pieData);
    setLoading(false);
  };

  const changeYear = (increment: number) => {
    setSelectedYear(prevYear => prevYear + increment);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(52, 152, 219, ₹{opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ₹{opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726'
    }
  };

  const getLineChartData = () => {
    return {
      labels: months,
      datasets: [
        {
          data: yearlyData.map(item => item.income),
          color: (opacity = 1) => `rgba(46, 204, 113, ₹{opacity})`,
          strokeWidth: 2
        },
        {
          data: yearlyData.map(item => item.expense),
          color: (opacity = 1) => `rgba(231, 76, 60, ₹{opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Income', 'Expense']
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistics</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.yearSelector}>
              <TouchableOpacity onPress={() => changeYear(-1)}>
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <TouchableOpacity onPress={() => changeYear(1)}>
                <Ionicons name="chevron-forward" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Yearly Overview</Text>
              {yearlyData.length > 0 ? (
                <LineChart
                  data={getLineChartData()}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No data available for {selectedYear}</Text>
                </View>
              )}
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Current Month Expenses by Category</Text>
              {monthlyExpenseByCategory.length > 0 ? (
                <PieChart
                  data={monthlyExpenseByCategory}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No expense data for this month</Text>
                </View>
              )}
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Annual Summary</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Income:</Text>
                <Text style={[styles.summaryValue, { color: '#2ecc71' }]}>
                  ₹{totalAnnualIncome.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Expenses:</Text>
                <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>
                  ₹{totalAnnualExpense.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net Savings:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: totalAnnualIncome - totalAnnualExpense >= 0 ? '#2ecc71' : '#e74c3c' }
                ]}>
                  ₹{(totalAnnualIncome - totalAnnualExpense).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Savings Rate:</Text>
                <Text style={styles.summaryValue}>
                  {totalAnnualIncome > 0
                    ? `₹{(((totalAnnualIncome - totalAnnualExpense) / totalAnnualIncome) * 100).toFixed(1)}%`
                    : '0%'}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default StatisticsScreen;