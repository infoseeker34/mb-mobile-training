/**
 * Calendar Screen
 * 
 * Calendar view showing all training sessions and team events.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import assignmentApi from '../../services/api/assignmentApi';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

// Helper function to expand recurring assignments into multiple calendar events
const expandRecurringAssignment = (assignment) => {
  const events = [];
  const startDate = new Date(assignment.startDate);
  const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days if no end date
  const completedDates = assignment.completedDates || [];
  
  // Determine event type
  const type = assignment.assignmentType === 'personal' ? 'training' : 'team';
  
  if (!assignment.isRecurring) {
    // Non-recurring: single event
    const dateString = startDate.toISOString().split('T')[0];
    const isCompleted = completedDates.includes(dateString);
    
    events.push({
      id: `${assignment.assignmentId}-${dateString}`,
      assignmentId: assignment.assignmentId,
      date: dateString,
      type: type,
      title: assignment.programName || 'Training Plan',
      description: assignment.programDescription,
      time: assignment.isAllDay ? 'All Day' : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: assignment.estimatedDuration || 30,
      teamId: assignment.teamId || null,
      teamName: assignment.teamName || null,
      status: assignment.status,
      isRecurring: false,
      isAllDay: assignment.isAllDay ?? true,
      assignedBy: assignment.assignedByName,
      isCompleted: isCompleted,
    });
  } else {
    // Recurring: generate events based on frequency
    const currentDate = new Date(startDate);
    const daysOfWeek = assignment.daysOfWeek || []; // Array of day numbers: 0=Sunday, 1=Monday, etc.
    
    while (currentDate <= endDate) {
      let shouldAddEvent = false;
      
      if (assignment.recurrenceFrequency === 'daily') {
        shouldAddEvent = true;
      } else if (assignment.recurrenceFrequency === 'weekly') {
        // Check if current day matches any of the specified days of week
        const dayOfWeek = currentDate.getDay();
        shouldAddEvent = daysOfWeek.length === 0 || daysOfWeek.includes(dayOfWeek);
      } else if (assignment.recurrenceFrequency === 'monthly') {
        // Monthly on the same day of month as start date
        shouldAddEvent = currentDate.getDate() === startDate.getDate();
      }
      
      if (shouldAddEvent) {
        const dateString = currentDate.toISOString().split('T')[0];
        const isCompleted = completedDates.includes(dateString);
        
        events.push({
          id: `${assignment.assignmentId}-${dateString}`,
          assignmentId: assignment.assignmentId,
          date: dateString,
          type: type,
          title: assignment.programName || 'Training Plan',
          description: assignment.programDescription,
          time: assignment.isAllDay ? 'All Day' : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          duration: assignment.estimatedDuration || 30,
          teamId: assignment.teamId || null,
          teamName: assignment.teamName || null,
          status: assignment.status,
          isRecurring: true,
          isAllDay: assignment.isAllDay ?? true,
          recurrenceFrequency: assignment.recurrenceFrequency,
          assignedBy: assignment.assignedByName,
          isCompleted: isCompleted,
        });
      }
      
      // Increment date based on frequency
      if (assignment.recurrenceFrequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (assignment.recurrenceFrequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (assignment.recurrenceFrequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        // Unknown frequency, break to avoid infinite loop
        break;
      }
    }
  }
  
  return events;
};

const CalendarScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    eventTypes: [], // ['training', 'team', 'event']
    teams: [], // team IDs
    dateStart: 'today', // 'all', 'today', 'week', 'month'
  });
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get current date info
  const today = new Date();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Fetch assignments from API
  const fetchAssignments = async () => {
    console.log('CalendarScreen - fetchAssignments called');
    console.log('CalendarScreen - user object:', user);
    console.log('CalendarScreen - user.userId:', user?.userId);
    
    if (!user?.userId) {
      console.log('CalendarScreen - No userId found, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('CalendarScreen - Calling API with userId:', user.userId);
      // Fetch all assignments (scheduled, active) - exclude completed/cancelled via backend
      const fetchedAssignments = await assignmentApi.getUserAssignments(user.userId);
      console.log('CalendarScreen - Fetched assignments:', fetchedAssignments);
      
      setAssignments(fetchedAssignments);
      
      // Convert assignments to calendar events, expanding recurring assignments
      const calendarEvents = [];
      fetchedAssignments.forEach(assignment => {
        const expandedEvents = expandRecurringAssignment(assignment);
        calendarEvents.push(...expandedEvents);
      });
      
      // Sort events by date
      calendarEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setEvents(calendarEvents);
      
      // Extract unique teams from assignments
      const uniqueTeams = {};
      fetchedAssignments.forEach(assignment => {
        if (assignment.teamId && assignment.teamName) {
          uniqueTeams[assignment.teamId] = {
            id: assignment.teamId,
            name: assignment.teamName,
          };
        }
      });
      setTeams(Object.values(uniqueTeams));
      
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load assignments on mount and when user changes
  useEffect(() => {
    fetchAssignments();
  }, [user?.userId]);

  // Refresh when screen comes into focus (navigating back to Calendar tab)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.userId) {
        fetchAssignments();
      }
    }, [user?.userId])
  );

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  // Apply filters to events
  const filteredEvents = events.filter(event => {
    // Filter by event type
    if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.type)) {
      return false;
    }

    // Filter by team
    if (filters.teams.length > 0) {
      if (!event.teamId || !filters.teams.includes(event.teamId)) {
        return false;
      }
    }

    // Filter by date start (show events from selected date forward)
    if (filters.dateStart !== 'all') {
      const eventDate = new Date(event.date);
      const todayDate = new Date(today.toDateString());
      
      if (filters.dateStart === 'today') {
        // Show events from today forward
        if (eventDate < todayDate) {
          return false;
        }
      } else if (filters.dateStart === 'week') {
        // Show events from 1 week from now forward
        const weekFromNow = new Date(todayDate);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        if (eventDate < weekFromNow) {
          return false;
        }
      } else if (filters.dateStart === 'month') {
        // Show events from 1 month from now forward
        const monthFromNow = new Date(todayDate);
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        if (eventDate < monthFromNow) {
          return false;
        }
      }
    }

    return true;
  });

  // Group filtered events by date
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});

  // Get sorted dates
  const sortedDates = Object.keys(eventsByDate).sort();

  // Toggle filter
  const toggleEventTypeFilter = (type) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter(t => t !== type)
        : [...prev.eventTypes, type]
    }));
  };

  const toggleTeamFilter = (teamId) => {
    setFilters(prev => ({
      ...prev,
      teams: prev.teams.includes(teamId)
        ? prev.teams.filter(t => t !== teamId)
        : [...prev.teams, teamId]
    }));
  };

  const setDateStartFilter = (start) => {
    setFilters(prev => ({ ...prev, dateStart: start }));
  };

  const clearFilters = () => {
    setFilters({
      eventTypes: [],
      teams: [],
      dateStart: 'today',
    });
  };

  const hasActiveFilters = filters.eventTypes.length > 0 || filters.teams.length > 0 || filters.dateStart !== 'today';

  // Get event type icon and color
  const getEventStyle = (type) => {
    switch (type) {
      case 'training':
        return { iconName: 'barbell', color: Colors.primary, label: 'Personal' };
      case 'team':
        return { iconName: 'people', color: Colors.success, label: 'Team' };
      case 'event':
        return { iconName: 'calendar', color: Colors.warning, label: 'Event' };
      default:
        return { iconName: 'bookmark', color: Colors.textSecondary, label: 'Event' };
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isToday = date.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if date is today
  const isToday = (dateString) => {
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const renderFilterPanel = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filterPanel}>
        {/* Event Type Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Event Type</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, filters.eventTypes.includes('training') && styles.filterChipActive]}
              onPress={() => toggleEventTypeFilter('training')}
            >
              <Ionicons 
                name="barbell" 
                size={16} 
                color={filters.eventTypes.includes('training') ? Colors.white : Colors.text} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, filters.eventTypes.includes('training') && styles.filterChipTextActive]}>
                Personal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filters.eventTypes.includes('team') && styles.filterChipActive]}
              onPress={() => toggleEventTypeFilter('team')}
            >
              <Ionicons 
                name="people" 
                size={16} 
                color={filters.eventTypes.includes('team') ? Colors.white : Colors.text} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, filters.eventTypes.includes('team') && styles.filterChipTextActive]}>
                Team
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Team</Text>
          <View style={styles.filterChips}>
            {teams.length === 0 ? (
              <Text style={styles.noTeamsText}>No team assignments</Text>
            ) : (
              teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[styles.filterChip, filters.teams.includes(team.id) && styles.filterChipActive]}
                onPress={() => toggleTeamFilter(team.id)}
              >
                <Text style={[styles.filterChipText, filters.teams.includes(team.id) && styles.filterChipTextActive]}>
                  {team.name}
                </Text>
              </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Date Start Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Date Start</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, filters.dateStart === 'all' && styles.filterChipActive]}
              onPress={() => setDateStartFilter('all')}
            >
              <Text style={[styles.filterChipText, filters.dateStart === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filters.dateStart === 'today' && styles.filterChipActive]}
              onPress={() => setDateStartFilter('today')}
            >
              <Text style={[styles.filterChipText, filters.dateStart === 'today' && styles.filterChipTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filters.dateStart === 'week' && styles.filterChipActive]}
              onPress={() => setDateStartFilter('week')}
            >
              <Text style={[styles.filterChipText, filters.dateStart === 'week' && styles.filterChipTextActive]}>
                Next Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filters.dateStart === 'month' && styles.filterChipActive]}
              onPress={() => setDateStartFilter('month')}
            >
              <Text style={[styles.filterChipText, filters.dateStart === 'month' && styles.filterChipTextActive]}>
                Next Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEvent = (event) => {
    const style = getEventStyle(event.type);
    const team = event.teamName ? { name: event.teamName } : null;
    
    return (
      <TouchableOpacity
        key={event.id}
        style={[
          styles.eventCard,
          event.isCompleted && styles.eventCardCompleted
        ]}
        onPress={() => {
          // Find the original assignment to get the programId
          const assignment = assignments.find(a => a.assignmentId === event.assignmentId);
          navigation.navigate('PlanDetails', {
            assignmentId: event.assignmentId,
            programId: assignment?.programId || event.assignmentId,
            programName: event.title,
            date: event.date,
          });
        }}
      >
        <View style={[styles.eventIconContainer, { backgroundColor: style.color + '20' }]}>
          <Ionicons name={style.iconName} size={20} color={style.color} />
        </View>
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleRow}>
              <Text style={[styles.eventTitle, event.isCompleted && styles.eventTitleCompleted]}>
                {event.title}
              </Text>
              {event.isRecurring && (
                <Ionicons 
                  name="repeat" 
                  size={16} 
                  color={Colors.textSecondary} 
                  style={{ marginLeft: 6 }}
                />
              )}
              {event.isCompleted && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={Colors.success} 
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            <View style={[styles.eventTypeBadge, { backgroundColor: style.color + '20' }]}>
              <Text style={[styles.eventTypeText, { color: style.color }]}>
                {style.label}
              </Text>
            </View>
          </View>
          
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.eventTime}> {event.time}</Text>
            </View>
            <View style={styles.eventMetaItem}>
              <Ionicons name="timer-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.eventDuration}> {event.duration} min</Text>
            </View>
            {team && (
              <View style={styles.eventMetaItem}>
                <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.eventTeam}> {team.name}</Text>
              </View>
            )}
            {event.assignedBy && (
              <View style={styles.eventMetaItem}>
                <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.eventAssignedBy}> by {event.assignedBy}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateSection = (dateString) => {
    const events = eventsByDate[dateString];
    const todayDate = isToday(dateString);

    return (
      <View key={dateString} style={styles.dateSection}>
        <View style={[styles.dateBadge, todayDate && styles.todayBadge]}>
          <Text style={[styles.dateText, todayDate && styles.todayText]}>
            {formatDate(dateString)}
          </Text>
          <Text style={[styles.eventCount, todayDate && styles.todayText]}>
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </Text>
        </View>
        
        {events.map(renderEvent)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Calendar</Text>
            <Text style={styles.headerSubtitle}>{currentMonth}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? Colors.textTertiary : Colors.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons 
                name={showFilters ? 'close' : 'filter'} 
                size={16} 
                color={hasActiveFilters ? Colors.white : Colors.text} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterButtonText, hasActiveFilters && { color: Colors.white }]}>
                Filter
              </Text>
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {filters.eventTypes.length + filters.teams.length + (filters.dateStart !== 'today' ? 1 : 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderFilterPanel()}

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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading assignments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : sortedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No assignments found</Text>
            <Text style={styles.emptyStateSubtext}>
              {hasActiveFilters ? 'Try adjusting your filters' : 'Your coach will assign training plans soon'}
            </Text>
          </View>
        ) : (
          sortedDates.map(renderDateSection)
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  
  // Header Buttons
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  filterBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.xs,
  },
  filterBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: 'bold',
    color: Colors.textInverse,
  },
  
  // Filter Panel
  filterPanel: {
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterSection: {
    marginBottom: Layout.spacing.md,
  },
  filterSectionTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  clearFiltersButton: {
    backgroundColor: Colors.error,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  clearFiltersText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  noTeamsText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
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
  
  content: {
    flex: 1,
  },
  
  // Date Section
  dateSection: {
    marginBottom: Layout.spacing.lg,
  },
  dateBadge: {
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.md,
  },
  todayBadge: {
    backgroundColor: Colors.primary,
  },
  dateText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  todayText: {
    color: Colors.textInverse,
  },
  eventCount: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  // Event Card
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.xs,
  },
  eventTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  eventTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  eventTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  eventCardCompleted: {
    opacity: 0.7,
    backgroundColor: Colors.surface,
  },
  eventTypeBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.sm,
  },
  eventTypeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  eventDuration: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  eventTeam: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  eventAssignedBy: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  bottomPadding: {
    height: Layout.spacing.xl,
  },
});

export default CalendarScreen;
