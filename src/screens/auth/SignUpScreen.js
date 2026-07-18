/**
 * Sign Up Screen
 *
 * Native email/password sign-up against Cognito directly. Username is
 * derived from email - the user never sees or chooses one.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { signUp, describeCognitoError } from '../../services/auth/cognitoAuth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = EMAIL_PATTERN.test(email.trim()) && password.length > 0 && password === confirmPassword;

  const handleSubmit = async () => {
    setError(null);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password);
      navigation.navigate('VerifyEmail', { email: email.trim() });
    } catch (err) {
      setError(describeCognitoError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Steamers Crew Training</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />
              <Text style={styles.hint}>
                At least 8 characters, with an uppercase letter, lowercase letter, number, and symbol.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Sign Up" onPress={handleSubmit} loading={isLoading} disabled={!canSubmit} size="lg" style={styles.submitButton} />
            <Button
              title="Already have an account? Log In"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="lg"
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
  },
  header: {
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: Layout.fontSize.sm,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Layout.spacing.lg,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  input: {
    height: Layout.buttonHeight.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  buttonContainer: {
    paddingTop: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  submitButton: {
    width: '100%',
  },
});

export default SignUpScreen;
