/**
 * Training Screen
 * 
 * Main training hub with tabs for browsing plans, viewing history, and tracking progress.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

// Mock data
const MOCK_PLANS = [
  {
    id: '1',
    name: 'Speed & Agility Fundamentals',
    category: 'Speed',
    difficulty: 'Beginner',
    duration: 30,
    sessions: 8,
    description: 'Build your foundation with essential speed and agility drills',
    exercises: 12,
    equipment: 'Cones, Ladder'
  },
  {
    id: '2',
    name: 'Ball Control Mastery',
    category: 'Technical',
    difficulty: 'Intermediate',
    duration: 45,
    sessions: 12,
    description: 'Advanced ball control techniques for game situations',
    exercises: 15,
    equipment: 'Ball, Cones'
  },
  {
    id: '3',
    name: 'Explosive Power Training',
    category: 'Strength',
    difficulty: 'Advanced',
    duration: 40,
    sessions: 10,
    description: 'Develop explosive power for quick movements and jumps',
    exercises: 10,
    equipment: 'None'
  },
  {
    id: '4',
    name: 'First Touch Excellence',
    category: 'Technical',
    difficulty: 'Beginner',
    duration: 25,
    sessions: 6,
    description: 'Master your first touch with progressive drills',
    exercises: 8,
    equipment: 'Ball, Wall'
  },
  {
    id: '5',
    name: 'Defensive Positioning',
    category: 'Tactical',
    difficulty: 'Intermediate',
    duration: 35,
    sessions: 8,
    description: 'Learn proper defensive positioning and movement',
    exercises: 10,
    equipment: 'Cones'
  }
];

const MOCK_HISTORY = [
  {
    id: '1',
    planName: 'Speed & Agility Fundamentals',
    date: '2026-01-10',
    duration: 28,
    completed: true,
    xpEarned: 150,
    completionRate: 100
  },
  {
    id: '2',
    planName: 'Ball Control Mastery',
    date: '2026-01-08',
    duration: 42,
    completed: true,
    xpEarned: 200,
    completionRate: 95
  },
  {
    id: '3',
    planName: 'Speed & Agility Fundamentals',
    date: '2026-01-06',
    duration: 30,
    completed: true,
    xpEarned: 150,
    completionRate: 100
  },
  {
    id: '4',
    planName: 'First Touch Excellence',
    date: '2026-01-04',
    duration: 22,
    completed: false,
    xpEarned: 80,
    completionRate: 60
  },
  {
    id: '5',
    planName: 'Ball Control Mastery',
    date: '2026-01-02',
    duration: 45,
    completed: true,
    xpEarned: 200,
    completionRate: 100
  }
];

const MOCK_STATS = {
  totalSessions: 24,
  completedSessions: 21,
  totalXP: 3450,
  averageDuration: 32,
  currentStreak: 5,
  longestStreak: 12,
  thisWeek: {
    sessions: 3,
    xp: 550,
    minutes: 95
  },
  thisMonth: {
    sessions: 12,
    xp: 1800,
    minutes: 380
  }
};

const TrainingScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter plans based on search
  const filteredPlans = MOCK_PLANS.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter history based on search
  const filteredHistory = MOCK_HISTORY.filter(session =>
    session.planName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSearchBar = () => {
    // Only show search for Browse and History tabs
    if (activeTab === 'progress') return null;

    return (
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'browse' ? 'Search plans...' : 'Search history...'}
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[styles.segment, activeTab === 'browse' && styles.activeSegment]}
        onPress={() => {
          setActiveTab('browse');
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="compass" 
          size={18} 
          color={activeTab === 'browse' ? Colors.white : Colors.textSecondary} 
          style={styles.segmentIcon}
        />
        <Text style={[styles.segmentText, activeTab === 'browse' && styles.activeSegmentText]}>
          Browse
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, activeTab === 'history' && styles.activeSegment]}
        onPress={() => {
          setActiveTab('history');
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="time" 
          size={18} 
          color={activeTab === 'history' ? Colors.white : Colors.textSecondary} 
          style={styles.segmentIcon}
        />
        <Text style={[styles.segmentText, activeTab === 'history' && styles.activeSegmentText]}>
          History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, activeTab === 'progress' && styles.activeSegment]}
        onPress={() => {
          setActiveTab('progress');
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="stats-chart" 
          size={18} 
          color={activeTab === 'progress' ? Colors.white : Colors.textSecondary} 
          style={styles.segmentIcon}
        />
        <Text style={[styles.segmentText, activeTab === 'progress' && styles.activeSegmentText]}>
          Progress
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBrowsePlans = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discover Training Plans</Text>
        <Text style={styles.sectionSubtitle}>
          Browse and explore training plans to improve your skills
        </Text>
      </View>

      {filteredPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>No plans found</Text>
          <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
        </View>
      ) : (
        filteredPlans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={styles.planCard}
          onPress={() => {}}
        >
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={[styles.difficultyBadge, styles[`difficulty${plan.difficulty}`]]}>
                <Text style={styles.difficultyText}>{plan.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.planCategory}>{plan.category}</Text>
          </View>
          
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.planMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{plan.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📋</Text>
              <Text style={styles.metaText}>{plan.sessions} sessions</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🎯</Text>
              <Text style={styles.metaText}>{plan.exercises} exercises</Text>
            </View>
          </View>
          
          {plan.equipment && (
            <Text style={styles.equipment}>Equipment: {plan.equipment}</Text>
          )}
        </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training History</Text>
        <Text style={styles.sectionSubtitle}>
          Your completed training sessions
        </Text>
      </View>

      {filteredHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>No sessions found</Text>
          <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
        </View>
      ) : (
        filteredHistory.map((session) => (
        <TouchableOpacity
          key={session.id}
          style={styles.historyCard}
          onPress={() => {}}
        >
          <View style={styles.historyHeader}>
            <View style={styles.historyIcon}>
              <Text style={styles.historyIconText}>
                {session.completed ? '✅' : '⚠️'}
              </Text>
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyPlanName}>{session.planName}</Text>
              <Text style={styles.historyDate}>
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatLabel}>Duration</Text>
              <Text style={styles.historyStatValue}>{session.duration} min</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatLabel}>Completion</Text>
              <Text style={styles.historyStatValue}>{session.completionRate}%</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatLabel}>XP Earned</Text>
              <Text style={styles.historyStatValue}>+{session.xpEarned}</Text>
            </View>
          </View>
        </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderProgress = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <Text style={styles.sectionSubtitle}>
          Track your training journey
        </Text>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_STATS.totalSessions}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_STATS.totalXP}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_STATS.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_STATS.averageDuration}</Text>
          <Text style={styles.statLabel}>Avg Minutes</Text>
        </View>
      </View>

      {/* This Week */}
      <View style={styles.periodCard}>
        <Text style={styles.periodTitle}>This Week</Text>
        <View style={styles.periodStats}>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>📅</Text>
            <View>
              <Text style={styles.periodStatValue}>{MOCK_STATS.thisWeek.sessions}</Text>
              <Text style={styles.periodStatLabel}>Sessions</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⚡</Text>
            <View>
              <Text style={styles.periodStatValue}>{MOCK_STATS.thisWeek.xp}</Text>
              <Text style={styles.periodStatLabel}>XP Earned</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⏱️</Text>
            <View>
              <Text style={styles.periodStatValue}>{MOCK_STATS.thisWeek.minutes}</Text>
              <Text style={styles.periodStatLabel}>Minutes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* This Month */}
      <View style={styles.periodCard}>
        <Text style={styles.periodTitle}>This Month</Text>
        <View style={styles.periodStats}>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>📅</Text>
            <View>
              <Text style={styles.periodStatValue}>{MOCK_STATS.thisMonth.sessions}</Text>
              <Text style={styles.periodStatLabel}>Sessions</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⚡</Text>
            <View>
              <Text style={styles.periodStatValue}>{MOCK_STATS.thisMonth.xp}</Text>
              <Text style={styles.periodStatLabel}>XP Earned</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⏱️</Text>
            <View>
              <Text style={styles.periodStatValue}>{MOCK_STATS.thisMonth.minutes}</Text>
              <Text style={styles.periodStatLabel}>Minutes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Completion Rate */}
      <View style={styles.completionCard}>
        <Text style={styles.completionTitle}>Completion Rate</Text>
        <View style={styles.completionBar}>
          <View
            style={[
              styles.completionFill,
              { width: `${(MOCK_STATS.completedSessions / MOCK_STATS.totalSessions) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.completionText}>
          {MOCK_STATS.completedSessions} of {MOCK_STATS.totalSessions} sessions completed
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight, Colors.background]}
        locations={[0, 0.3, 1]}
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Training</Text>
        </View>
        {renderTabBar()}
      </LinearGradient>
      
      <View style={styles.contentWrapper}>
        {renderSearchBar()}
        {activeTab === 'browse' && renderBrowsePlans()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'progress' && renderProgress()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xxxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Layout.spacing.md,
  },
  emptyStateText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textTertiary,
  },
  
  // Gradient Header
  gradient: {
    paddingTop: 60,
    paddingBottom: Layout.spacing.lg,
  },
  headerContainer: {
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.white,
  },
  
  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Layout.spacing.lg,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeSegment: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentIcon: {
    marginRight: 4,
  },
  segmentText: {
    fontSize: Layout.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeSegmentText: {
    color: Colors.white,
  },
  
  // Content Wrapper
  contentWrapper: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  
  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
    paddingBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  // Plan Cards
  planCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    marginBottom: Layout.spacing.sm,
  },
  planTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.xs,
  },
  planName: {
    flex: 1,
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: Layout.spacing.sm,
  },
  planCategory: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.sm,
  },
  difficultyBeginner: {
    backgroundColor: '#E8F5E9',
  },
  difficultyIntermediate: {
    backgroundColor: '#FFF3E0',
  },
  difficultyAdvanced: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  planDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
  },
  planMeta: {
    flexDirection: 'row',
    gap: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  equipment: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  
  // History Cards
  historyCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  historyIconText: {
    fontSize: 20,
  },
  historyContent: {
    flex: 1,
  },
  historyPlanName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyStat: {
    alignItems: 'center',
  },
  historyStatLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  historyStatValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  
  // Progress Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.xs,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Period Cards
  periodCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  periodStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  periodStatIcon: {
    fontSize: 24,
  },
  periodStatValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  periodStatLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  
  // Completion Card
  completionCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  completionBar: {
    height: 12,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Layout.spacing.sm,
  },
  completionFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  completionText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default TrainingScreen;
