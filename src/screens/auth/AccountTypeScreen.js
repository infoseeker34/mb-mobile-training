/**
 * Account Type Screen
 *
 * First onboarding step: who is this account for? Athletes (including
 * minors) never get their own login - a parent/guardian's account is the
 * only one that authenticates, with athletes added as profiles afterward
 * (see AddAthleteScreen). `onChoose` is a callback (not navigation.navigate)
 * since AppNavigator only mounts one onboarding screen at a time - see the
 * comment in AppNavigator.js. The backend records this as `accountType`
 * when the profile is actually created in ProfileSetupScreen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const AccountTypeScreen = ({ onChoose }) => {
  const choose = (accountType) => {
    onChoose(accountType);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Who's this for?</Text>
          <Text style={styles.subtitle}>
            We'll set things up differently depending on who's using the app.
          </Text>
        </View>

        <View style={styles.choices}>
          <Button
            title="I'm a parent or guardian"
            onPress={() => choose('parent')}
            size="lg"
            style={styles.choiceButton}
          />
          <Text style={styles.choiceHint}>
            Add one or more athletes to manage - they won't need their own login.
          </Text>

          <Button
            title="I'm 18+ and signing up for myself"
            onPress={() => choose('independent')}
            variant="outline"
            size="lg"
            style={styles.choiceButton}
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: Layout.spacing.xxl,
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
  },
  choices: {
    alignItems: 'center',
  },
  choiceButton: {
    width: '100%',
    marginBottom: Layout.spacing.sm,
  },
  choiceHint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.md,
  },
});

export default AccountTypeScreen;
