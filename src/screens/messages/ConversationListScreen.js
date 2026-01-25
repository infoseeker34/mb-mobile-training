import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { messageApi } from '../../services/api/messageApi';
import teamApi from '../../services/api/teamApi';
import { organizationApi } from '../../services/api/organizationApi';
import Colors from '../../constants/Colors';

const ConversationListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teams, setTeams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      loadTeamsAndOrgs();
      loadPendingInvitationsCount();
    }, [])
  );

  const loadConversations = async () => {
    try {
      const response = await messageApi.getConversations();
      if (response.status === 'success' && response.data) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTeamsAndOrgs = async () => {
    try {
      const teamsResponse = await teamApi.getTeams();
      const teamsData = teamsResponse.teams || teamsResponse.data?.teams || [];
      setTeams(teamsData);

      const orgsResponse = await organizationApi.getOrganizations();
      if (orgsResponse.status === 'success' && orgsResponse.data) {
        setOrganizations(orgsResponse.data.organizations || []);
      }

      const recipientsResponse = await messageApi.getAvailableRecipients();
      if (recipientsResponse.status === 'success' && recipientsResponse.data) {
        setRecipients(recipientsResponse.data.recipients || []);
      }
    } catch (error) {
      console.error('Error loading teams/orgs:', error);
    }
  };

  const loadPendingInvitationsCount = async () => {
    try {
      const response = await messageApi.getPendingInvitations();
      if (response.status === 'success' && response.data) {
        setPendingInvitationsCount(response.data.invitations?.length || 0);
      }
    } catch (error) {
      console.error('Error loading pending invitations count:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
    loadTeamsAndOrgs();
    loadPendingInvitationsCount();
  };

  const getConversationIcon = (contextType) => {
    if (contextType === 'team') return 'people';
    if (contextType === 'organization') return 'business';
    return 'chatbubble';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ThreadDetail', { conversation: item })}
    >
      <View style={styles.conversationIcon}>
        <Ionicons name={getConversationIcon(item.context_type)} size={24} color={Colors.primary} />
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.conversationTime}>{formatTime(item.last_message_at)}</Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text style={styles.previewSender} numberOfLines={1}>
            {item.latest_sender}:
          </Text>
          <Text style={styles.previewText} numberOfLines={1}>
            {item.latest_message}
          </Text>
        </View>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Invitations')}
          >
            <View>
              <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
              {pendingInvitationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingInvitationsCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('ComposeMessage', { teams, organizations, recipients })}
          >
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={Colors.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Start a new conversation to get started!</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('ComposeMessage', { teams, organizations, recipients })}
          >
            <Ionicons name="create-outline" size={20} color={Colors.white} />
            <Text style={styles.emptyButtonText}>New Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => `${item.context_type}-${item.context_id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  conversationPreview: {
    flexDirection: 'row',
  },
  previewSender: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginRight: 4,
  },
  previewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConversationListScreen;
