/**
 * App Navigator
 * 
 * Root navigation that switches between Auth and Main flows.
 */

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import AccountTypeScreen from '../screens/auth/AccountTypeScreen';
import ConsentScreen from '../screens/auth/ConsentScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import AddAthleteScreen from '../screens/auth/AddAthleteScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MainNavigator from './MainNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, athleteOnboardingSkipped } = useAuth();

  // Only one of {Login, onboarding step, Main} is ever mounted at a time
  // (matching the existing pattern below), so screens can't navigate()
  // between each other - a target screen may not be registered yet. These
  // pre-profile-creation selections are threaded through as props instead
  // and only need to survive until ProfileSetupScreen submits them to the
  // backend; nothing is lost by resetting on an app restart mid-flow since
  // no profile exists yet either way.
  const [pendingAccountType, setPendingAccountType] = useState(null);
  const [pendingConsent, setPendingConsent] = useState(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasProfile = !!user?.displayName;

  // Onboarding is a linear walk through these steps, each gated on the
  // previous one being done. `athletes.length === 0` combined with
  // `athleteOnboardingSkipped` is how a parent's "skip for now" is
  // remembered - once at least one athlete exists the condition is
  // permanently satisfied and the flag no longer matters.
  const needsAccountType = !hasProfile && !pendingAccountType;
  const needsConsent = !hasProfile && pendingAccountType && !pendingConsent;
  const needsProfile = !hasProfile && pendingAccountType && pendingConsent;
  const needsAthletes =
    hasProfile &&
    user?.accountType === 'parent' &&
    (user?.athletes?.length || 0) === 0 &&
    !athleteOnboardingSkipped;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Flow - Login/SignUp/VerifyEmail are siblings (unlike the
          // onboarding steps below) since a user may go back and forth
          // between them before authenticating.
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        ) : needsAccountType ? (
          <Stack.Screen name="AccountType">
            {() => <AccountTypeScreen onChoose={setPendingAccountType} />}
          </Stack.Screen>
        ) : needsConsent ? (
          <Stack.Screen name="Consent">
            {() => <ConsentScreen accountType={pendingAccountType} onAccept={setPendingConsent} />}
          </Stack.Screen>
        ) : needsProfile ? (
          <Stack.Screen name="ProfileSetup">
            {() => (
              <ProfileSetupScreen
                accountType={pendingAccountType}
                termsAccepted={pendingConsent.termsAccepted}
                policyVersion={pendingConsent.policyVersion}
              />
            )}
          </Stack.Screen>
        ) : needsAthletes ? (
          <Stack.Screen name="AddAthlete" component={AddAthleteScreen} />
        ) : (
          // Main App
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Profile',
                headerBackTitle: 'Back',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;
