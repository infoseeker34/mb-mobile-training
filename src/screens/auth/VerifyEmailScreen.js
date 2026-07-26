/**
 * Verify Email Screen
 *
 * Confirms the code Cognito emailed after sign-up, then hands off to the
 * existing hosted-UI login flow to actually authenticate - avoids needing
 * password-based InitiateAuth enabled on the app client just for this.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { confirmSignUp, resendConfirmationCode, describeCognitoError } from '../../services/auth/cognitoAuth';

const VerifyEmailScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);

    if (code.trim().length === 0) {
      setError('Please enter the code we emailed you.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmSignUp(email, code.trim());
      setInfo('Account confirmed! Log in to continue.');
      // Now that the user is confirmed, the email alias is active, so the
      // hosted-UI sign-in accepts the email directly - hand off to it.
      setTimeout(() => login(), 800);
    } catch (err) {
      setError(describeCognitoError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setIsResending(true);
    try {
      await resendConfirmationCode(email);
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(describeCognitoError(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>We sent a verification code to {email}</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {info && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{info}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code *</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Verify" onPress={handleSubmit} loading={isLoading} disabled={!code.trim()} size="lg" style={styles.submitButton} />
            <Button
              title="Resend Code"
              onPress={handleResend}
              loading={isResending}
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
  infoBox: {
    backgroundColor: Colors.success + '15',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  infoText: {
    color: Colors.success,
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
  buttonContainer: {
    paddingTop: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  submitButton: {
    width: '100%',
  },
});

export default VerifyEmailScreen;
