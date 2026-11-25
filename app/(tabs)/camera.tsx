import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTable, insertDeleteTotals, insertTotal } from '@/database/SQLite';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');
  const isDark = useColorScheme() === 'dark';
  const cameraRef = useRef<any>(null);
  const isScanningRef = useRef(false);
  const lastScannedAtRef = useRef(0);

  if (!permission) {
    return <View style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: isDark ? '#151718' : '#fff' }]}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#11181C' }]}>Camera Access Needed</Text>
        <Text style={[styles.message, { color: isDark ? '#9BA1A6' : '#687076' }]}> 
          Allow camera access to scan barcodes and QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const normalizeNumber = (value: string) => {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

    return value
      .trim()
      .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
      .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, (digit) => String(persianDigits.indexOf(digit)))
      .replace(/[٫٬]/g, '.')
      .replace(/\s/g, '');
  };

  const handleBarcodeScanned = (data: string) => {
    if (!isScanningRef.current) {
      return;
    }

    const normalizedData = normalizeNumber(data);

    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalizedData)) {
      return;
    }

    const now = Date.now();
    if (now - lastScannedAtRef.current < 800) {
      return;
    }

    lastScannedAtRef.current = now;
    setScannedItems((previous) => [...previous, normalizedData]);
  };

  const startScanning = () => {
    isScanningRef.current = true;
    lastScannedAtRef.current = 0;
    setIsScanning(true);
  };

  const stopScanning = () => {
    isScanningRef.current = false;
    setIsScanning(false);
  };

  const endSession = () => {
    stopScanning();
    setSessionEnded(true);
  };

  const total = scannedItems.reduce((sum, item) => sum + Number(item), 0);

  const finishSession = () => {
    setScannedItems([]);
    setSessionEnded(false);
  };

  const saveResult = async () => {
    const name = saveName.trim();
    if (!name) {
      Alert.alert('Missing Name', 'Please enter a name for this result');
      return;
    }

    try {
      await createTable();
      await insertTotal(name, total, scannedItems.length, new Date().toLocaleString());
      setSaveModalVisible(false);
      setSaveName('');
      finishSession();
      Alert.alert('Success', 'Result saved successfully!');
    } catch (error) {
      console.error('Error saving scan result:', error);
      Alert.alert('Error', 'Failed to save result. Please try again.');
    }
  };

  const deleteResult = () => {
    Alert.alert(
      'Delete Result',
      'Are you sure you want to delete this result? It will be recorded in deleted results.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await createTable();
              await insertDeleteTotals(total, scannedItems.length, new Date().toLocaleString());
              finishSession();
              Alert.alert('Success', 'Result moved to deleted results.');
            } catch (error) {
              console.error('Error deleting scan result:', error);
              Alert.alert('Error', 'Failed to delete result. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        active={isScanning}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'pdf417', 'datamatrix'],
        }}
        onBarcodeScanned={isScanning ? (result) => handleBarcodeScanned(result.data) : undefined}
      />

      {scannedItems.length === 0 && isScanning ? (
        <>
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>Align barcodes inside the frame</Text>
          </View>
          <TouchableOpacity
            style={styles.stopScanButton}
            onPress={stopScanning}
          >
            <Text style={styles.buttonText}>Stop Scan</Text>
          </TouchableOpacity>
        </>
      ) : scannedItems.length > 0 ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Scanned Results</Text>
          <Text style={styles.totalText}>
            Total: {total.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({scannedItems.length} readings)
          </Text>
          <FlatList
            data={scannedItems.slice().reverse()}
            keyExtractor={(_, index) => `${scannedItems.length - index}`}
            renderItem={({ item, index }) => (
              <View style={styles.resultItem}>
                <Text style={styles.resultText} numberOfLines={1}>
                  #{scannedItems.length - index}: {item}
                </Text>
                <View style={styles.resultButtons}>
                </View>
              </View>
            )}
            style={styles.resultsList}
            showsVerticalScrollIndicator
          />
          <View style={styles.sessionButtons}>
            {sessionEnded ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.scanAgainButton]}
                  onPress={() => setSaveModalVisible(true)}
                >
                  <Text style={styles.buttonText}>Save Result</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.stopButton]}
                  onPress={deleteResult}
                >
                  <Text style={styles.buttonText}>Delete Result</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {isScanning ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.stopButton]}
                    onPress={stopScanning}
                  >
                    <Text style={styles.buttonText}>Stop Scan</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.scanAgainButton]}
                    onPress={startScanning}
                  >
                    <Text style={styles.buttonText}>Start Scan</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={endSession}
                >
                  <Text style={styles.buttonText}>End</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ) : null}

      {scannedItems.length === 0 && !isScanning ? (
        <TouchableOpacity
          style={styles.startScanButton}
          onPress={startScanning}
        >
          <Text style={styles.buttonText}>Start Scan</Text>
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Save Result</Text>
            <Text style={styles.modalSubtitle}>
              Total: {total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {'\n'}Readings: {scannedItems.length}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter a name for this result"
              value={saveName}
              onChangeText={setSaveName}
              maxLength={50}
              autoFocus
            />
            <View style={styles.sessionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => {
                  setSaveModalVisible(false);
                  setSaveName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.scanAgainButton]}
                onPress={saveResult}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  message: { textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  startScanButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stopScanButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: 80 }],
  },
  scanFrame: {
    width: '72%',
    height: 220,
    borderWidth: 3,
    borderColor: '#34C759',
    borderRadius: 16,
  },
  scanText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.65)',
    overflow: 'hidden',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  resultCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 18,
  },
  resultLabel: { color: '#687076', fontSize: 12, textTransform: 'uppercase', marginBottom: 6 },
  totalText: { color: '#11181C', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  resultsList: { maxHeight: 150 },
  resultItem: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultText: { color: '#11181C', fontSize: 15, fontWeight: '500' },
  resultButtons: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 12 },
  sessionButtons: { flexDirection: 'row', gap: 10 },
  openButton: { backgroundColor: '#007AFF' },
  scanAgainButton: { backgroundColor: '#34C759' },
  stopButton: { backgroundColor: '#FF3B30' },
  secondaryButton: { backgroundColor: '#687076' },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    color: '#11181C',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#687076',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
});
