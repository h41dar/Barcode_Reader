import { clearAllTotals, deleteTotal, getTotals } from '@/database/SQLite';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Total = {
  id: number;
  name: string;
  total: number;
  count: number;
  time: string;
};

// Custom Button Component
const CustomButton = ({ title, onPress, style, textStyle, disabled = false, variant = 'primary' }) => {
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'danger':
        return { backgroundColor: '#FF3B30' };
      case 'secondary':
        return { backgroundColor: '#8E8E93' };
      default:
        return { backgroundColor: '#007AFF' };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.customButton, getVariantStyle(), style, disabled && styles.disabledButton]}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Text style={[styles.customButtonText, textStyle, disabled && styles.disabledText]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated Total Item Component
const TotalItem = ({ item, onDelete, isDark, index }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const theme = {
    cardBackground: isDark ? '#2c2c2c' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    secondaryText: isDark ? '#888888' : '#666666',
    accent: '#007AFF',
    success: '#34C759',
    danger: '#FF3B30',
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString || 'Unknown date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Animated.View 
      style={[
        styles.totalItem,
        { 
          backgroundColor: theme.cardBackground,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.totalItemHeader}>
        <Text style={[styles.totalItemName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <CustomButton
          title="Delete"
          onPress={() => onDelete(item.id)}
          variant="danger"
          style={styles.deleteButton}
          textStyle={styles.deleteButtonText}
        />
      </View>
      
      <View style={styles.totalItemStats}>
        <View style={styles.statRow}>
          <View style={styles.statColumn}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Total</Text>
            <Text style={[styles.statValue, { color: theme.accent }]}>
              {item.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Count</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {item.count}
            </Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Average</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {(item.total / item.count).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: theme.secondaryText }]}>
            Saved on {formatDate(item.time)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Empty State Component
const EmptyState = ({ isDark }) => {
  const theme = {
    text: isDark ? '#ffffff' : '#000000',
    secondaryText: isDark ? '#888888' : '#666666',
  };

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateIcon, { color: theme.secondaryText }]}>📊</Text>
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
        No saved results
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.secondaryText }]}>
        Your saved calculations will appear here
      </Text>
    </View>
  );
};

const SaveScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [totals, setTotals] = useState<Total[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const theme = {
    background: isDark ? '#1a1a1a' : '#f8f9fa',
    cardBackground: isDark ? '#2c2c2c' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    secondaryText: isDark ? '#888888' : '#666666',
    accent: '#007AFF',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
  };

  const fetchTotals = async () => {
    try {
      const rows = await getTotals();
      setTotals(rows);
    } catch (error) {
      console.error("Error fetching totals:", error);
      Alert.alert('Error', 'Failed to load saved results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTotals();
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const load = async () => {
        if (isActive) {
          setLoading(true);
          await fetchTotals();
          
          // Fade in animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleClearAll = () => {
    if (totals.length === 0) {
      Alert.alert('No Data', 'There are no saved results to delete');
      return;
    }

    Alert.alert(
      "Clear All Results",
      `Are you sure you want to delete all ${totals.length} saved results? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive", 
          onPress: async () => {
            try {
              await clearAllTotals();
              await fetchTotals();
              Alert.alert('Success', 'All results have been deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete results');
            }
          } 
        }
      ]
    );
  };

  const handleDeleteOne = (id: number) => {
    const item = totals.find(t => t.id === id);
    Alert.alert(
      "Delete Result",
      `Are you sure you want to delete "${item?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteTotal(id);
              await fetchTotals();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete result');
            }
          } 
        }
      ]
    );
  };

  const totalWeight = totals.reduce((sum, item) => sum + item.total, 0);
  const totalCount = totals.reduce((sum, item) => sum + item.count, 0);
  const averageWeight = totals.length > 0 ? totalWeight / totals.length : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading saved results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Saved Results
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>
              {totals.length} result{totals.length !== 1 ? 's' : ''} saved
            </Text>
          </View>
          <CustomButton
            title="Clear All"
            onPress={handleClearAll}
            variant="danger"
            style={styles.clearAllButton}
            disabled={totals.length === 0}
          />
        </View>

        {/* Summary Stats */}
        {totals.length > 0 && (
          <View style={[styles.summarySection, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                Total Weight
              </Text>
              <Text style={[styles.summaryValue, { color: theme.accent }]}>
                {totalWeight.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                Total Numbers
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {totalCount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                Avg per Result
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {averageWeight.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        )}

        {/* Results List */}
        <View style={styles.listContainer}>
          <FlatList
            data={totals}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <TotalItem
                item={item}
                onDelete={handleDeleteOne}
                isDark={isDark}
                index={index}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 }
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent}
                colors={[theme.accent]}
              />
            }
            ListEmptyComponent={<EmptyState isDark={isDark} />}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  clearAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summarySection: {
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  listContainer: {
    flex: 1,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  totalItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalItemStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statColumn: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  timeText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  customButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SaveScreen;