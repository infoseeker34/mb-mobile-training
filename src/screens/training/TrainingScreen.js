/**
 * Training Screen
 * 
 * Main training hub with tabs for browsing plans, viewing history, and tracking progress.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import planApi from '../../services/api/planApi';
import sessionApi from '../../services/api/sessionApi';
import progressApi from '../../services/api/progressApi';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Browse tab state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);
  const [plansTotal, setPlansTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // History tab state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Progress tab state
  const [progressData, setProgressData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);

  // Fetch plans from API
  const fetchPlans = async (isRefresh = false) => {
    if (!user?.userId) {
      console.log('TrainingScreen - No userId, skipping fetch');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setPlansLoading(true);
      }
      setPlansError(null);

      const params = {
        visibility: 'public', // Show public plans for browsing
        sortBy: 'recent',
        sortOrder: 'desc',
        limit: 50,
      };

      // Add search query if present
      if (searchQuery.trim()) {
        params.searchQuery = searchQuery.trim();
      }

      console.log('TrainingScreen - Fetching plans with params:', params);
      const result = await planApi.browsePrograms(params);
      console.log('TrainingScreen - Fetched plans:', result);

      setPlans(result.plans || []);
      setPlansTotal(result.total || 0);
    } catch (error) {
      console.error('TrainingScreen - Error fetching plans:', error);
      setPlansError(error.message || 'Failed to load training plans');
    } finally {
      setPlansLoading(false);
      setRefreshing(false);
    }
  };

  // Load plans on mount and when search changes
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchPlans();
    } else if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'progress') {
      fetchProgress();
    }
  }, [user?.userId, activeTab]);

  // Debounced search
  useEffect(() => {
    if (activeTab === 'browse') {
      const timeoutId = setTimeout(() => {
        fetchPlans();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === 'browse') {
      fetchPlans(true);
    } else if (activeTab === 'history') {
      fetchHistory(true);
    } else if (activeTab === 'progress') {
      fetchProgress(true);
    }
  };

  const fetchHistory = async (isRefresh = false) => {
    if (!user?.userId) {
      console.log('TrainingScreen - No userId, skipping history fetch');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setHistoryLoading(true);
      }
      setHistoryError(null);

      console.log('TrainingScreen - Fetching session history');
      const result = await sessionApi.getSessionHistory({
        limit: 50,
        offset: 0,
      });
      console.log('TrainingScreen - Fetched history:', result);

      setHistory(result.sessions || []);
    } catch (error) {
      console.error('TrainingScreen - Error fetching history:', error);
      setHistoryError(error.message || 'Failed to load session history');
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProgress = async (isRefresh = false) => {
    if (!user?.userId) {
      console.log('TrainingScreen - No userId, skipping progress fetch');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setProgressLoading(true);
      }
      setProgressError(null);

      console.log('TrainingScreen - Fetching progress data');
      const [progress, streak] = await Promise.all([
        progressApi.getPlayerProgress(),
        progressApi.getStreakData().catch(() => ({ currentStreak: 0, longestStreak: 0 }))
      ]);
      
      console.log('TrainingScreen - Fetched progress:', progress);
      console.log('TrainingScreen - Fetched streak:', streak);

      setProgressData(progress);
      setStreakData(streak);
    } catch (error) {
      console.error('TrainingScreen - Error fetching progress:', error);
      setProgressError(error.message || 'Failed to load progress data');
    } finally {
      setProgressLoading(false);
      setRefreshing(false);
    }
  };

  // Map API data to UI format
  const mapPlanToUI = (plan) => ({
    id: plan.programId,
    name: plan.name,
    category: plan.sportCategory,
    difficulty: plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1),
    duration: plan.estimatedDuration,
    sessions: plan.timesCompleted || 0,
    description: plan.description || 'No description available',
    exercises: 0, // Not available in API response
    equipment: '', // Not available in API response
  });

  // Filter plans based on search (client-side for now)
  const filteredPlans = plans.map(mapPlanToUI);

  // Filter history based on search
  const filteredHistory = history.filter(session =>
    (session.programName || '').toLowerCase().includes(searchQuery.toLowerCase())
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
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discover Training Plans</Text>
        <Text style={styles.sectionSubtitle}>
          {plansTotal > 0 ? `${plansTotal} plans available` : 'Browse and explore training plans'}
        </Text>
      </View>

      {plansLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      ) : plansError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{plansError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPlans()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>No plans found</Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery ? 'Try a different search term' : 'Check back later for new plans'}
          </Text>
        </View>
      ) : (
        filteredPlans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={styles.planCard}
          onPress={() => {
            navigation.navigate('PlanDetails', {
              programId: plan.id,
              programName: plan.name,
            });
          }}
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
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training History</Text>
        <Text style={styles.sectionSubtitle}>
          Your completed training sessions
        </Text>
      </View>

      {historyLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : historyError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchHistory()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateText}>No sessions found</Text>
          <Text style={styles.emptyStateSubtext}>
            {searchQuery ? 'Try a different search term' : 'Complete a training session to see it here'}
          </Text>
        </View>
      ) : (
        filteredHistory.map((session) => (
        <TouchableOpacity
          key={session.sessionId}
          style={styles.historyCard}
          onPress={() => {}}
        >
          <View style={styles.historyHeader}>
            <View style={styles.historyIcon}>
              <Text style={styles.historyIconText}>
                {session.status === 'completed' ? '✅' : '⚠️'}
              </Text>
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyPlanName}>{session.programName || 'Unknown Program'}</Text>
              <Text style={styles.historyDate}>
                {new Date(session.completedAt || session.startedAt).toLocaleDateString('en-US', {
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
              <Text style={styles.historyStatValue}>{session.durationMinutes || 0} min</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatLabel}>Completion</Text>
              <Text style={styles.historyStatValue}>{session.completionPercentage || 0}%</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatLabel}>XP Earned</Text>
              <Text style={styles.historyStatValue}>+{session.xpEarned || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>
        ))
      )}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderProgress = () => {
    // Calculate period stats from history
    const calculatePeriodStats = (days) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const periodSessions = history.filter(session => {
        const sessionDate = new Date(session.completedAt || session.startedAt);
        return sessionDate >= cutoffDate;
      });
      
      return {
        sessions: periodSessions.length,
        xp: periodSessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0),
        minutes: periodSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
      };
    };
    
    const thisWeek = calculatePeriodStats(7);
    const thisMonth = calculatePeriodStats(30);
    const averageDuration = progressData?.totalSessionsCompleted > 0
      ? Math.round(progressData.totalTrainingTime / progressData.totalSessionsCompleted)
      : 0;
    
    return (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <Text style={styles.sectionSubtitle}>
          Track your training journey
        </Text>
      </View>

      {progressLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      ) : progressError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{progressError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProgress()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
      {/* Overall Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progressData?.totalSessionsCompleted || 0}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progressData?.totalXP || 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streakData?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{averageDuration}</Text>
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
              <Text style={styles.periodStatValue}>{thisWeek.sessions}</Text>
              <Text style={styles.periodStatLabel}>Sessions</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⚡</Text>
            <View>
              <Text style={styles.periodStatValue}>{thisWeek.xp}</Text>
              <Text style={styles.periodStatLabel}>XP Earned</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⏱️</Text>
            <View>
              <Text style={styles.periodStatValue}>{thisWeek.minutes}</Text>
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
              <Text style={styles.periodStatValue}>{thisMonth.sessions}</Text>
              <Text style={styles.periodStatLabel}>Sessions</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⚡</Text>
            <View>
              <Text style={styles.periodStatValue}>{thisMonth.xp}</Text>
              <Text style={styles.periodStatLabel}>XP Earned</Text>
            </View>
          </View>
          <View style={styles.periodStat}>
            <Text style={styles.periodStatIcon}>⏱️</Text>
            <View>
              <Text style={styles.periodStatValue}>{thisMonth.minutes}</Text>
              <Text style={styles.periodStatLabel}>Minutes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Level Info */}
      <View style={styles.completionCard}>
        <Text style={styles.completionTitle}>Level Progress</Text>
        <View style={styles.levelInfo}>
          <Text style={styles.levelText}>Level {progressData?.currentLevel || 1}</Text>
          <Text style={styles.tierText}>{progressData?.tierName || 'Beginner'}</Text>
        </View>
        <View style={styles.completionBar}>
          <View
            style={[
              styles.completionFill,
              { width: `${progressData?.xpToNextLevel ? ((progressData.totalXP % 100) / progressData.xpToNextLevel * 100) : 0}%` }
            ]}
          />
        </View>
        <Text style={styles.completionText}>
          {progressData?.totalXP || 0} XP • {progressData?.xpToNextLevel || 100} to next level
        </Text>
      </View>
      </>
      )}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
    );
  };

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
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xxxl,
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
  },
  
  // Error State
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xxxl,
    paddingHorizontal: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.md,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  retryButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
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
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  levelText: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tierText: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Bottom Padding
  bottomPadding: {
    height: Layout.spacing.xl,
  },
});

export default TrainingScreen;
