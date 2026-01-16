/**
 * Messages Screen
 * 
 * Communications center with inbox, notifications, and shared resources.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search
  const filteredMessages = MOCK_MESSAGES.filter(msg =>
    msg.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotifications = MOCK_NOTIFICATIONS.filter(notif =>
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = MOCK_RESOURCES.filter(res =>
    res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadMessagesCount = MOCK_MESSAGES.filter(m => m.unread).length;
  const unreadNotificationsCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
  const pendingResourcesCount = MOCK_RESOURCES.filter(r => r.status === 'pending').length;

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

  const renderNotification = (notification) => (
    <TouchableOpacity key={notification.id} style={styles.notificationCard}>
      <View style={styles.notificationIconContainer}>
        <Text style={styles.notificationIcon}>{notification.icon}</Text>
        {notification.unread && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, notification.unread && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationDescription}>{notification.description}</Text>
        <Text style={styles.notificationTimestamp}>{notification.timestamp}</Text>
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

  const renderTabContent = () => {
    if (activeTab === 'inbox') {
      return (
        <View>
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>No messages found</Text>
            </View>
          ) : (
            filteredMessages.map(renderMessage)
          )}
        </View>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <View>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔔</Text>
              <Text style={styles.emptyStateText}>No notifications</Text>
            </View>
          ) : (
            filteredNotifications.map(renderNotification)
          )}
        </View>
      );
    }

    if (activeTab === 'resources') {
      return (
        <View>
          {filteredResources.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📂</Text>
              <Text style={styles.emptyStateText}>No resources</Text>
            </View>
          ) : (
            filteredResources.map(renderResource)
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
        
        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'inbox' && styles.activeSegment]}
            onPress={() => setActiveTab('inbox')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="mail" 
              size={18} 
              color={activeTab === 'inbox' ? Colors.white : Colors.textSecondary} 
              style={styles.segmentIcon}
            />
            <Text style={[styles.segmentText, activeTab === 'inbox' && styles.activeSegmentText]}>
              Inbox
            </Text>
            {unreadMessagesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessagesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'notifications' && styles.activeSegment]}
            onPress={() => setActiveTab('notifications')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="notifications" 
              size={18} 
              color={activeTab === 'notifications' ? Colors.white : Colors.textSecondary} 
              style={styles.segmentIcon}
            />
            <Text style={[styles.segmentText, activeTab === 'notifications' && styles.activeSegmentText]}>
              Alerts
            </Text>
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'resources' && styles.activeSegment]}
            onPress={() => setActiveTab('resources')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="folder" 
              size={18} 
              color={activeTab === 'resources' ? Colors.white : Colors.textSecondary} 
              style={styles.segmentIcon}
            />
            <Text style={[styles.segmentText, activeTab === 'resources' && styles.activeSegmentText]}>
              Files
            </Text>
            {pendingResourcesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingResourcesCount}</Text>
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
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {renderTabContent()}
        </ScrollView>
      </View>
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
    paddingHorizontal: 4,
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
    fontSize: Layout.fontSize.xs,
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
  },
  
  bottomPadding: {
    height: Layout.spacing.xl,
  },
});

export default MessagesScreen;
