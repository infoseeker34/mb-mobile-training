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

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={{ uri: 'https://lirp.cdn-website.com/9b281fe3/dms3rep/multi/opt/Image+%2811%29-1920w.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Steamers Crew Training</Text>
          <Text style={styles.subtitle}>
            Level up!
          </Text>
        </View>

        {/* Login Button */}
        <View style={styles.buttonSection}>
          <Button
            title="Login to Steamers Crew Training"
            onPress={login}
            loading={isLoading}
            size="lg"
            style={styles.loginButton}
          />
          <Text style={styles.helpText}>
            Use your Steamers Crew Training account to sign in
          </Text>
          <Button
            title="Create an Account"
            onPress={() => navigation.navigate('SignUp')}
            variant="outline"
            size="lg"
            style={styles.signUpButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

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
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 78,
    height: 78,
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
  
  // Button Section
  buttonSection: {
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    marginBottom: Layout.spacing.md,
  },
  signUpButton: {
    width: '100%',
    marginTop: Layout.spacing.md,
  },
  helpText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoginScreen;
