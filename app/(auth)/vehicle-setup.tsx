import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import type { ColorScheme } from '../../constants/colors';
import type { Vehicle, VehicleType, ConnectorType } from '../../types';

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
  { label: '🚗  Car', value: 'car' },
  { label: '🛵  2-Wheeler', value: 'two_wheeler' },
];

const CONNECTORS: { label: string; value: ConnectorType }[] = [
  { label: 'CCS2', value: 'CCS2' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2 (AC)', value: 'Type2' },
  { label: 'GB/T', value: 'GB/T' },
  { label: 'Type 1', value: 'Type1' },
  { label: 'CCS1', value: 'CCS1' },
];

type VehiclePresetModel = {
  model: string;
  year: number;
  batteryKwh: number;
  rangeKm: number;
  connectors: ConnectorType[];
};

type VehiclePresetBrand = {
  make: string;
  models: VehiclePresetModel[];
};

const VEHICLE_PRESETS: Record<VehicleType, VehiclePresetBrand[]> = {
  car: [
    {
      make: 'Tata',
      models: [
        { model: 'Nexon EV', year: 2024, batteryKwh: 30.2, rangeKm: 312, connectors: ['CCS2'] },
        { model: 'Nexon EV Long Range', year: 2024, batteryKwh: 40.5, rangeKm: 465, connectors: ['CCS2'] },
        { model: 'Punch EV', year: 2024, batteryKwh: 25, rangeKm: 301, connectors: ['CCS2'] },
        { model: 'Punch EV Long Range', year: 2024, batteryKwh: 35, rangeKm: 421, connectors: ['CCS2'] },
        { model: 'Tigor EV', year: 2024, batteryKwh: 26, rangeKm: 306, connectors: ['CCS2'] },
        { model: 'Curvv EV', year: 2024, batteryKwh: 55, rangeKm: 502, connectors: ['CCS2'] },
        { model: 'Harrier EV', year: 2025, batteryKwh: 60, rangeKm: 500, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'MG',
      models: [
        { model: 'ZS EV', year: 2024, batteryKwh: 50.3, rangeKm: 461, connectors: ['CCS2'] },
        { model: 'Comet EV', year: 2024, batteryKwh: 17.3, rangeKm: 230, connectors: ['Type2'] },
        { model: 'Windsor EV', year: 2024, batteryKwh: 38, rangeKm: 331, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'Hyundai',
      models: [
        { model: 'Creta Electric', year: 2024, batteryKwh: 51.4, rangeKm: 473, connectors: ['CCS2'] },
        { model: 'Ioniq 5', year: 2024, batteryKwh: 72.6, rangeKm: 631, connectors: ['CCS2'] },
        { model: 'Kona Electric', year: 2023, batteryKwh: 39.2, rangeKm: 452, connectors: ['CCS2', 'Type2'] },
      ],
    },
    {
      make: 'Kia',
      models: [
        { model: 'EV6', year: 2024, batteryKwh: 77.4, rangeKm: 708, connectors: ['CCS2'] },
        { model: 'EV9', year: 2024, batteryKwh: 99.8, rangeKm: 561, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'BYD',
      models: [
        { model: 'Atto 3', year: 2024, batteryKwh: 60.5, rangeKm: 521, connectors: ['CCS2'] },
        { model: 'Seal', year: 2024, batteryKwh: 82.5, rangeKm: 650, connectors: ['CCS2'] },
        { model: 'e6', year: 2023, batteryKwh: 71.7, rangeKm: 415, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'Mahindra',
      models: [
        { model: 'BE 6', year: 2025, batteryKwh: 79, rangeKm: 682, connectors: ['CCS2'] },
        { model: 'XEV 9e', year: 2025, batteryKwh: 79, rangeKm: 656, connectors: ['CCS2'] },
        { model: 'XUV 400', year: 2024, batteryKwh: 39.4, rangeKm: 375, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'Volvo',
      models: [
        { model: 'EX40', year: 2024, batteryKwh: 69, rangeKm: 570, connectors: ['CCS2'] },
        { model: 'EX90', year: 2024, batteryKwh: 107, rangeKm: 580, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'BMW',
      models: [
        { model: 'iX', year: 2024, batteryKwh: 111.5, rangeKm: 630, connectors: ['CCS2'] },
        { model: 'i4', year: 2024, batteryKwh: 83.9, rangeKm: 590, connectors: ['CCS2'] },
        { model: 'iX1', year: 2024, batteryKwh: 66.5, rangeKm: 440, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'Mercedes',
      models: [
        { model: 'EQS', year: 2024, batteryKwh: 107.8, rangeKm: 857, connectors: ['CCS2'] },
        { model: 'EQB', year: 2024, batteryKwh: 66.5, rangeKm: 419, connectors: ['CCS2'] },
        { model: 'EQE', year: 2024, batteryKwh: 90.6, rangeKm: 617, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'Audi',
      models: [
        { model: 'e-tron GT', year: 2024, batteryKwh: 93.4, rangeKm: 500, connectors: ['CCS2'] },
        { model: 'Q8 e-tron', year: 2024, batteryKwh: 114, rangeKm: 600, connectors: ['CCS2'] },
      ],
    },
    {
      make: 'Porsche',
      models: [
        { model: 'Taycan', year: 2024, batteryKwh: 93.4, rangeKm: 586, connectors: ['CCS2'] },
      ],
    },
  ],
  two_wheeler: [
    {
      make: 'Ola',
      models: [
        { model: 'S1 Pro', year: 2024, batteryKwh: 3.97, rangeKm: 170, connectors: ['Type2'] },
        { model: 'S1 Air', year: 2024, batteryKwh: 2.5, rangeKm: 101, connectors: ['Type2'] },
        { model: 'S1 X', year: 2024, batteryKwh: 2.0, rangeKm: 90, connectors: ['Type2'] },
      ],
    },
    {
      make: 'Ather',
      models: [
        { model: '450X', year: 2024, batteryKwh: 2.9, rangeKm: 150, connectors: ['Type2'] },
        { model: '450 Apex', year: 2024, batteryKwh: 3.7, rangeKm: 157, connectors: ['Type2'] },
        { model: '450S', year: 2024, batteryKwh: 2.6, rangeKm: 115, connectors: ['Type2'] },
      ],
    },
    {
      make: 'TVS',
      models: [
        { model: 'iQube', year: 2024, batteryKwh: 3.04, rangeKm: 145, connectors: ['Type2'] },
        { model: 'iQube ST', year: 2024, batteryKwh: 4.56, rangeKm: 140, connectors: ['Type2'] },
      ],
    },
    {
      make: 'Bajaj',
      models: [
        { model: 'Chetak', year: 2024, batteryKwh: 3.0, rangeKm: 113, connectors: ['Type2'] },
        { model: 'Chetak Premium', year: 2024, batteryKwh: 3.0, rangeKm: 126, connectors: ['Type2'] },
      ],
    },
    {
      make: 'Hero',
      models: [
        { model: 'Vida V1 Pro', year: 2024, batteryKwh: 3.94, rangeKm: 165, connectors: ['Type2'] },
        { model: 'Vida V2', year: 2024, batteryKwh: 3.3, rangeKm: 135, connectors: ['Type2'] },
      ],
    },
    {
      make: 'Revolt',
      models: [
        { model: 'RV400', year: 2024, batteryKwh: 3.24, rangeKm: 150, connectors: ['Type2'] },
      ],
    },
    {
      make: 'Ultraviolette',
      models: [
        { model: 'F77', year: 2024, batteryKwh: 10.3, rangeKm: 307, connectors: ['CCS2'] },
      ],
    },
  ],
};

export default function VehicleSetupScreen() {
  const addVehicle = useAuthStore((s) => s.addVehicle);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [type, setType] = useState<VehicleType>('car');
  const [nickname, setNickname] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [batteryKwh, setBatteryKwh] = useState('');
  const [rangeKm, setRangeKm] = useState('');
  const [selectedConnectors, setSelectedConnectors] = useState<ConnectorType[]>([]);
  const [batteryHealth, setBatteryHealth] = useState('');   // optional, 0–100%
  const [mileageKm, setMileageKm] = useState('');           // optional, odometer in km
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleConnector(c: ConnectorType) {
    setSelectedConnectors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function applyPreset(brandName: string, preset: VehiclePresetModel) {
    setMake(brandName);
    setModel(preset.model);
    setYear(preset.year.toString());
    setBatteryKwh(preset.batteryKwh.toString());
    setRangeKm(preset.rangeKm.toString());
    setSelectedConnectors(preset.connectors);
  }

  function resetPreset() {
    setSelectedBrand(null);
    setMake('');
    setModel('');
    setYear('');
    setBatteryKwh('');
    setRangeKm('');
    setSelectedConnectors([]);
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
    const healthVal = batteryHealth.trim() ? parseFloat(batteryHealth) : undefined;
    const mileageVal = mileageKm.trim() ? parseFloat(mileageKm) : undefined;
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
      ...(healthVal !== undefined && { batteryHealthPercent: Math.min(100, Math.max(0, healthVal)) }),
      ...(mileageVal !== undefined && { currentMileageKm: mileageVal }),
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

      <Text style={styles.label}>Vehicle Type</Text>
      <View style={styles.toggleRow}>
        {VEHICLE_TYPES.map((vt) => (
          <TouchableOpacity
            key={vt.value}
            style={[styles.toggleBtn, type === vt.value && styles.toggleBtnActive]}
            onPress={() => { setType(vt.value); resetPreset(); }}
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

      {/* Vehicle Preset Picker */}
      <Text style={styles.label}>Quick Select Vehicle</Text>
      <Text style={styles.sectionHint}>Tap a brand to browse models, or scroll to enter manually below.</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.brandScroll}
        contentContainerStyle={styles.brandScrollContent}
      >
        {VEHICLE_PRESETS[type].map((b) => (
          <TouchableOpacity
            key={b.make}
            style={[
              styles.brandChip,
              selectedBrand === b.make && styles.brandChipActive,
            ]}
            onPress={() => setSelectedBrand(selectedBrand === b.make ? null : b.make)}
          >
            <Text
              style={[
                styles.brandChipText,
                selectedBrand === b.make && styles.brandChipTextActive,
              ]}
            >
              {b.make}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedBrand && (
        <View style={styles.modelGrid}>
          {VEHICLE_PRESETS[type]
            .find((b) => b.make === selectedBrand)
            ?.models.map((m) => {
              const isActive = make === selectedBrand && model === m.model;
              return (
                <TouchableOpacity
                  key={m.model}
                  style={[styles.modelCard, isActive && styles.modelCardActive]}
                  onPress={() => applyPreset(selectedBrand, m)}
                >
                  <Text
                    style={[
                      styles.modelCardName,
                      isActive && styles.modelCardNameActive,
                    ]}
                    numberOfLines={2}
                  >
                    {isActive ? '✓ ' : ''}{m.model}
                  </Text>
                  <Text style={styles.modelCardSpecs}>
                    {m.batteryKwh} kWh · {m.rangeKm} km
                  </Text>
                  <Text style={styles.modelCardYear}>{m.year}</Text>
                </TouchableOpacity>
              );
            })}
        </View>
      )}

      {make && model && selectedBrand && (
        <View style={styles.presetSelectedBanner}>
          <Text style={styles.presetSelectedText}>✓ {make} {model} selected</Text>
          <TouchableOpacity onPress={resetPreset}>
            <Text style={styles.presetClearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.label}>Nickname (optional)</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="e.g. My Tata Nexon"
        placeholderTextColor={colors.textMuted}
      />

      {!selectedBrand && (
        <>
          <Text style={styles.label}>Make *</Text>
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder="e.g. Tata, MG, BYD"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="e.g. Nexon EV, ZS EV"
            placeholderTextColor={colors.textMuted}
          />
        </>
      )}

      <Text style={styles.label}>Year *</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        placeholder="e.g. 2024"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Battery Capacity (kWh) *</Text>
      <TextInput
        style={styles.input}
        value={batteryKwh}
        onChangeText={setBatteryKwh}
        placeholder="e.g. 40.5"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Real-World Range (km) *</Text>
      <TextInput
        style={styles.input}
        value={rangeKm}
        onChangeText={setRangeKm}
        placeholder="e.g. 300"
        placeholderTextColor={colors.textMuted}
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

      <Text style={styles.sectionTitle}>🔋 Battery Health (Optional)</Text>
      <Text style={styles.sectionHint}>
        Helps adjust range estimates for your battery's current condition. Check your vehicle's OBD app or manufacturer service.
      </Text>

      <Text style={styles.label}>Battery Health %</Text>
      <TextInput
        style={styles.input}
        value={batteryHealth}
        onChangeText={setBatteryHealth}
        placeholder="e.g. 92  (leave blank if unknown)"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Current Odometer (km)</Text>
      <TextInput
        style={styles.input}
        value={mileageKm}
        onChangeText={setMileageKm}
        placeholder="e.g. 25000  (used if health % not set)"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />

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

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
    },
    toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    toggleBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    toggleBtnActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}22`,
    },
    toggleText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
    toggleTextActive: { color: colors.primary },
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
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    connectorBtnActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}22`,
    },
    connectorText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    connectorTextActive: { color: colors.primary },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: 28,
      marginBottom: 4,
    },
    sectionHint: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 4,
    },
    brandScroll: { marginBottom: 4 },
    brandScrollContent: { paddingRight: 8, gap: 8, flexDirection: 'row' },
    brandChip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    brandChipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}22`,
    },
    brandChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    brandChipTextActive: { color: colors.primary },
    modelGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 8,
    },
    modelCard: {
      width: '47%',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    modelCardActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    modelCardName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    modelCardNameActive: { color: colors.primary },
    modelCardSpecs: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    modelCardYear: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    presetSelectedBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: `${colors.primary}18`,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: `${colors.primary}44`,
      marginBottom: 4,
    },
    presetSelectedText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    presetClearText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 28,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      color: colors.primaryForeground,
      fontWeight: '700',
      fontSize: 16,
    },
  });
}
