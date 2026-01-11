/**
 * Next Training Widget
 * 
 * Displays the user's next scheduled training session with contextual messaging.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const NextTrainingWidget = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [nextTraining, setNextTraining] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNextTraining();
  }, [userId]);

  const fetchNextTraining = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when endpoint is ready
      // const response = await trainingApi.getNextScheduledTraining();
      
      // Mock data for now
      const mockTraining = {
        planName: 'Speed & Agility Drills',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 45,
        difficulty: 'Intermediate'
      };
      
      setNextTraining(mockTraining);
      setError(null);
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

  return (
    <View style={[styles.container, trainingIsToday && styles.containerToday]}>
      <Text style={styles.icon}>{trainingIsToday ? '⚡' : '📅'}</Text>
      <View style={styles.content}>
        <Text style={styles.badge}>{trainingIsToday ? 'TODAY' : 'UPCOMING'}</Text>
        <Text style={styles.title}>{nextTraining.planName}</Text>
        
        {trainingIsToday ? (
          <Text style={styles.message}>
            Your training is scheduled for today! Time to bring your A-game. 💪
          </Text>
        ) : (
          <>
            <Text style={styles.message}>
              Take it easy and stretch today. Your next training is {timeUntil}.
            </Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>📆 {formatDate(nextTraining.scheduledDate)}</Text>
              <Text style={styles.detailText}>⏱️ {nextTraining.duration} min</Text>
            </View>
          </>
        )}
      </View>
    </View>
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
