import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { signInWithGoogle } from '../../services/googleAuthService';
import type { ColorScheme } from '../../constants/colors';

export default function LoginScreen() {
  const { loginWithEmail, loginWithGoogle } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

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

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      const freshUser = useAuthStore.getState().user;
      if (freshUser?.vehicles && freshUser.vehicles.length > 0) {
        router.replace('/(app)/(tabs)');
      } else {
        router.replace('/(auth)/vehicle-setup');
      }
    } catch (err: any) {
      Alert.alert('Login failed', err.message ?? 'Invalid email or password.');
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
      <Animated.View
        style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBolt}>⚡</Text>
          </View>
          <Text style={styles.appName}>EVidey</Text>
          <Text style={styles.tagline}>Your EV journey companion</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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

          <View style={[styles.inputGroup, focused === 'password' && styles.inputGroupFocused]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (loading) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Continue'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

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
              {googleLoading ? 'Signing in…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.footerText}>
            New here?{'  '}
            <Text style={styles.footerLinkText}>Create account</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 56,
    },
    logoBadge: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    logoBolt: {
      fontSize: 28,
    },
    appName: {
      fontSize: 34,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 6,
      letterSpacing: 0.1,
    },
    form: {
      gap: 12,
    },
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
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    inputGroupFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    inputIcon: {
      fontSize: 16,
      opacity: 0.5,
    },
    input: {
      flex: 1,
      height: 52,
      color: colors.text,
      fontSize: 15,
      fontWeight: '400',
    },
    eyeIcon: {
      fontSize: 16,
      paddingLeft: 8,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
    btnDisabled: {
      opacity: 0.55,
    },
    primaryBtnText: {
      color: colors.primaryForeground,
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginVertical: 6,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
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
    googleG: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 14,
    },
    googleBtnText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
    footerLink: {
      alignItems: 'center',
      marginTop: 36,
      paddingVertical: 8,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLinkText: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
