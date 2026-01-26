/**
 * Next Training Widget
 * 
 * Displays the user's next scheduled training session with contextual messaging.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import assignmentApi from '../../services/api/assignmentApi';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const NextTrainingWidget = ({ userId }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [nextTraining, setNextTraining] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNextTraining();
  }, [userId]);

  const fetchNextTraining = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all assignments (backend doesn't support comma-separated status values)
      const allAssignments = await assignmentApi.getUserAssignments(userId);
      
      // Filter for active and scheduled assignments client-side
      const assignments = allAssignments.filter(a => 
        a.status === 'active' || a.status === 'scheduled'
      );
      
      if (!assignments || assignments.length === 0) {
        setNextTraining(null);
        setLoading(false);
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Separate today's training from future training
      const todaysTraining = [];
      const futureTraining = [];
      
      assignments.forEach(a => {
        let nextOccurrence = null;
        
        if (a.isRecurring && a.daysOfWeek && a.daysOfWeek.length > 0) {
          // For recurring assignments, find the next occurrence
          const currentDayOfWeek = today.getDay();
          const sortedDays = [...a.daysOfWeek].sort((x, y) => x - y);
          
          // Find next occurrence
          let daysUntilNext = null;
          for (const day of sortedDays) {
            if (day === currentDayOfWeek) {
              daysUntilNext = 0;
              break;
            } else if (day > currentDayOfWeek) {
              daysUntilNext = day - currentDayOfWeek;
              break;
            }
          }
          
          // If no future day this week, use first day next week
          if (daysUntilNext === null) {
            daysUntilNext = 7 - currentDayOfWeek + sortedDays[0];
          }
          
          nextOccurrence = new Date(today);
          nextOccurrence.setDate(today.getDate() + daysUntilNext);
        } else {
          // For non-recurring assignments, use the start date
          const startDate = new Date(a.startDate);
          nextOccurrence = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        }
        
        if (nextOccurrence) {
          if (nextOccurrence.getTime() === today.getTime()) {
            todaysTraining.push({ ...a, nextOccurrence });
          } else if (nextOccurrence > today) {
            futureTraining.push({ ...a, nextOccurrence });
          }
        }
      });
      
      // Prioritize today's training, then future training
      let selectedTraining = null;
      
      if (todaysTraining.length > 0) {
        // If there's training today, show the first one
        selectedTraining = todaysTraining[0];
      } else if (futureTraining.length > 0) {
        // Otherwise show the next upcoming training
        futureTraining.sort((a, b) => a.nextOccurrence - b.nextOccurrence);
        selectedTraining = futureTraining[0];
      }
      
      if (selectedTraining) {
        // Ensure we have required data before setting next training
        if (!selectedTraining.programName || !selectedTraining.programId) {
          console.warn('Next training missing required fields:', selectedTraining);
          setNextTraining(null);
        } else {
          setNextTraining({
            planName: selectedTraining.programName,
            scheduledDate: selectedTraining.nextOccurrence || new Date(selectedTraining.startDate),
            duration: 45,
            difficulty: 'Intermediate',
            assignmentId: selectedTraining.assignmentId,
            programId: selectedTraining.programId,
            status: selectedTraining.status,
            isRecurring: selectedTraining.isRecurring
          });
        }
      } else {
        setNextTraining(null);
      }
    } catch (err) {
      console.error('Error fetching next training:', err);
      setError('Unable to load training schedule');
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilTraining = (scheduledDate) => {
    const now = new Date();
    const training = new Date(scheduledDate);
    const diffMs = training - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays === 0 && diffHours < 24) {
      return 'today';
    } else if (diffDays === 1) {
      return 'tomorrow';
    } else if (diffDays < 7) {
      return `in ${diffDays} days`;
    } else {
      return `on ${training.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  const isToday = (scheduledDate) => {
    const now = new Date();
    const training = new Date(scheduledDate);
    return now.toDateString() === training.toDateString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!nextTraining) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📅</Text>
        <View style={styles.content}>
          <Text style={styles.title}>No Upcoming Training</Text>
          <Text style={styles.message}>
            Ready to get started? Browse training plans to schedule your next session.
          </Text>
        </View>
      </View>
    );
  }

  const trainingIsToday = isToday(nextTraining.scheduledDate);
  const timeUntil = getTimeUntilTraining(nextTraining.scheduledDate);

  const handlePress = () => {
    if (!nextTraining) return;
    
    // Always navigate to plan details so user can manually start when ready
    navigation.navigate('Training', {
      screen: 'PlanDetails',
      params: { 
        programId: nextTraining.programId,
        programName: nextTraining.planName,
        assignmentId: nextTraining.assignmentId
      }
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.container, trainingIsToday && styles.containerToday]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {trainingIsToday && <Text style={styles.icon}>⚡</Text>}
      <View style={styles.content}>
        <Text style={styles.badge}>{trainingIsToday ? 'TODAY' : 'UPCOMING'}</Text>
        <Text style={styles.title}>{nextTraining.planName || 'Training Session'}</Text>
        
        {trainingIsToday ? (
          <>
            <Text style={styles.message}>
              Your training is scheduled for today! Tap to start your session. 💪
            </Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>⏱️ {nextTraining.duration} min</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.message}>
              Your next training is {timeUntil}. Tap to view details.
            </Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>{formatDate(nextTraining.scheduledDate)}</Text>
              <Text style={styles.detailText}>⏱️ {nextTraining.duration} min</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Layout.spacing.md,
  },
  containerToday: {
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.primaryLight || '#F0F7FF',
  },
  icon: {
    fontSize: 32,
    marginRight: Layout.spacing.md,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  badge: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Layout.spacing.xs,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  message: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Layout.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  detailText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.error,
  },
});

export default NextTrainingWidget;
