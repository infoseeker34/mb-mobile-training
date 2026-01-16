/**
 * Home Screen
 * 
 * Main dashboard with user stats, progress, and quick actions.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import NextTrainingWidget from '../../components/home/NextTrainingWidget';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

// Mock social feed data
const MOCK_MILESTONES = [
  {
    id: '1',
    type: 'milestone',
    userId: 'user2',
    userName: 'Sarah Johnson',
    achievement: 'Reached Level 5',
    iconName: 'trophy',
    iconColor: Colors.warning,
    timestamp: '2 hours ago',
    celebrated: false,
  },
  {
    id: '2',
    type: 'milestone',
    userId: 'user3',
    userName: 'Mike Chen',
    achievement: '10-Day Streak',
    iconName: 'flame',
    iconColor: Colors.error,
    timestamp: '5 hours ago',
    celebrated: true,
  },
  {
    id: '3',
    type: 'milestone',
    userId: 'user4',
    userName: 'Emma Davis',
    achievement: 'Completed 50 Sessions',
    iconName: 'ribbon',
    iconColor: Colors.primary,
    timestamp: 'Yesterday',
    celebrated: false,
  },
];

const MOCK_INCOMPLETE = [
  {
    id: '1',
    userId: 'user5',
    userName: 'Alex Martinez',
    teamName: 'U12 Boys',
    planName: 'Speed & Agility Fundamentals',
    daysOverdue: 0,
    nudged: false,
  },
  {
    id: '2',
    userId: 'user6',
    userName: 'Jordan Lee',
    teamName: 'Soccer Stars Academy',
    planName: 'Ball Control Mastery',
    daysOverdue: 1,
    nudged: false,
  },
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState(MOCK_MILESTONES);
  const [incomplete, setIncomplete] = useState(MOCK_INCOMPLETE);

  const handleCelebrate = (milestoneId) => {
    setMilestones(prev =>
      prev.map(m =>
        m.id === milestoneId ? { ...m, celebrated: true } : m
      )
    );
  };

  const handleNudge = (incompleteId) => {
    setIncomplete(prev =>
      prev.map(i =>
        i.id === incompleteId ? { ...i, nudged: true } : i
      )
    );
  };

  const renderMilestone = (milestone) => (
    <View key={milestone.id} style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={[styles.feedIconContainer, { backgroundColor: milestone.iconColor + '20' }]}>
          <Ionicons name={milestone.iconName} size={24} color={milestone.iconColor} />
        </View>
        <View style={styles.feedContent}>
          <Text style={styles.feedUserName}>{milestone.userName}</Text>
          <Text style={styles.feedAchievement}>{milestone.achievement}</Text>
          <Text style={styles.feedTimestamp}>{milestone.timestamp}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.celebrateButton,
          milestone.celebrated && styles.celebrateButtonDisabled
        ]}
        onPress={() => handleCelebrate(milestone.id)}
        disabled={milestone.celebrated}
      >
        <Text style={[
          styles.celebrateButtonText,
          milestone.celebrated && styles.celebrateButtonTextDisabled
        ]}>
          {milestone.celebrated ? '✓ Celebrated!' : '🎉 Celebrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderIncomplete = (item) => (
    <View key={item.id} style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={[styles.feedIconContainer, styles.nudgeIconContainer]}>
          <Ionicons name="alarm" size={24} color={Colors.error} />
        </View>
        <View style={styles.feedContent}>
          <Text style={styles.feedUserName}>{item.userName}</Text>
          <Text style={styles.feedIncompleteText}>
            Hasn't completed today's plan
          </Text>
          <Text style={styles.feedPlanName}>{item.planName}</Text>
          <Text style={styles.feedTeamName}>Team: {item.teamName}</Text>
          {item.daysOverdue > 0 && (
            <Text style={styles.feedOverdue}>
              {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'} overdue
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.nudgeButton,
          item.nudged && styles.nudgeButtonDisabled
        ]}
        onPress={() => handleNudge(item.id)}
        disabled={item.nudged}
      >
        <Text style={[
          styles.nudgeButtonText,
          item.nudged && styles.nudgeButtonTextDisabled
        ]}>
          {item.nudged ? '✓ Nudged!' : '👋 Send Nudge'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight, Colors.background]}
        locations={[0, 0.3, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.displayName || 'Athlete'}! 👋</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            iconName="flash"
            label="Current Level"
            value="1"
            color={Colors.primary}
          />
          <StatCard
            iconName="flame"
            label="Day Streak"
            value="0"
            color={Colors.streakFire}
          />
        </View>

        {/* Next Training Widget */}
        <NextTrainingWidget userId={user?.userId} />

        {/* Team Milestones */}
        {milestones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Team Milestones</Text>
            <Text style={styles.sectionSubtitle}>
              Celebrate your teammates' achievements
            </Text>
            {milestones.map(renderMilestone)}
          </View>
        )}

        {/* Incomplete Team Plans */}
        {incomplete.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💪 Motivate Your Team</Text>
            <Text style={styles.sectionSubtitle}>
              Send a friendly nudge to teammates
            </Text>
            {incomplete.map(renderIncomplete)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const StatCard = ({ iconName, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={iconName} size={28} color={color} />
    </View>
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
  gradient: {
    paddingTop: 60,
    paddingBottom: Layout.spacing.xl,
  },
  headerContainer: {
    paddingHorizontal: Layout.spacing.lg,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: Layout.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 4,
  },
  profileButton: {
    marginTop: 4,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    color: Colors.white,
  },
  
  // Stats
  statsContainer: {
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Layout.spacing.lg,
    borderRadius: 16,
    marginBottom: Layout.spacing.md,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: Layout.spacing.xxl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.lg,
  },
  
  // Milestone Card
  milestoneCard: {
    backgroundColor: Colors.card,
    padding: Layout.spacing.lg,
    borderRadius: 16,
    marginBottom: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  feedHeader: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
  },
  socialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  feedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  nudgeIconContainer: {
    backgroundColor: Colors.warning + '20',
  },
  feedIcon: {
    fontSize: 24,
  },
  feedContent: {
    flex: 1,
  },
  feedUserName: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  feedAchievement: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedTimestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  feedIncompleteText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  feedPlanName: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  feedTeamName: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  feedOverdue: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    fontWeight: '600',
  },
  
  // Celebrate Button
  celebrateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  celebrateButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  celebrateButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  celebrateButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  
  // Nudge Button
  nudgeButton: {
    backgroundColor: Colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  nudgeButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  nudgeButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  nudgeButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});

export default HomeScreen;
