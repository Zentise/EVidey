import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import type { Vehicle, VehicleType, ConnectorType } from '../../types';

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
  { label: 'Car', value: 'car' },
  { label: '2-Wheeler', value: 'two_wheeler' },
];

const CONNECTORS: { label: string; value: ConnectorType }[] = [
  { label: 'CCS2', value: 'CCS2' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2 (AC)', value: 'Type2' },
  { label: 'GB/T', value: 'GB/T' },
  { label: 'Type 1', value: 'Type1' },
  { label: 'CCS1', value: 'CCS1' },
];

export default function VehicleSetupScreen() {
  const addVehicle = useAuthStore((s) => s.addVehicle);

  const [type, setType] = useState<VehicleType>('car');
  const [nickname, setNickname] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [batteryKwh, setBatteryKwh] = useState('');
  const [rangeKm, setRangeKm] = useState('');
  const [selectedConnectors, setSelectedConnectors] = useState<ConnectorType[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleConnector(c: ConnectorType) {
    setSelectedConnectors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleSave() {
    if (!make.trim() || !model.trim() || !year.trim() || !batteryKwh || !rangeKm) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }
    if (selectedConnectors.length === 0) {
      Alert.alert('Select connector', 'Please select at least one connector type.');
      return;
    }

    setLoading(true);
    const vehicle: Vehicle = {
      id: Date.now().toString(),
      name: nickname.trim() || `${make} ${model}`,
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      type,
      batteryCapacityKwh: parseFloat(batteryKwh),
      realWorldRangeKm: parseFloat(rangeKm),
      connectorTypes: selectedConnectors,
    };

    await addVehicle(vehicle);
    setLoading(false);
    router.replace('/(app)/(tabs)');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add your vehicle</Text>
      <Text style={styles.subtitle}>
        This helps us plan accurate charging stops for your trips.
      </Text>

      {/* Vehicle type toggle */}
      <Text style={styles.label}>Vehicle Type</Text>
      <View style={styles.toggleRow}>
        {VEHICLE_TYPES.map((vt) => (
          <TouchableOpacity
            key={vt.value}
            style={[styles.toggleBtn, type === vt.value && styles.toggleBtnActive]}
            onPress={() => setType(vt.value)}
          >
            <Text
              style={[
                styles.toggleText,
                type === vt.value && styles.toggleTextActive,
              ]}
            >
              {vt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Nickname (optional)</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="e.g. My Tata Nexon"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Make *</Text>
      <TextInput
        style={styles.input}
        value={make}
        onChangeText={setMake}
        placeholder="e.g. Tata, MG, BYD"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Model *</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder="e.g. Nexon EV, ZS EV"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Year *</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        placeholder="e.g. 2024"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Battery Capacity (kWh) *</Text>
      <TextInput
        style={styles.input}
        value={batteryKwh}
        onChangeText={setBatteryKwh}
        placeholder="e.g. 40.5"
        placeholderTextColor={Colors.textMuted}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Real-World Range (km) *</Text>
      <TextInput
        style={styles.input}
        value={rangeKm}
        onChangeText={setRangeKm}
        placeholder="e.g. 300"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Connector Types *</Text>
      <View style={styles.connectorGrid}>
        {CONNECTORS.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[
              styles.connectorBtn,
              selectedConnectors.includes(c.value) && styles.connectorBtnActive,
            ]}
            onPress={() => toggleConnector(c.value)}
          >
            <Text
              style={[
                styles.connectorText,
                selectedConnectors.includes(c.value) && styles.connectorTextActive,
              ]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save Vehicle & Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  toggleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}22`,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  connectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  connectorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  connectorBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}22`,
  },
  connectorText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  connectorTextActive: {
    color: Colors.primary,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#0F1923',
    fontWeight: '700',
    fontSize: 16,
  },
});
