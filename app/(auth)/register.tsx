import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { firebaseRegister, isFirebaseConfigured, firestoreSaveUser } from '../../services/firebaseService';
import { signInWithGoogle } from '../../services/googleAuthService';
import type { ColorScheme } from '../../constants/colors';
import type { User } from '../../types';

export default function RegisterScreen() {
  const setUser = useAuthStore(s => s.setUser);
  const { loginWithGoogle } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  function getPasswordStrength(pw: string) {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { label: 'Weak', color: colors.error };
    if (pw.length < 10) return { label: 'Fair', color: colors.warning };
    return { label: 'Strong', color: colors.success };
  }

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      await loginWithGoogle(idToken);
      const freshUser = useAuthStore.getState().user;
      if (freshUser?.vehicles && freshUser.vehicles.length > 0) {
        router.replace('/(app)/(tabs)');
      } else {
        router.replace('/(auth)/vehicle-setup');
      }
    } catch (err: any) {
      if (err.message?.includes('cancelled')) return;
      Alert.alert('Google Sign-In failed', err.message ?? 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are the same.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      let user: User;
      if (isFirebaseConfigured) {
        const cred = await firebaseRegister(email.trim().toLowerCase(), password, name.trim());
        user = {
          id: cred.user.uid,
          name: name.trim(),
          email: cred.user.email ?? email.trim().toLowerCase(),
          vehicles: [],
        };
        await firestoreSaveUser(user);
      } else {
        user = {
          id: Date.now().toString(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          vehicles: [],
        };
      }
      await setUser(user);
      router.replace('/(auth)/vehicle-setup');
    } catch (err: any) {
      Alert.alert('Registration failed', err.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBolt}>⚡</Text>
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join EVidey to start planning EV trips</Text>
          </View>

          <View style={styles.form}>
            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              <View style={styles.googleIconWrap}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Signing up…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Name */}
            <View style={[styles.inputGroup, focused === 'name' && styles.inputGroupFocused]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={colors.textMuted}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {/* Email */}
            <View style={[styles.inputGroup, focused === 'email' && styles.inputGroupFocused]}>
              <Text style={styles.inputIcon}>✉</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {/* Password */}
            <View>
              <View style={[styles.inputGroup, focused === 'password' && styles.inputGroupFocused]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min. 8 chars)"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
                {strength && (
                  <Text style={[styles.strengthBadge, { color: strength.color, borderColor: strength.color + '44', backgroundColor: strength.color + '16' }]}>
                    {strength.label}
                  </Text>
                )}
              </View>
            </View>

            {/* Confirm */}
            <View>
              <View style={[
                styles.inputGroup,
                focused === 'confirm' && styles.inputGroupFocused,
                passwordsMismatch && styles.inputGroupError,
                passwordsMatch && styles.inputGroupSuccess,
              ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirm}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {passwordsMismatch && <Text style={styles.errorHint}>Passwords do not match</Text>}
              {passwordsMatch && <Text style={styles.successHint}>✓ Passwords match</Text>}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.footerLink} onPress={() => router.back()}>
            <Text style={styles.footerText}>
              Already have an account?{'  '}
              <Text style={styles.footerLinkText}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: 56,
      paddingBottom: 40,
    },
    backBtn: { marginBottom: 28 },
    backBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
    header: { alignItems: 'center', marginBottom: 36 },
    logoBadge: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    logoBolt: { fontSize: 24 },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 6,
    },
    form: { gap: 10 },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 15,
      gap: 12,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    googleIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#4285F4',
      justifyContent: 'center',
      alignItems: 'center',
    },
    googleG: { color: '#fff', fontWeight: '800', fontSize: 14 },
    googleBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 4,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 4,
      gap: 10,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    inputGroupFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      elevation: 2,
    },
    inputGroupError: { borderColor: colors.error },
    inputGroupSuccess: { borderColor: colors.success },
    inputIcon: { fontSize: 16, opacity: 0.5 },
    input: {
      flex: 1,
      height: 52,
      color: colors.text,
      fontSize: 15,
    },
    eyeIcon: { fontSize: 16, paddingLeft: 4 },
    strengthBadge: {
      fontSize: 10,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      overflow: 'hidden',
    },
    errorHint: { fontSize: 12, color: colors.error, marginTop: 5, marginLeft: 4 },
    successHint: { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 5, marginLeft: 4 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
      marginTop: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
    btnDisabled: { opacity: 0.55 },
    primaryBtnText: {
      color: colors.primaryForeground,
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    footerLink: { alignItems: 'center', marginTop: 32, paddingVertical: 8 },
    footerText: { fontSize: 14, color: colors.textSecondary },
    footerLinkText: { color: colors.primary, fontWeight: '700' },
  });
}
