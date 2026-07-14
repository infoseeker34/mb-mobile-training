/**
 * Consent Screen
 *
 * A single explicit affirmance covering the account holder's own agreement
 * to the Terms of Service and Privacy Policy. This is not per-athlete -
 * athletes never get independent credentials to consent for in the first
 * place, so one acceptance by the authenticated (18+) account holder
 * covers every athlete profile added under their account.
 *
 * PLACEHOLDER COPY: the text below is not real legal language. It must be
 * replaced with counsel-reviewed Terms of Service / Privacy Policy text
 * before this ships to real users.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { POLICY_VERSION } from '../../constants/Config';

const ConsentScreen = ({ onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    onAccept({
      termsAccepted: true,
      policyVersion: POLICY_VERSION,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Terms &amp; Privacy</Text>

        <View style={styles.policyBox}>
          <Text style={styles.policyHeading}>Terms of Service (placeholder)</Text>
          <Text style={styles.policyText}>
            [Placeholder] By using this app you agree to our Terms of Service.
            Real legal text goes here before launch.
          </Text>

          <Text style={styles.policyHeading}>Privacy Policy (placeholder)</Text>
          <Text style={styles.policyText}>
            [Placeholder] This app collects account and, for parent accounts,
            athlete information (name, date of birth, sport) to provide
            training features. Athletes never have their own login - all
            data is managed by the parent/guardian account. Real legal text
            goes here before launch.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={16} color={Colors.textInverse} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms of Service and Privacy Policy
          </Text>
        </TouchableOpacity>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!agreed}
          size="lg"
          style={styles.continueButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.lg,
  },
  policyBox: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  policyHeading: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  policyText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
  },
  continueButton: {
    width: '100%',
  },
});

export default ConsentScreen;
