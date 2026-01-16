/**
 * Profile Screen
 * 
 * User profile with settings and logout.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

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
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy</Text>
            <Text style={styles.settingValue}>Coming Soon →</Text>
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
});

export default ProfileScreen;
