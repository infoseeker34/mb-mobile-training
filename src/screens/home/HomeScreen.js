/**
 * Home Screen
 * 
 * Main dashboard with user stats, progress, and quick actions.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import NextTrainingWidget from '../../components/home/NextTrainingWidget';
import TeamStatusWidget from '../../components/home/TeamStatusWidget';
import progressApi from '../../services/api/progressApi';
import teamActivityApi from '../../services/api/teamActivityApi';
import teamApi from '../../services/api/teamApi';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';


const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [incomplete, setIncomplete] = useState([]);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [teams, setTeams] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [incompleteLoading, setIncompleteLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleCelebrate = async (milestoneId) => {
    try {
      await teamActivityApi.celebrateActivity(milestoneId);
      setMilestones(prev =>
        prev.map(m =>
          m.id === milestoneId ? { ...m, celebrated: true } : m
        )
      );
    } catch (error) {
      console.error('Error celebrating milestone:', error);
    }
  };

  const handleNudge = async (incompleteId) => {
    try {
      const item = incomplete.find(i => i.id === incompleteId);
      if (item) {
        await teamActivityApi.sendNudge(item.userId, item.assignmentId);
        setIncomplete(prev =>
          prev.map(i =>
            i.id === incompleteId ? { ...i, nudged: true } : i
          )
        );
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchUserStats();
      fetchTeamMilestones();
      fetchIncompleteAssignments();
      fetchUserTeams();
    }
  }, [user?.userId]);

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      // Fetch progress (level, XP)
      const progressData = await progressApi.getPlayerProgress();
      console.log('HomeScreen - Progress data:', progressData);
      if (progressData?.currentLevel !== undefined) {
        setLevel(progressData.currentLevel);
      }

      // Fetch streak data
      const streakData = await progressApi.getStreakData();
      console.log('HomeScreen - Streak data:', streakData);
      // Handle null streak (user hasn't started a streak yet)
      if (streakData === null) {
        setStreak(0);
      } else if (streakData?.currentStreak !== undefined) {
        setStreak(streakData.currentStreak);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStatsError('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTeamMilestones = async () => {
    try {
      setMilestonesLoading(true);
      const activities = await teamActivityApi.getUserTeamsActivityFeed(10);
      
      // Transform activities to milestone format
      const transformedMilestones = activities.map(activity => ({
        id: activity.activityId,
        type: 'milestone',
        userId: activity.userId,
        userName: activity.userName,
        achievement: getAchievementText(activity),
        iconName: getActivityIcon(activity.activityType),
        iconColor: getActivityColor(activity.activityType),
        timestamp: getRelativeTime(activity.createdAt),
        celebrated: activity.userCelebrated,
        activityId: activity.activityId
      }));
      
      setMilestones(transformedMilestones);
    } catch (error) {
      console.error('Error fetching team milestones:', error);
    } finally {
      setMilestonesLoading(false);
    }
  };

  const fetchIncompleteAssignments = async () => {
    try {
      setIncompleteLoading(true);
      const assignments = await teamActivityApi.getUserTeamsIncompleteAssignments();
      
      // Transform assignments to incomplete format
      const transformedIncomplete = assignments.map(assignment => ({
        id: assignment.assignmentId,
        userId: assignment.userId,
        userName: assignment.userName,
        teamName: assignment.teamName,
        planName: assignment.programName,
        daysOverdue: assignment.daysOverdue,
        nudged: false,
        assignmentId: assignment.assignmentId
      }));
      
      setIncomplete(transformedIncomplete);
    } catch (error) {
      console.error('Error fetching incomplete assignments:', error);
    } finally {
      setIncompleteLoading(false);
    }
  };

  const fetchUserTeams = async () => {
    try {
      setTeamsLoading(true);
      const teamsData = await teamApi.getTeams();
      setTeams(teamsData.teams || []);
    } catch (error) {
      console.error('Error fetching user teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data in parallel
      await Promise.all([
        fetchUserStats(),
        fetchTeamMilestones(),
        fetchIncompleteAssignments(),
        fetchUserTeams()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getAchievementText = (activity) => {
    switch (activity.activityType) {
      case 'level_up':
        return `Reached Level ${activity.activityData.new_level}`;
      case 'streak_milestone':
        return `${activity.activityData.streak_days}-Day Streak`;
      case 'sessions_milestone':
        return `Completed ${activity.activityData.total_sessions} Sessions`;
      case 'achievement_unlocked':
        return activity.activityData.achievement_name || 'Achievement Unlocked';
      default:
        return 'Milestone Achieved';
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'level_up':
        return 'trophy';
      case 'streak_milestone':
        return 'flame';
      case 'sessions_milestone':
        return 'ribbon';
      case 'achievement_unlocked':
        return 'star';
      default:
        return 'trophy';
    }
  };

  const getActivityColor = (activityType) => {
    switch (activityType) {
      case 'level_up':
        return Colors.warning;
      case 'streak_milestone':
        return Colors.error;
      case 'sessions_milestone':
        return Colors.primary;
      case 'achievement_unlocked':
        return Colors.success;
      default:
        return Colors.primary;
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {statsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : statsError ? (
            <View style={styles.statsErrorContainer}>
              <Text style={styles.statsErrorText}>{statsError}</Text>
            </View>
          ) : (
            <View style={styles.combinedStatCard}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '15' }]}>
                  <Ionicons name="flash" size={28} color={Colors.primary} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{level.toString()}</Text>
                  <Text style={styles.statLabel}>Current Level</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: Colors.streakFire + '15' }]}>
                  <Ionicons name="flame" size={28} color={Colors.streakFire} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{streak.toString()}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Next Training Widget */}
        <NextTrainingWidget userId={user?.userId} />

        {/* Team Status Widgets */}
        {teamsLoading ? (
          <View style={styles.teamsLoadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : teams.length > 0 ? (
          <View style={styles.teamsSection}>
            <Text style={styles.sectionTitle}>⚽ My Teams</Text>
            {teams.map(team => (
              <TeamStatusWidget
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                userId={user?.userId}
              />
            ))}
          </View>
        ) : null}

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
  combinedStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Layout.spacing.lg,
    borderRadius: 16,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 56,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.md,
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
  statsLoadingContainer: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsErrorContainer: {
    padding: Layout.spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: Layout.spacing.md,
  },
  statsErrorText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.error,
    textAlign: 'center',
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
  
  // Team sections
  teamsLoadingContainer: {
    padding: Layout.spacing.lg,
    alignItems: 'center',
  },
  teamsSection: {
    marginBottom: Layout.spacing.md,
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
