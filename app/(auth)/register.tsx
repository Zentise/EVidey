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
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { firebaseRegister, isFirebaseConfigured } from '../../services/firebaseService';
import type { ColorScheme } from '../../constants/colors';
import type { User } from '../../types';

export default function RegisterScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  function getPasswordStrength(pw: string) {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { label: 'Weak', color: colors.error };
    if (pw.length < 10) return { label: 'Fair', color: colors.warning };
    return { label: 'Strong', color: colors.success };
  }

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

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
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>⚡ EVidey</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, focused === 'name' && styles.inputFocused]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, focused === 'email' && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            {strength && (
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            )}
          </View>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                focused === 'password' && styles.inputFocused,
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                focused === 'confirm' && styles.inputFocused,
                passwordsMismatch && styles.inputError,
                passwordsMatch && styles.inputSuccess,
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirm}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {passwordsMismatch && (
            <Text style={styles.errorHint}>Passwords do not match</Text>
          )}
          {passwordsMatch && (
            <Text style={styles.successHint}>✓ Passwords match</Text>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 52,
    },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -1,
    },
    tagline: { marginTop: 8, fontSize: 14, color: colors.textSecondary },
    form: { gap: 4 },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 16,
    },
    strengthLabel: { fontSize: 12, fontWeight: '700' },
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
    inputFocused: { borderColor: colors.primary },
    inputError: { borderColor: colors.error },
    inputSuccess: { borderColor: colors.success },
    passwordWrap: { position: 'relative' },
    passwordInput: { paddingRight: 52 },
    eyeBtn: {
      position: 'absolute',
      right: 14,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    eyeIcon: { fontSize: 18 },
    errorHint: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
      marginLeft: 4,
    },
    successHint: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600',
      marginTop: 4,
      marginLeft: 4,
    },
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
    link: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 24,
      fontSize: 14,
    },
    linkBold: { color: colors.primary, fontWeight: '700' },
  });
}
