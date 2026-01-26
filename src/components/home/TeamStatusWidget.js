/**
 * Team Status Widget
 * 
 * Displays team streak, completion stats, and member nudge functionality
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import teamApi from '../../services/api/teamApi';
import teamActivityApi from '../../services/api/teamActivityApi';
import assignmentApi from '../../services/api/assignmentApi';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const TeamStatusWidget = ({ teamId, teamName, userId }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamStreak, setTeamStreak] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [todaysAssignment, setTodaysAssignment] = useState(null);
  const [completionStats, setCompletionStats] = useState({ completed: 0, total: 0 });
  const [completedUserIds, setCompletedUserIds] = useState(new Set());
  const [nudgedMembers, setNudgedMembers] = useState(new Set());

  useEffect(() => {
    fetchTeamData();
  }, [teamId, userId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const members = await teamApi.getTeamMembers(teamId);
      console.log('TeamStatusWidget - Raw members data:', JSON.stringify(members, null, 2));
      if (members && members.length > 0) {
        console.log('TeamStatusWidget - First member:', members[0]);
        console.log('TeamStatusWidget - First member keys:', Object.keys(members[0]));
      }
      setTeamMembers(members || []);
      
      // Get all user assignments to find today's team assignment
      const allAssignments = await assignmentApi.getUserAssignments(userId);
      const teamAssignments = allAssignments.filter(a => 
        a.teamId === teamId && 
        (a.status === 'active' || a.status === 'scheduled')
      );
      
      // Find today's assignment
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todaysTeamAssignment = null;
      for (const assignment of teamAssignments) {
        if (assignment.isRecurring && assignment.daysOfWeek) {
          const currentDay = today.getDay();
          if (assignment.daysOfWeek.includes(currentDay)) {
            todaysTeamAssignment = assignment;
            break;
          }
        } else {
          const assignmentDate = new Date(assignment.startDate);
          assignmentDate.setHours(0, 0, 0, 0);
          if (assignmentDate.getTime() === today.getTime()) {
            todaysTeamAssignment = assignment;
            break;
          }
        }
      }
      
      setTodaysAssignment(todaysTeamAssignment);
      
      // Fetch today's nudge history and completion stats if we have an assignment
      if (todaysTeamAssignment?.assignmentId) {
        try {
          const nudges = await teamActivityApi.getTodaysNudges(todaysTeamAssignment.assignmentId);
          const nudgedUserIds = new Set(nudges.map(n => n.toUserId));
          setNudgedMembers(nudgedUserIds);
        } catch (error) {
          console.error('Error fetching nudge history:', error);
        }

        // Fetch real completion stats
        try {
          const completionStats = await teamActivityApi.getTodaysAssignmentCompletions(todaysTeamAssignment.assignmentId);
          setCompletionStats({
            completed: completionStats.completed,
            total: completionStats.total
          });
          // Store which users have completed
          setCompletedUserIds(new Set(completionStats.completedUserIds || []));
        } catch (error) {
          console.error('Error fetching completion stats:', error);
          // Fallback to member count
          setCompletionStats({
            completed: 0,
            total: members?.length || 0
          });
          setCompletedUserIds(new Set());
        }
      } else {
        // No assignment today, set stats to 0
        setCompletionStats({
          completed: 0,
          total: members?.length || 0
        });
      }
      
      // Fetch real team streak data
      try {
        const streakData = await teamApi.getTeamStreak(teamId);
        setTeamStreak(streakData?.currentStreak || 0);
      } catch (error) {
        console.error('Error fetching team streak:', error);
        setTeamStreak(0);
      }
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Unable to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleNudge = async (memberId, memberName) => {
    if (!todaysAssignment || !todaysAssignment.assignmentId) {
      Alert.alert('Error', 'No active assignment found for today.');
      return;
    }
    
    try {
      // Send nudge via API
      await teamActivityApi.sendNudge(
        memberId,
        todaysAssignment.assignmentId,
        `${memberName}, your team is counting on you! Complete today's training.`
      );
      
      // Mark as nudged locally
      setNudgedMembers(prev => new Set([...prev, memberId]));
      
      Alert.alert(
        'Nudge Sent! 👋',
        `${memberName} will receive a notification to complete their training.`
      );
    } catch (error) {
      console.error('Error sending nudge:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send nudge. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handlePress = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.teamInfo}>
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.teamName}>{teamName}</Text>
          </View>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.teamInfo}>
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.teamName}>{teamName}</Text>
          </View>
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            fetchTeamData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Collapsed Header */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
          <Ionicons name="people" size={20} color={Colors.primary} />
          <Text style={styles.teamName}>{teamName}</Text>
        </View>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={Colors.textSecondary} 
        />
      </View>

      {/* Team Stats - Always Visible */}
      <View style={styles.statsRow}>
        {/* Team Streak */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flame" size={20} color={Colors.streakFire} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{teamStreak}</Text>
            <Text style={styles.statLabel}>Team Streak</Text>
          </View>
        </View>

        {/* Completion Stats */}
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              {completionStats.completed}/{completionStats.total}
            </Text>
            <Text style={styles.statLabel}>
              {todaysAssignment ? 'Completed Today' : 'Team Members'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded Content - Member List with Nudge Options */}
      {expanded && (
        <View style={styles.expandedContent}>
          {todaysAssignment ? (
            <>
              <View style={styles.assignmentHeader}>
                <Text style={styles.assignmentTitle}>Today's Training</Text>
                <Text style={styles.assignmentName}>{todaysAssignment.programName}</Text>
              </View>

              <View style={styles.membersList}>
                <Text style={styles.membersListTitle}>Team Members</Text>
                {teamMembers.map((member) => {
                  const isCompleted = completedUserIds.has(member.user_id);
                  const isNudged = nudgedMembers.has(member.user_id);
                  const isSelf = member.user_id === userId;
                  
                  return (
                    <View key={member.user_id} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <View style={[
                          styles.memberStatusDot,
                          isCompleted && styles.memberStatusDotCompleted
                        ]} />
                        <Text style={styles.memberName}>{member.display_name || member.name}</Text>
                        {isSelf && <Text style={styles.youBadge}>(You)</Text>}
                      </View>
                      
                      {!isCompleted && !isSelf && (
                        <TouchableOpacity
                          style={[
                            styles.nudgeButton,
                            isNudged && styles.nudgeButtonDisabled
                          ]}
                          onPress={() => handleNudge(member.user_id, member.display_name || member.name)}
                          disabled={isNudged}
                        >
                          <Text style={[
                            styles.nudgeButtonText,
                            isNudged && styles.nudgeButtonTextDisabled
                          ]}>
                            {isNudged ? '✓ Nudged' : '👋 Nudge'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                          <Text style={styles.completedText}>Done</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.noTrainingMessage}>
              <Text style={styles.noTrainingText}>
                No training scheduled for today
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    flex: 1,
  },
  teamName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.sm,
  },
  expandedContent: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  assignmentHeader: {
    marginBottom: Layout.spacing.md,
  },
  assignmentTitle: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.spacing.xs,
  },
  assignmentName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  membersList: {
    gap: Layout.spacing.xs,
  },
  membersListTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.xs,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    flex: 1,
  },
  memberStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  memberStatusDotCompleted: {
    backgroundColor: Colors.success,
  },
  memberName: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  youBadge: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.xs,
  },
  nudgeButton: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  nudgeButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  nudgeButtonText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  nudgeButtonTextDisabled: {
    color: Colors.textTertiary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  completedText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.success,
  },
  noTrainingMessage: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  noTrainingText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    alignSelf: 'center',
    marginTop: Layout.spacing.sm,
  },
  retryButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeamStatusWidget;
