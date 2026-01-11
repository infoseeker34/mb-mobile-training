/**
 * Profile Setup Screen
 * 
 * First-time user profile creation.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api/userApi';
import Button from '../../components/common/Button';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const ProfileSetupScreen = () => {
  const { user, checkAuthStatus } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (text) => {
    // Format as MM/DD/YYYY
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5, 9);
    }
    setDateOfBirth(cleaned);
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    if (!dateOfBirth || dateOfBirth.length !== 10) {
      Alert.alert('Error', 'Please enter a valid date of birth (MM/DD/YYYY)');
      return;
    }

    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    console.log('Submitting profile with user data:', user);

    setIsLoading(true);

    try {
      // Convert MM/DD/YYYY to YYYY-MM-DD for backend
      const [month, day, year] = dateOfBirth.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const profileData = {
        username: user?.username || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        displayName: displayName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: isoDate,
        gender: gender,
        phoneNumber: phoneNumber || undefined,
      };

      console.log('Profile data being sent:', profileData);

      const createResponse = await userApi.createProfile(profileData);
      console.log('Profile created successfully:', createResponse);

      // Reload user data to trigger navigation to home screen
      console.log('Reloading user data...');
      await checkAuthStatus();
      console.log('User data reloaded, navigation should trigger now');
      
      // Success! Navigation will happen automatically via AppNavigator
      Alert.alert('Success', 'Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome! 👋</Text>
            <Text style={styles.subtitle}>Let's set up your profile</Text>
          </View>

          <View style={styles.form}>
            {/* Display Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How you want to be known"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
              <Text style={styles.hint}>This is how you'll appear to others</Text>
            </View>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Date of Birth */}
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

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderButton,
                      gender === option && styles.genderButtonActive
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      gender === option && styles.genderButtonTextActive
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(text) => {
                  // Format phone number as user types
                  const cleaned = text.replace(/\D/g, '');
                  if (cleaned.length <= 10) {
                    setPhoneNumber(cleaned);
                  }
                }}
                placeholder="5551234567"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Text style={styles.hint}>Required - 10 digits</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Complete Setup"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!displayName.trim() || !firstName.trim() || !lastName.trim() || !dateOfBirth || !gender || !phoneNumber || phoneNumber.length !== 10}
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
  inputDisabled: {
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
  },
  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  hintSuccess: {
    color: Colors.success,
  },
  hintError: {
    color: Colors.error,
  },
  buttonContainer: {
    paddingTop: Layout.spacing.lg,
  },
  submitButton: {
    width: '100%',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  genderButton: {
    flex: 1,
    height: Layout.buttonHeight.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;
