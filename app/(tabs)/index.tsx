import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTable, getTotals, insertDeleteTotals, insertTotal } from '../../database/SQLite';

const { width, height } = Dimensions.get('window');

// Custom Button Component
const CustomButton = ({ title, onPress, style, textStyle, disabled = false }) => {
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

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.customButton, style, disabled && styles.disabledButton]}
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

// Number Item Component with Animation
const NumberItem = ({ item, index, totalNumbers, isDark, onRemove }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        onLongPress={() => onRemove(index)}
        style={[
          styles.numberItem,
          { backgroundColor: isDark ? '#2c2c2c' : '#ffffff' }
        ]}
      >
        <View style={styles.numberItemContent}>
          <Text style={[styles.numberIndex, { color: isDark ? '#888' : '#666' }]}>
            #{totalNumbers - index}
          </Text>
          <Text style={[styles.numberValue, { color: isDark ? '#fff' : '#000' }]}>
            {item.toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function App() {
  const [input, setInput] = useState('');
  const [numbers, setNumbers] = useState([]);
  const [savedTotals, setSavedTotals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    createTable();
    fetchTotals();
    
    // Fade in animation on component mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchTotals = () => {
    getTotals((totals) => setSavedTotals(totals));
  };

  const handleAddNumber = () => {
    const num = parseFloat(input.replace(/,/g, ''));
    if (!isNaN(num) && input.trim() !== '') {
      setNumbers(prev => [num, ...prev]);
      setInput('');
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid number');
    }
  };

  const handleRemoveNumber = (index) => {
    Alert.alert(
      'Remove Number',
      'Are you sure you want to remove this number?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setNumbers(prev => prev.filter((_, i) => i !== index));
        }}
      ]
    );
  };

  const handleReset = () => {
    if (numbers.length === 0) {
      Alert.alert('No Data', 'There are no numbers to reset');
      return;
    }

    Alert.alert(
      'Reset Calculator',
      'This will clear all numbers. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          const total = numbers.reduce((sum, val) => sum + val, 0);
          const count = numbers.length;
          const time = new Date().toLocaleString();

          insertDeleteTotals(total, count, time)
          setInput('');
          setNumbers([]);
        }}
      ]
    );
  };

  const handleSaveResult = () => {
    if (numbers.length === 0) {
      Alert.alert('No Data', 'Please add some numbers before saving');
      return;
    }
    setModalVisible(true);
  };

  const handleConfirmSave = async () => {
    if (!saveName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this result');
      return;
    }

    const total = numbers.reduce((sum, val) => sum + val, 0);
    const count = numbers.length;
    const time = new Date().toLocaleString();

    try {
      await insertTotal(saveName.trim(), total, count, time);
      await fetchTotals();
      Alert.alert('Success', 'Result saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save result. Please try again.');
    } finally {
      setModalVisible(false);
      setSaveName('');
      setInput('');
      setNumbers([]);
      Keyboard.dismiss();
    }
  };

  const total = numbers.reduce((sum, val) => sum + val, 0);
  const average = numbers.length > 0 ? total / numbers.length : 0;

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Calculator
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>
            {numbers.length} numbers added
          </Text>
        </View>

        {/* Input Section */}
        <View style={[styles.inputSection, { backgroundColor: theme.cardBackground }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Enter a number"
            placeholderTextColor={theme.secondaryText}
            keyboardType="numeric"
            returnKeyType="done"
            value={input}
            onChangeText={(text) => {
              // Format number with commas as user types
              const cleaned = text.replace(/[^0-9.-]/g, '');
              const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              setInput(formatted);
            }}
            onSubmitEditing={handleAddNumber}
          />
          <CustomButton
            title="Add"
            onPress={handleAddNumber}
            style={[styles.addButton, { backgroundColor: theme.accent }]}
            disabled={!input.trim()}
          />
        </View>

        {/* Statistics Section */}
        {numbers.length > 0 && (
          <View style={[styles.statsSection, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Total</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Average</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {average.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Count</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {numbers.length}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <CustomButton
            title="Save Result"
            onPress={handleSaveResult}
            style={[styles.actionButton, { backgroundColor: theme.success }]}
            disabled={numbers.length === 0}
          />
          <CustomButton
            title="Clear All"
            onPress={handleReset}
            style={[styles.actionButton, { backgroundColor: theme.danger }]}
            disabled={numbers.length === 0}
          />
        </View>

        {/* Numbers List */}
        {numbers.length > 0 ? (
          <View style={styles.listContainer}>
            <Text style={[styles.listHeader, { color: theme.text }]}>
              Numbers ({numbers.length})
            </Text>
            <FlatList
              data={numbers}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item, index }) => (
                <NumberItem
                  item={item}
                  index={index}
                  totalNumbers={numbers.length}
                  isDark={isDark}
                  onRemove={handleRemoveNumber}
                />
              )}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
              No numbers added yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.secondaryText }]}>
              Start by entering a number above
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Enhanced Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Save Result
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.secondaryText }]}>
              Total: {total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { 
                  backgroundColor: isDark ? '#3a3a3a' : '#f5f5f5',
                  color: theme.text,
                  borderColor: theme.secondaryText
                }
              ]}
              placeholder="Enter a name for this result"
              placeholderTextColor={theme.secondaryText}
              value={saveName}
              onChangeText={setSaveName}
              maxLength={50}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setSaveName('');
                }}
                style={[styles.modalButton, { backgroundColor: theme.secondaryText }]}
              />
              <CustomButton
                title="Save"
                onPress={handleConfirmSave}
                style={[styles.modalButton, { backgroundColor: theme.success }]}
                disabled={!saveName.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  inputSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  numberItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  numberItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberIndex: {
    fontSize: 14,
    fontWeight: '500',
  },
  numberValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    padding: 24,
    borderRadius: 16,
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
});