/**
 * Messages Screen
 * 
 * Communications center with inbox, notifications, and shared resources.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import notificationApi from '../../services/api/notificationApi';
import messageApi from '../../services/api/messageApi';
import teamApi from '../../services/api/teamApi';
import InviteDetailModal from '../../components/InviteDetailModal';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

// Mock data
const MOCK_MESSAGES = [
  {
    id: '1',
    type: 'direct',
    from: 'Coach Sarah',
    fromId: 'coach1',
    subject: 'Great job on today\'s training!',
    preview: 'I noticed your improvement in ball control...',
    timestamp: '10 min ago',
    unread: true,
    avatar: '👩‍🏫',
  },
  {
    id: '2',
    type: 'group',
    from: 'U12 Boys Team',
    fromId: 'team1',
    subject: 'Game this Saturday',
    preview: 'Don\'t forget we have a game at 9am...',
    timestamp: '1 hour ago',
    unread: true,
    avatar: '⚽',
    memberCount: 15,
  },
  {
    id: '3',
    type: 'direct',
    from: 'Mike Chen',
    fromId: 'user3',
    subject: 'Training partner?',
    preview: 'Hey, want to practice together this week?',
    timestamp: '3 hours ago',
    unread: false,
    avatar: '👤',
  },
  {
    id: '4',
    type: 'group',
    from: 'Soccer Stars Academy',
    fromId: 'team2',
    subject: 'New training schedule',
    preview: 'Updated schedule for next month is now available...',
    timestamp: 'Yesterday',
    unread: false,
    avatar: '🏆',
    memberCount: 45,
  },
];

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'celebration',
    title: 'Sarah Johnson celebrated your milestone!',
    description: 'You reached Level 5',
    timestamp: '30 min ago',
    icon: '🎉',
    unread: true,
  },
  {
    id: '2',
    type: 'nudge',
    title: 'Coach Sarah sent you a nudge',
    description: 'Complete today\'s Speed & Agility training',
    timestamp: '2 hours ago',
    icon: '👋',
    unread: true,
  },
  {
    id: '3',
    type: 'milestone',
    title: 'Milestone achieved!',
    description: 'You\'ve completed 10 training sessions',
    timestamp: '5 hours ago',
    icon: '🏆',
    unread: false,
  },
  {
    id: '4',
    type: 'team',
    title: 'Added to U12 Boys Team',
    description: 'Welcome to the team!',
    timestamp: 'Yesterday',
    icon: '⚽',
    unread: false,
  },
  {
    id: '5',
    type: 'system',
    title: 'New training plan available',
    description: 'Ball Control Mastery has been assigned to you',
    timestamp: '2 days ago',
    icon: '📋',
    unread: false,
  },
];

const MOCK_RESOURCES = [
  {
    id: '1',
    type: 'form',
    title: 'Weekly Availability Form',
    description: 'Let us know your availability for next week',
    from: 'Coach Sarah',
    team: 'U12 Boys',
    timestamp: '2 hours ago',
    icon: '📋',
    status: 'pending',
  },
  {
    id: '2',
    type: 'document',
    title: 'Team Playbook 2026',
    description: 'Updated strategies and formations',
    from: 'Coach Sarah',
    team: 'U12 Boys',
    timestamp: 'Yesterday',
    icon: '📄',
    fileSize: '2.4 MB',
  },
  {
    id: '3',
    type: 'video',
    title: 'Dribbling Technique Demo',
    description: 'Watch this before tomorrow\'s session',
    from: 'Coach Mike',
    team: 'Soccer Stars Academy',
    timestamp: '2 days ago',
    icon: '🎥',
    duration: '5:32',
  },
  {
    id: '4',
    type: 'link',
    title: 'Tournament Registration',
    description: 'Sign up for Spring Tournament by Friday',
    from: 'Admin',
    team: 'Soccer Stars Academy',
    timestamp: '3 days ago',
    icon: '🔗',
    url: 'https://example.com/register',
  },
  {
    id: '5',
    type: 'form',
    title: 'Injury Report',
    description: 'Report any injuries or concerns',
    from: 'Coach Sarah',
    team: 'U12 Boys',
    timestamp: '1 week ago',
    icon: '📋',
    status: 'completed',
  },
];

const MessagesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('teams');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Teams state
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  // Invite modal state
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedInviteToken, setSelectedInviteToken] = useState(null);

  // Fetch data on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'teams') {
      fetchTeams();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [user?.userId, activeTab, showAllNotifications]);

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await teamApi.getTeams();
      setTeams(response.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchNotifications = async (isRefresh = false) => {
    if (!user?.userId) {
      console.log('MessagesScreen - No userId, skipping fetch');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setNotificationsLoading(true);
      }
      setNotificationsError(null);

      console.log('MessagesScreen - Fetching notifications');
      const result = await notificationApi.getNotifications({
        unreadOnly: !showAllNotifications
      });
      console.log('MessagesScreen - Fetched notifications:', result);

      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (error) {
      console.error('MessagesScreen - Error fetching notifications:', error);
      setNotificationsError(error.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      // Update local state
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      if (!notifications.find(n => n.notification_id === notificationId)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  // Map backend notification type to icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      'celebration': '🎉',
      'nudge': '👋',
      'milestone': '🏆',
      'achievement': '🏆',
      'team': '⚽',
      'assignment': '📋',
      'system': '📋',
      'training': '💪',
      'level_up': '⭐',
    };
    return iconMap[type?.toLowerCase()] || '🔔';
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Filter notifications based on search
  const filteredNotifications = notifications.filter(notif =>
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = (message) => (
    <TouchableOpacity key={message.id} style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{message.avatar}</Text>
          {message.unread && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageTop}>
            <Text style={[styles.messageFrom, message.unread && styles.unreadText]}>
              {message.from}
            </Text>
            <Text style={styles.messageTimestamp}>{message.timestamp}</Text>
          </View>
          <Text style={[styles.messageSubject, message.unread && styles.unreadText]}>
            {message.subject}
          </Text>
          <Text style={styles.messagePreview} numberOfLines={1}>
            {message.preview}
          </Text>
          {message.type === 'group' && (
            <Text style={styles.memberCount}>👥 {message.memberCount} members</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleNotificationTap = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification.notification_id);
    }

    // Handle invitation notifications
    if (notification.type === 'invitation_received' && notification.data) {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        if (data.token) {
          console.log('Opening invite modal for token:', data.token);
          setSelectedInviteToken(data.token);
          setInviteModalVisible(true);
          return;
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    }

    // Handle other action URLs if needed
    if (notification.action_url) {
      console.log('Notification has action_url:', notification.action_url);
      // Could navigate to other screens based on action_url
    }
  };

  const renderNotification = (notification) => (
    <TouchableOpacity 
      key={notification.notification_id} 
      style={styles.notificationCard}
      onPress={() => handleNotificationTap(notification)}
      onLongPress={() => {
        Alert.alert(
          'Notification Options',
          'What would you like to do?',
          [
            { text: 'Cancel', style: 'cancel' },
            !notification.read && {
              text: 'Mark as Read',
              onPress: () => handleMarkAsRead(notification.notification_id)
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => handleDeleteNotification(notification.notification_id)
            },
          ].filter(Boolean)
        );
      }}
    >
      <View style={styles.notificationIconContainer}>
        <Text style={styles.notificationIcon}>{getNotificationIcon(notification.type)}</Text>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !notification.read && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationDescription}>{notification.message}</Text>
        <Text style={styles.notificationTimestamp}>{formatTimestamp(notification.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderResource = (resource) => {
    const getStatusColor = () => {
      if (resource.status === 'pending') return Colors.warning;
      if (resource.status === 'completed') return Colors.success;
      return Colors.textSecondary;
    };

    return (
      <TouchableOpacity key={resource.id} style={styles.resourceCard}>
        <View style={styles.resourceIconContainer}>
          <Text style={styles.resourceIcon}>{resource.icon}</Text>
        </View>
        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{resource.title}</Text>
          <Text style={styles.resourceDescription} numberOfLines={2}>
            {resource.description}
          </Text>
          <View style={styles.resourceMeta}>
            <Text style={styles.resourceFrom}>From: {resource.from}</Text>
            <Text style={styles.resourceTeam}>• {resource.team}</Text>
          </View>
          <View style={styles.resourceFooter}>
            <Text style={styles.resourceTimestamp}>{resource.timestamp}</Text>
            {resource.status && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {resource.status}
                </Text>
              </View>
            )}
            {resource.fileSize && (
              <Text style={styles.resourceExtra}>📦 {resource.fileSize}</Text>
            )}
            {resource.duration && (
              <Text style={styles.resourceExtra}>⏱️ {resource.duration}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTeamCard = ({ item }) => (
    <TouchableOpacity
      style={styles.teamCard}
      onPress={() => navigation.navigate('TeamMessages', {
        teamId: item.id,
        teamName: item.name
      })}
    >
      <View style={styles.teamIconContainer}>
        <Text style={styles.teamIcon}>{item.sport === 'soccer' ? '⚽' : '🏀'}</Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.teamSport}>{item.sport || 'Sport'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (activeTab === 'organizations') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🏢</Text>
          <Text style={styles.emptyStateText}>Organization Messages</Text>
          <Text style={styles.emptyStateSubtext}>Coming soon!</Text>
        </View>
      );
    }

    if (activeTab === 'direct') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>✉️</Text>
          <Text style={styles.emptyStateText}>Direct Messages</Text>
          <Text style={styles.emptyStateSubtext}>Coming soon!</Text>
        </View>
      );
    }

    if (activeTab === 'notifications') {
      if (notificationsLoading && !refreshing) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        );
      }

      if (notificationsError) {
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{notificationsError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View>
          {/* Filter Toggle */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, !showAllNotifications && styles.filterButtonActive]}
              onPress={() => setShowAllNotifications(false)}
            >
              <Text style={[styles.filterButtonText, !showAllNotifications && styles.filterButtonTextActive]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, showAllNotifications && styles.filterButtonActive]}
              onPress={() => setShowAllNotifications(true)}
            >
              <Text style={[styles.filterButtonText, showAllNotifications && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                <Text style={styles.markAllButtonText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔔</Text>
              <Text style={styles.emptyStateText}>
                {showAllNotifications ? 'No notifications' : 'No unread notifications'}
              </Text>
              {!showAllNotifications && notifications.length > 0 && (
                <TouchableOpacity onPress={() => setShowAllNotifications(true)}>
                  <Text style={styles.emptyStateLink}>View all notifications</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {filteredNotifications.map(renderNotification)}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight, Colors.background]}
        locations={[0, 0.3, 1]}
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'teams' && styles.tabButtonActive]}
            onPress={() => setActiveTab('teams')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'teams' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabButtonText, activeTab === 'teams' && styles.tabButtonTextActive]}>Teams</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'organizations' && styles.tabButtonActive]}
            onPress={() => setActiveTab('organizations')}
          >
            <Ionicons name="business" size={20} color={activeTab === 'organizations' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabButtonText, activeTab === 'organizations' && styles.tabButtonTextActive]}>Orgs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'direct' && styles.tabButtonActive]}
            onPress={() => setActiveTab('direct')}
          >
            <Ionicons name="mail" size={20} color={activeTab === 'direct' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabButtonText, activeTab === 'direct' && styles.tabButtonTextActive]}>Direct</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
            onPress={() => setActiveTab('notifications')}
          >
            <Ionicons name="notifications" size={20} color={activeTab === 'notifications' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabButtonText, activeTab === 'notifications' && styles.tabButtonTextActive]}>Alerts</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.contentWrapper}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIconLeft} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {activeTab === 'teams' ? (
          teamsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading teams...</Text>
            </View>
          ) : teams.length === 0 ? (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
            >
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateText}>No teams yet</Text>
                <Text style={styles.emptyStateSubtext}>Join a team to start messaging!</Text>
              </View>
            </ScrollView>
          ) : (
            <FlatList
              data={teams}
              renderItem={renderTeamCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.contentContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
            />
          )
        ) : (
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          >
            {renderTabContent()}
          </ScrollView>
        )}
      </View>

      {/* Invite Detail Modal */}
      <InviteDetailModal
        visible={inviteModalVisible}
        onClose={() => {
          setInviteModalVisible(false);
          setSelectedInviteToken(null);
        }}
        invitationToken={selectedInviteToken}
        onAccepted={() => {
          // Refresh notifications after accepting/declining invite
          fetchNotifications();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  
  // Tab Header
  tabHeader: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
  },
  tabHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  tabHeaderTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: Layout.spacing.sm,
  },
  tabHeaderSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Content Wrapper
  contentWrapper: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  
  // Search
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
  searchIconLeft: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  
  // Messages
  messageCard: {
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
  messageHeader: {
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Layout.spacing.md,
  },
  avatar: {
    fontSize: 40,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  messageContent: {
    flex: 1,
  },
  messageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageFrom: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  messageTimestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  messageSubject: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  
  // Notifications
  notificationCard: {
    flexDirection: 'row',
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
  notificationIconContainer: {
    position: 'relative',
    marginRight: Layout.spacing.md,
  },
  notificationIcon: {
    fontSize: 32,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  
  // Resources
  resourceCard: {
    flexDirection: 'row',
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
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  resourceIcon: {
    fontSize: 24,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resourceFrom: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  resourceTeam: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  resourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  resourceTimestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  statusText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resourceExtra: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  
  // Filter Container
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  filterButton: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  markAllButtonText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
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
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
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
    marginBottom: Layout.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Layout.fontSize.md,
    color: Colors.textTertiary,
  },
  emptyStateLink: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Layout.spacing.sm,
  },
  
  bottomPadding: {
    height: Layout.spacing.xl,
  },
  
  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabButtonText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabButtonTextActive: {
    color: Colors.white,
  },
  
  // Team Cards
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  teamIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  teamIcon: {
    fontSize: 24,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  teamSport: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
});

export default MessagesScreen;
