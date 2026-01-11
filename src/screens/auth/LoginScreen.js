/**
 * Login Screen
 * 
 * OAuth login with Cognito hosted UI.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const LoginScreen = () => {
  const { login, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <Text style={styles.title}>Magic Board Training</Text>
          <Text style={styles.subtitle}>
            Level up your skills with personalized training programs
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <FeatureItem icon="🎯" text="Browse training plans" />
          <FeatureItem icon="📊" text="Track your progress" />
          <FeatureItem icon="🏆" text="Earn achievements" />
          <FeatureItem icon="🔥" text="Build training streaks" />
        </View>

        {/* Login Button */}
        <View style={styles.buttonSection}>
          <Button
            title="Login with Magic Board"
            onPress={login}
            loading={isLoading}
            size="lg"
            style={styles.loginButton}
          />
          <Text style={styles.helpText}>
            Use your Magic Board account to sign in
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.xxl,
  },
  
  // Brand Section
  brandSection: {
    alignItems: 'center',
    marginTop: Layout.spacing.xxl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  
  // Features Section
  featuresSection: {
    marginVertical: Layout.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  featureIcon: {
    fontSize: Layout.fontSize.xxl,
    marginRight: Layout.spacing.md,
  },
  featureText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  
  // Button Section
  buttonSection: {
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    marginBottom: Layout.spacing.md,
  },
  helpText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoginScreen;
