/**
 * Home Screen
 * 
 * Main dashboard with user stats, progress, and quick actions.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import NextTrainingWidget from '../../components/home/NextTrainingWidget';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.displayName || 'Athlete'}! 👋</Text>
        </View>

        {/* Quick Stats Placeholder */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="⚡"
            label="Current Level"
            value="1"
            color={Colors.primary}
          />
          <StatCard
            icon="🔥"
            label="Day Streak"
            value="0"
            color={Colors.streakFire}
          />
        </View>

        {/* Next Training Widget */}
        <NextTrainingWidget userId={user?.userId} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Button
            title="Browse Training Plans"
            onPress={() => {}}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title="View Progress"
            onPress={() => {}}
            variant="secondary"
            size="lg"
            style={styles.actionButton}
          />
        </View>

        {/* Placeholder for future features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>
              📊 Training sessions{'\n'}
              🏆 Achievements{'\n'}
              📈 Weekly goals{'\n'}
              👥 Teams & invitations
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Button
            title="Logout"
            onPress={logout}
            variant="outline"
            size="md"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    marginBottom: Layout.spacing.xl,
  },
  greeting: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  
  // Stats
  statsContainer: {
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.md,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: Layout.fontSize.xxxl,
    marginRight: Layout.spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
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
  
  // Actions
  actionButton: {
    marginBottom: Layout.spacing.md,
  },
  
  // Coming Soon
  comingSoonCard: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  comingSoonText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  
  // Logout
  logoutButton: {
    alignSelf: 'center',
  },
});

export default HomeScreen;
