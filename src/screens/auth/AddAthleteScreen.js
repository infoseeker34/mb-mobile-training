/**
 * Add Athlete Screen
 *
 * Lets a parent/guardian add one or more athlete profiles under their own
 * account. Athletes are data rows, not logins - there's no separate
 * Cognito account or credentials created here. Skippable: a parent can
 * finish with zero athletes added and add them later from their profile.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api/userApi';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const AddAthleteScreen = () => {
  const { user, checkAuthStatus, skipAthleteOnboarding } = useAuth();
  const [athletes, setAthletes] = useState(user?.athletes || []);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sport, setSport] = useState('');
  const [coachingConsent, setCoachingConsent] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleDateChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5, 9);
    }
    setDateOfBirth(cleaned);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setSport('');
    setCoachingConsent(false);
  };

  const handleAddAthlete = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', "Please enter the athlete's first and last name");
      return;
    }

    if (!dateOfBirth || dateOfBirth.length !== 10) {
      Alert.alert('Error', 'Please enter a valid date of birth (MM/DD/YYYY)');
      return;
    }

    setIsAdding(true);

    try {
      const [month, day, year] = dateOfBirth.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const response = await userApi.addAthlete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: isoDate,
        sport: sport.trim() || undefined,
        coachingConsent,
      });

      setAthletes([...athletes, response.data.athlete]);
      resetForm();
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add athlete. Please try again.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      if (athletes.length === 0) {
        await skipAthleteOnboarding();
      }
      // AppNavigator re-derives the current screen from user state - no
      // explicit navigation needed once this resolves.
      await checkAuthStatus();
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <FlatList
          data={athletes}
          keyExtractor={(item, index) => item.athleteId || String(index)}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Add an athlete</Text>
              <Text style={styles.subtitle}>
                Add each athlete you're managing. They won't need their own login -
                you'll have full access to their training plans and progress.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.athleteCard}>
              <Ionicons name="person-circle" size={32} color={Colors.primary} />
              <View style={styles.athleteCardInfo}>
                <Text style={styles.athleteCardName}>
                  {item.firstName} {item.lastName}
                </Text>
                {item.sport && <Text style={styles.athleteCardSport}>{item.sport}</Text>}
              </View>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Athlete's first name"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Athlete's last name"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={handleDateChange}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sport</Text>
                <TextInput
                  style={styles.input}
                  value={sport}
                  onChangeText={setSport}
                  placeholder="Soccer, basketball, etc. (optional)"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setCoachingConsent(!coachingConsent)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, coachingConsent && styles.checkboxChecked]}>
                  {coachingConsent && (
                    <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I consent to coaches creating and pushing training plans for this
                  athlete. I'll have full access to view all plans and progress.
                </Text>
              </TouchableOpacity>

              <Button
                title="Add Athlete"
                onPress={handleAddAthlete}
                loading={isAdding}
                disabled={!firstName.trim() || !lastName.trim() || dateOfBirth.length !== 10}
                variant="outline"
                style={styles.addButton}
              />

              <Button
                title={athletes.length > 0 ? 'Finish' : 'Skip for now'}
                onPress={handleFinish}
                loading={isFinishing}
                size="lg"
                style={styles.finishButton}
              />
            </View>
          }
        />
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
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
  },
  header: {
    marginBottom: Layout.spacing.lg,
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
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  athleteCardInfo: {
    marginLeft: Layout.spacing.sm,
  },
  athleteCardName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  athleteCardSport: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  form: {
    marginTop: Layout.spacing.md,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
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
  addButton: {
    width: '100%',
    marginBottom: Layout.spacing.lg,
  },
  finishButton: {
    width: '100%',
  },
});

export default AddAthleteScreen;
