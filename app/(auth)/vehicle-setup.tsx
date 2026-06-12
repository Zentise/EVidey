import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated,
} from 'react-native';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import type { ColorScheme } from '../../constants/colors';
import type { Vehicle, VehicleType, ConnectorType } from '../../types';

const VEHICLE_TYPES: { label: string; value: VehicleType; emoji: string }[] = [
  { label: 'Car', value: 'car', emoji: '🚗' },
  { label: '2-Wheeler', value: 'two_wheeler', emoji: '🛵' },
];

const CONNECTORS: { label: string; value: ConnectorType }[] = [
  { label: 'CCS2', value: 'CCS2' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2 (AC)', value: 'Type2' },
  { label: 'GB/T', value: 'GB/T' },
  { label: 'Type 1', value: 'Type1' },
  { label: 'CCS1', value: 'CCS1' },
];

type VehiclePresetModel = { model: string; year: number; batteryKwh: number; rangeKm: number; connectors: ConnectorType[] };
type VehiclePresetBrand = { make: string; models: VehiclePresetModel[] };

const VEHICLE_PRESETS: Record<VehicleType, VehiclePresetBrand[]> = {
  car: [
    { make: 'Tata', models: [
      { model: 'Nexon EV', year: 2024, batteryKwh: 30.2, rangeKm: 312, connectors: ['CCS2'] },
      { model: 'Nexon EV Long Range', year: 2024, batteryKwh: 40.5, rangeKm: 465, connectors: ['CCS2'] },
      { model: 'Punch EV', year: 2024, batteryKwh: 25, rangeKm: 301, connectors: ['CCS2'] },
      { model: 'Curvv EV', year: 2024, batteryKwh: 55, rangeKm: 502, connectors: ['CCS2'] },
      { model: 'Harrier EV', year: 2025, batteryKwh: 60, rangeKm: 500, connectors: ['CCS2'] },
    ]},
    { make: 'MG', models: [
      { model: 'ZS EV', year: 2024, batteryKwh: 50.3, rangeKm: 461, connectors: ['CCS2'] },
      { model: 'Windsor EV', year: 2024, batteryKwh: 38, rangeKm: 331, connectors: ['CCS2'] },
      { model: 'Comet EV', year: 2024, batteryKwh: 17.3, rangeKm: 230, connectors: ['Type2'] },
    ]},
    { make: 'Hyundai', models: [
      { model: 'Creta Electric', year: 2024, batteryKwh: 51.4, rangeKm: 473, connectors: ['CCS2'] },
      { model: 'Ioniq 5', year: 2024, batteryKwh: 72.6, rangeKm: 631, connectors: ['CCS2'] },
    ]},
    { make: 'Kia', models: [
      { model: 'EV6', year: 2024, batteryKwh: 77.4, rangeKm: 708, connectors: ['CCS2'] },
    ]},
    { make: 'BYD', models: [
      { model: 'Atto 3', year: 2024, batteryKwh: 60.5, rangeKm: 521, connectors: ['CCS2'] },
      { model: 'Seal', year: 2024, batteryKwh: 82.5, rangeKm: 650, connectors: ['CCS2'] },
    ]},
    { make: 'Mahindra', models: [
      { model: 'BE 6', year: 2025, batteryKwh: 79, rangeKm: 682, connectors: ['CCS2'] },
      { model: 'XEV 9e', year: 2025, batteryKwh: 79, rangeKm: 656, connectors: ['CCS2'] },
      { model: 'XUV 400', year: 2024, batteryKwh: 39.4, rangeKm: 375, connectors: ['CCS2'] },
    ]},
    { make: 'BMW', models: [
      { model: 'iX', year: 2024, batteryKwh: 111.5, rangeKm: 630, connectors: ['CCS2'] },
      { model: 'i4', year: 2024, batteryKwh: 83.9, rangeKm: 590, connectors: ['CCS2'] },
    ]},
    { make: 'Mercedes', models: [
      { model: 'EQS', year: 2024, batteryKwh: 107.8, rangeKm: 857, connectors: ['CCS2'] },
      { model: 'EQE', year: 2024, batteryKwh: 90.6, rangeKm: 617, connectors: ['CCS2'] },
    ]},
    { make: 'Volvo', models: [
      { model: 'EX40', year: 2024, batteryKwh: 69, rangeKm: 570, connectors: ['CCS2'] },
    ]},
    { make: 'Audi', models: [
      { model: 'Q8 e-tron', year: 2024, batteryKwh: 114, rangeKm: 600, connectors: ['CCS2'] },
    ]},
  ],
  two_wheeler: [
    { make: 'Ola', models: [
      { model: 'S1 Pro', year: 2024, batteryKwh: 3.97, rangeKm: 170, connectors: ['Type2'] },
      { model: 'S1 Air', year: 2024, batteryKwh: 2.5, rangeKm: 101, connectors: ['Type2'] },
    ]},
    { make: 'Ather', models: [
      { model: '450X', year: 2024, batteryKwh: 2.9, rangeKm: 150, connectors: ['Type2'] },
      { model: '450 Apex', year: 2024, batteryKwh: 3.7, rangeKm: 157, connectors: ['Type2'] },
    ]},
    { make: 'TVS', models: [
      { model: 'iQube', year: 2024, batteryKwh: 3.04, rangeKm: 145, connectors: ['Type2'] },
    ]},
    { make: 'Bajaj', models: [
      { model: 'Chetak', year: 2024, batteryKwh: 3.0, rangeKm: 126, connectors: ['Type2'] },
    ]},
    { make: 'Hero', models: [
      { model: 'Vida V1 Pro', year: 2024, batteryKwh: 3.94, rangeKm: 165, connectors: ['Type2'] },
    ]},
    { make: 'Ultraviolette', models: [
      { model: 'F77', year: 2024, batteryKwh: 10.3, rangeKm: 307, connectors: ['CCS2'] },
    ]},
  ],
};

export default function VehicleSetupScreen() {
  const addVehicle = useAuthStore(s => s.addVehicle);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [type, setType] = useState<VehicleType>('car');
  const [nickname, setNickname] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [batteryKwh, setBatteryKwh] = useState('');
  const [rangeKm, setRangeKm] = useState('');
  const [selectedConnectors, setSelectedConnectors] = useState<ConnectorType[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  function toggleConnector(c: ConnectorType) {
    setSelectedConnectors(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
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
    setMake(''); setModel(''); setYear('');
    setBatteryKwh(''); setRangeKm('');
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
    const vehicle: Vehicle = {
      id: Date.now().toString(),
      name: nickname.trim() || `${make} ${model}`,
      make: make.trim(), model: model.trim(),
      year: parseInt(year, 10), type,
      batteryCapacityKwh: parseFloat(batteryKwh),
      realWorldRangeKm: parseFloat(rangeKm),
      connectorTypes: selectedConnectors,
    };
    await addVehicle(vehicle);
    setLoading(false);
    router.replace('/(app)/(tabs)');
  }

  const presetsForType = VEHICLE_PRESETS[type];
  const selectedBrandData = presetsForType.find(b => b.make === selectedBrand);

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 1 of 1</Text>
          </View>
          <Text style={styles.title}>Add your vehicle</Text>
          <Text style={styles.subtitle}>
            We'll use this to plan accurate charging stops
          </Text>
        </View>

        {/* Vehicle type toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vehicle Type</Text>
          <View style={styles.typeRow}>
            {VEHICLE_TYPES.map(vt => (
              <TouchableOpacity
                key={vt.value}
                style={[styles.typeBtn, type === vt.value && styles.typeBtnActive]}
                onPress={() => { setType(vt.value); resetPreset(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.typeEmoji}>{vt.emoji}</Text>
                <Text style={[styles.typeLabel, type === vt.value && styles.typeLabelActive]}>
                  {vt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Select</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandScroll}>
            <View style={styles.brandRow}>
              {presetsForType.map(b => (
                <TouchableOpacity
                  key={b.make}
                  style={[styles.brandChip, selectedBrand === b.make && styles.brandChipActive]}
                  onPress={() => setSelectedBrand(selectedBrand === b.make ? null : b.make)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.brandChipText, selectedBrand === b.make && styles.brandChipTextActive]}>
                    {b.make}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {selectedBrandData && (
            <View style={styles.modelGrid}>
              {selectedBrandData.models.map(m => {
                const isActive = make === selectedBrand && model === m.model;
                return (
                  <TouchableOpacity
                    key={m.model}
                    style={[styles.modelCard, isActive && styles.modelCardActive]}
                    onPress={() => applyPreset(selectedBrand!, m)}
                    activeOpacity={0.8}
                  >
                    {isActive && <Text style={styles.modelCheck}>✓</Text>}
                    <Text style={[styles.modelName, isActive && styles.modelNameActive]} numberOfLines={2}>
                      {m.model}
                    </Text>
                    <Text style={styles.modelSpecs}>{m.batteryKwh} kWh · {m.rangeKm} km</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {make && model && selectedBrand && (
            <View style={styles.selectedBanner}>
              <Text style={styles.selectedBannerText}>✓ {make} {model}</Text>
              <TouchableOpacity onPress={resetPreset}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual fields */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>

          <TextInput style={styles.input} value={nickname} onChangeText={setNickname}
            placeholder="Nickname (e.g. My Nexon)" placeholderTextColor={colors.textMuted} />

          {!selectedBrand && (
            <>
              <TextInput style={styles.input} value={make} onChangeText={setMake}
                placeholder="Make *  (e.g. Tata, MG)" placeholderTextColor={colors.textMuted} />
              <TextInput style={styles.input} value={model} onChangeText={setModel}
                placeholder="Model *  (e.g. Nexon EV)" placeholderTextColor={colors.textMuted} />
            </>
          )}

          <View style={styles.inlineRow}>
            <TextInput style={[styles.input, styles.inputHalf]} value={year} onChangeText={setYear}
              placeholder="Year *" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={[styles.input, styles.inputHalf]} value={batteryKwh} onChangeText={setBatteryKwh}
              placeholder="kWh *" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
          </View>
          <TextInput style={styles.input} value={rangeKm} onChangeText={setRangeKm}
            placeholder="Real-world range (km) *" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        </View>

        {/* Connector types */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Connector Type *</Text>
          <View style={styles.connectorGrid}>
            {CONNECTORS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.connectorChip, selectedConnectors.includes(c.value) && styles.connectorChipActive]}
                onPress={() => toggleConnector(c.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.connectorText, selectedConnectors.includes(c.value) && styles.connectorTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{loading ? 'Saving…' : 'Save & Continue  →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48, gap: 0 },
    header: { marginBottom: 28 },
    stepBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 12,
    },
    stepText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
    },
    typeRow: { flexDirection: 'row', gap: 12 },
    typeBtn: {
      flex: 1, paddingVertical: 16, borderRadius: 16,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', backgroundColor: colors.surface,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    typeBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    typeEmoji: { fontSize: 24, marginBottom: 6 },
    typeLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    typeLabelActive: { color: colors.primary },
    brandScroll: { marginBottom: 12 },
    brandRow: { flexDirection: 'row', gap: 8 },
    brandChip: {
      paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    },
    brandChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    brandChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    brandChipTextActive: { color: colors.primary },
    modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    modelCard: {
      width: '47%', padding: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    modelCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    modelCheck: { fontSize: 10, color: colors.primary, fontWeight: '700', marginBottom: 2 },
    modelName: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 },
    modelNameActive: { color: colors.primary },
    modelSpecs: { fontSize: 11, color: colors.textSecondary },
    selectedBanner: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.primaryLight, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 10,
      borderWidth: 1, borderColor: colors.primary + '44',
    },
    selectedBannerText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    clearText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
      color: colors.text, fontSize: 15, marginBottom: 10,
    },
    inlineRow: { flexDirection: 'row', gap: 10 },
    inputHalf: { flex: 1 },
    connectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    connectorChip: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    },
    connectorChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    connectorText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    connectorTextActive: { color: colors.primary },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 16,
      paddingVertical: 18, alignItems: 'center', marginTop: 8,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
    },
    saveBtnDisabled: { opacity: 0.55 },
    saveBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  });
}
