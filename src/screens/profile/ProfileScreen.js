/**
 * Profile Screen
 * 
 * User profile with settings and logout.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api/userApi';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.deleteAccount();
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'Athlete'}</Text>
          <Text style={styles.username}>@{user?.username || 'user'}</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoCard}>
            <InfoRow label="Email" value={user?.email || 'N/A'} />
            <InfoRow label="First Name" value={user?.extensions?.firstName || 'N/A'} />
            <InfoRow label="Last Name" value={user?.extensions?.lastName || 'N/A'} />
            <InfoRow label="Date of Birth" value={formatDate(user?.extensions?.dateOfBirth)} />
            <InfoRow label="Age Group" value={user?.ageGroup || 'N/A'} />
            <InfoRow label="Gender" value={user?.extensions?.gender || 'N/A'} />
            <InfoRow label="Phone" value={user?.extensions?.phoneNumber || 'N/A'} />
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.infoCard}>
            <InfoRow label="Account Type" value={user?.accountType || 'N/A'} />
            <InfoRow label="Member Since" value={formatDate(user?.createdAt)} />
            <InfoRow label="Last Login" value={formatDate(user?.lastLogin)} />
          </View>
        </View>

        {/* Settings Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Coming Soon →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('TermsOfService')}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Text style={styles.settingValue}>Coming Soon →</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.textInverse,
  },
  displayName: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  username: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  
  // Sections
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  
  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  settingArrow: { fontSize: 14, color: '#4b5563' },

  // Logout Button
  logoutButton: {
    backgroundColor: Colors.error,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  logoutButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});

export default ProfileScreen;
