import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  ActionSheetIOS
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { messageApi } from '../../services/api/messageApi';
import teamApi from '../../services/api/teamApi';
import { organizationApi } from '../../services/api/organizationApi';
import Colors from '../../constants/Colors';

const UnifiedMessagesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [lastPollTime, setLastPollTime] = useState(new Date().toISOString());
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [sendingReply, setSendingReply] = useState({});
  
  // Compose modal state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [messageContext, setMessageContext] = useState('team');
  const [selectedContextId, setSelectedContextId] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  
  const notificationListener = useRef();
  const responseListener = useRef();

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Refresh data when screen comes into focus (handles cross-platform invitation acceptance)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Messages screen focused - refreshing data...');
      loadTeams();
      loadOrganizations();
      loadRecipients();
      loadAlerts();
    }, [])
  );

  useEffect(() => {
    navigation.setOptions({
      title: 'Messages',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => setShowComposeModal(true)} 
          style={styles.composeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )
    });
    loadInitialData();
    registerForPushNotifications();
    
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      // Refresh messages when notification arrives
      loadMessages();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📬 Notification tapped:', response);
      // User tapped notification - already on messages screen
    });

    return () => {
      if (notificationListener.current && Notifications.removeNotificationSubscription) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current && Notifications.removeNotificationSubscription) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Polling effect for real-time updates
  useEffect(() => {
    const teamIds = teams && teams.length > 0 ? teams.map(t => t.id) : [];
    const orgIds = organizations && organizations.length > 0 ? organizations.map(o => o.id) : [];
    
    if (teamIds.length === 0 && orgIds.length === 0) {
      return;
    }

    console.log('📡 Starting message polling (5s interval)...');

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling for new messages...');
        const response = await messageApi.pollMessages(lastPollTime, teamIds, orgIds);
        
        if (response.status === 'success' && response.data) {
          const newMessages = response.data.messages || [];
          console.log(`✅ Poll complete: ${newMessages.length} new/updated messages`);
          
          if (newMessages.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.message_id));
              const uniqueNew = newMessages.filter(m => !existingIds.has(m.message_id));
              
              // Show notification for new messages
              uniqueNew.forEach(msg => {
                if (msg.sender_id !== currentUserId) {
                  showLocalNotification(msg);
                }
              });
              
              const updatedMessages = prev.map(msg => {
                const updated = newMessages.find(m => m.message_id === msg.message_id);
                return updated || msg;
              });
              
              return [...updatedMessages, ...uniqueNew];
            });
            
            // Reload replies for expanded message if needed
            if (expandedMessageId) {
              const expandedMsg = newMessages.find(m => m.message_id === expandedMessageId);
              if (expandedMsg && expandedMsg.reply_count > (replies[expandedMessageId]?.length || 0)) {
                loadReplies(expandedMessageId);
              }
            }
            
            setLastPollTime(response.data.polled_at);
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [teams, organizations, lastPollTime, expandedMessageId]);

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push notification permissions');
        return;
      }
      
      console.log('✅ Push notification permissions granted');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const showLocalNotification = async (message) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `New message from ${message.sender_name}`,
          body: message.content.substring(0, 100),
          data: { messageId: message.message_id },
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTeams(),
        loadOrganizations(),
        loadRecipients(),
        loadAlerts()
      ]);
      await loadMessages();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await teamApi.getTeams();
      console.log('🏀 loadTeams response:', JSON.stringify(response, null, 2));
      // Handle both response formats: {teams: [...]} and {status: 'success', data: {teams: [...]}}
      const teamsData = response.teams || response.data?.teams || [];
      console.log('🏀 Setting teams state:', teamsData.length, 'teams');
      console.log('🏀 Teams data:', JSON.stringify(teamsData, null, 2));
      setTeams(teamsData);
    } catch (error) {
      console.error('❌ Error loading teams:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await organizationApi.getOrganizations();
      console.log('🏢 loadOrganizations response:', JSON.stringify(response, null, 2));
      if (response.status === 'success' && response.data) {
        const orgsData = response.data.organizations || [];
        console.log('🏢 Setting organizations state:', orgsData.length, 'organizations');
        console.log('🏢 Organizations data:', JSON.stringify(orgsData, null, 2));
        setOrganizations(orgsData);
      }
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await messageApi.getAvailableRecipients();
      console.log('👥 loadRecipients response:', JSON.stringify(response, null, 2));
      if (response.status === 'success' && response.data) {
        const recipientsData = response.data.recipients || [];
        console.log('👥 Setting recipients state:', recipientsData.length, 'recipients');
        console.log('👥 Recipients data:', JSON.stringify(recipientsData, null, 2));
        setRecipients(recipientsData);
      }
    } catch (error) {
      // Handle 404 gracefully - expected for users without teams/orgs
      if (error.response && error.response.status === 404) {
        console.log('👥 No recipients found (404) - setting empty array');
        setRecipients([]);
      } else {
        console.error('❌ Error loading recipients:', error);
        setRecipients([]);
      }
    }
  };

  const loadMessages = async () => {
    try {
      let allMessages = [];

      // Load team messages
      for (const team of teams) {
        const response = await messageApi.getTeamMessages(team.id);
        if (response.status === 'success' && response.data) {
          allMessages = [...allMessages, ...response.data.messages];
        }
      }

      // Load org messages
      for (const org of organizations) {
        const response = await messageApi.getOrgMessages(org.id);
        if (response.status === 'success' && response.data) {
          allMessages = [...allMessages, ...response.data.messages];
        }
      }

      // Sort by created_at
      allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setMessages(allMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      // Load pending invitations
      const response = await messageApi.getPendingInvitations();
      if (response.status === 'success' && response.data) {
        setAlerts(response.data.invitations || []);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Check if user has any messaging options
    if (teams.length === 0 && organizations.length === 0 && recipients.length === 0) {
      Alert.alert(
        'No Messaging Options',
        'Join a team or organization to start collaborating with messages!'
      );
      return;
    }

    try {
      setSending(true);
      let response;

      if (messageContext === 'team') {
        if (!selectedContextId) {
          Alert.alert('Error', 'Please select a team');
          return;
        }
        response = await messageApi.sendTeamMessage(selectedContextId, newMessage);
      } else if (messageContext === 'organization') {
        if (!selectedContextId) {
          Alert.alert('Error', 'Please select an organization');
          return;
        }
        response = await messageApi.sendOrgMessage(selectedContextId, newMessage);
      } else if (messageContext === 'direct') {
        if (!selectedRecipient) {
          Alert.alert('Error', 'Please select a recipient');
          return;
        }
        response = await messageApi.sendDirectMessage(selectedRecipient, newMessage);
      }

      if (response && response.status === 'success' && response.data) {
        setNewMessage('');
        setShowComposeModal(false);
        
        const newMsg = response.data.message;
        setMessages(prev => [...prev, newMsg]);
        setLastPollTime(new Date().toISOString());
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const toggleReplies = async (messageId) => {
    if (expandedMessageId === messageId) {
      setExpandedMessageId(null);
    } else {
      setExpandedMessageId(messageId);
      await loadReplies(messageId);
    }
  };

  const loadReplies = async (messageId) => {
    try {
      const response = await messageApi.getReplies(messageId);
      if (response.status === 'success' && response.data) {
        setReplies(prev => ({ ...prev, [messageId]: response.data.replies }));
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleSendReply = async (messageId) => {
    const content = replyContent[messageId]?.trim();
    if (!content) return;

    try {
      setSendingReply(prev => ({ ...prev, [messageId]: true }));
      const response = await messageApi.createReply(messageId, content);
      
      if (response.status === 'success') {
        setReplyContent(prev => ({ ...prev, [messageId]: '' }));
        
        const repliesResponse = await messageApi.getReplies(messageId);
        if (repliesResponse.status === 'success' && repliesResponse.data) {
          setReplies(prev => ({ ...prev, [messageId]: repliesResponse.data.replies }));
          
          setMessages(prev => prev.map(msg => 
            msg.message_id === messageId 
              ? { ...msg, reply_count: repliesResponse.data.replies.length }
              : msg
          ));
        }
        
        setLastPollTime(new Date().toISOString());
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send reply');
    } finally {
      setSendingReply(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const getContextBadge = (msg) => {
    if (msg.context_type === 'organization') {
      return { icon: '🏢', label: 'Org', color: Colors.purple };
    } else if (msg.context_type === 'direct') {
      return { icon: '💬', label: 'DM', color: Colors.green };
    } else {
      return { icon: '👥', label: 'Team', color: Colors.blue };
    }
  };

  const renderMessage = ({ item: message }) => {
    const isOwnMessage = currentUserId && message.sender_id === currentUserId;
    const isExpanded = expandedMessageId === message.message_id;
    const badge = getContextBadge(message);

    return (
      <View style={[styles.messageCard, message.is_announcement && styles.announcementCard]}>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {message.sender_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.senderName}>{message.sender_name}</Text>
              <Text style={styles.messageTime}>
                {new Date(message.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={[styles.contextBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.contextBadgeText, { color: badge.color }]}>
              {badge.icon} {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.messageContent}>{message.content}</Text>

        <View style={styles.messageFooter}>
          <Text style={styles.readCount}>
            {message.read_count}/{message.total_recipients} read
          </Text>
          {(message.reply_count || 0) > 0 && (
            <Text style={styles.replyCount}>
              • {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => toggleReplies(message.message_id)}
        >
          <Text style={styles.replyButtonText}>
            {isExpanded ? 'Hide Replies' : (message.reply_count || 0) > 0 ? 'See Replies' : 'Reply'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.repliesSection}>
            {replies[message.message_id] && replies[message.message_id].length > 0 && (
              <View style={styles.repliesList}>
                {replies[message.message_id].map((reply) => (
                  <View key={reply.message_id} style={styles.replyCard}>
                    <View style={styles.replyHeader}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarTextSmall}>
                          {reply.sender_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.replySenderName}>{reply.sender_name}</Text>
                        <Text style={styles.replyTime}>
                          {new Date(reply.created_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.replyContent}>{reply.content}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.replyCompose}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply..."
                value={replyContent[message.message_id] || ''}
                onChangeText={(text) => setReplyContent(prev => ({ ...prev, [message.message_id]: text }))}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendReplyButton, (!replyContent[message.message_id]?.trim() || sendingReply[message.message_id]) && styles.sendReplyButtonDisabled]}
                onPress={() => handleSendReply(message.message_id)}
                disabled={Boolean(!replyContent[message.message_id]?.trim() || sendingReply[message.message_id])}
              >
                <Text style={styles.sendReplyButtonText}>
                  {sendingReply[message.message_id] ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const getSelectedContextName = () => {
    if (messageContext === 'team' && selectedContextId) {
      const team = teams.find(t => t.id === selectedContextId);
      return team ? team.name : 'Select a team';
    }
    if (messageContext === 'organization' && selectedContextId) {
      const org = organizations.find(o => o.id === selectedContextId);
      return org ? org.name : 'Select an organization';
    }
    if (messageContext === 'direct' && selectedRecipient) {
      const recipient = recipients.find(r => r.user_id === selectedRecipient);
      return recipient ? recipient.display_name : 'Select a recipient';
    }
    return messageContext === 'team' ? 'Select a team' : 
           messageContext === 'organization' ? 'Select an organization' : 
           'Select a recipient';
  };

  const showMessageTypeActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Team Message', 'Organization Message', 'Direct Message'],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        const index = Number(buttonIndex);
        if (index === 1) {
          setMessageContext('team');
          setSelectedContextId('');
        } else if (index === 2) {
          setMessageContext('organization');
          setSelectedContextId('');
        } else if (index === 3) {
          setMessageContext('direct');
          setSelectedRecipient('');
        }
      }
    );
  };

  const showTeamActionSheet = () => {
    if (!teams || teams.length === 0) return;
    
    const options = ['Cancel', ...teams.map(t => t.name)];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        const index = Number(buttonIndex);
        if (index > 0) {
          setSelectedContextId(teams[index - 1].id);
        }
      }
    );
  };

  const showOrgActionSheet = () => {
    if (!organizations || organizations.length === 0) return;
    
    const options = ['Cancel', ...organizations.map(o => o.name)];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        const index = Number(buttonIndex);
        if (index > 0) {
          setSelectedContextId(organizations[index - 1].id);
        }
      }
    );
  };

  const showRecipientActionSheet = () => {
    if (!recipients || recipients.length === 0) return;
    
    const options = ['Cancel', ...recipients.map(r => `${r.display_name} (${r.email})`)];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        const index = Number(buttonIndex);
        if (index > 0) {
          setSelectedRecipient(recipients[index - 1].user_id);
        }
      }
    );
  };

  const renderComposeModal = () => (
    <Modal
      visible={showComposeModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowComposeModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => setShowComposeModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Message</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView style={styles.composeForm} showsVerticalScrollIndicator={false}>
          {teams.length === 0 && organizations.length === 0 && recipients.length === 0 ? (
            <View style={styles.emptyComposeState}>
              <Ionicons name="people-outline" size={64} color={Colors.lightGray} />
              <Text style={styles.emptyComposeTitle}>No Messaging Options</Text>
              <Text style={styles.emptyComposeText}>
                Join a team or organization to start collaborating with messages!
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Message Type</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={showMessageTypeActionSheet}
              >
                <Ionicons 
                  name={messageContext === 'team' ? 'people' : messageContext === 'organization' ? 'business' : 'person'} 
                  size={20} 
                  color={Colors.primary} 
                />
                <Text style={styles.selectorButtonText}>
                  {messageContext === 'team' ? 'Team Message' : 
                   messageContext === 'organization' ? 'Organization Message' : 
                   'Direct Message'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              {messageContext === 'team' && (
                teams && teams.length > 0 ? (
                  <>
                    <Text style={styles.label}>Select Team</Text>
                    <TouchableOpacity
                      style={styles.selectorButton}
                      onPress={showTeamActionSheet}
                    >
                      <Ionicons name="people" size={20} color={Colors.primary} />
                      <Text style={styles.selectorButtonText}>{getSelectedContextName()}</Text>
                      <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Select Team</Text>
                    <View style={styles.emptyPickerContainer}>
                      <Text style={styles.emptyPickerHint}>No teams available. Join a team to send messages!</Text>
                    </View>
                  </>
                )
              )}

              {messageContext === 'organization' && (
                organizations && organizations.length > 0 ? (
                  <>
                    <Text style={styles.label}>Select Organization</Text>
                    <TouchableOpacity
                      style={styles.selectorButton}
                      onPress={showOrgActionSheet}
                    >
                      <Ionicons name="business" size={20} color={Colors.primary} />
                      <Text style={styles.selectorButtonText}>{getSelectedContextName()}</Text>
                      <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Select Organization</Text>
                    <View style={styles.emptyPickerContainer}>
                      <Text style={styles.emptyPickerHint}>No organizations available. Join an organization to send messages!</Text>
                    </View>
                  </>
                )
              )}

              {messageContext === 'direct' && (
                recipients && recipients.length > 0 ? (
                  <>
                    <Text style={styles.label}>Select Recipient</Text>
                    <TextInput
                      style={styles.recipientSearchInput}
                      placeholder="Search by name or email..."
                      value={recipientSearchQuery}
                      onChangeText={setRecipientSearchQuery}
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <ScrollView style={styles.recipientListContainer} nestedScrollEnabled={true}>
                      {recipients
                        .filter(recipient =>
                          recipientSearchQuery === '' ||
                          recipient.display_name.toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
                          recipient.email.toLowerCase().includes(recipientSearchQuery.toLowerCase())
                        )
                        .map(recipient => (
                          <TouchableOpacity
                            key={recipient.user_id}
                            style={[
                              styles.recipientItem,
                              selectedRecipient === recipient.user_id && styles.recipientItemSelected
                            ]}
                            onPress={() => {
                              setSelectedRecipient(recipient.user_id);
                              setRecipientSearchQuery(recipient.display_name);
                            }}
                          >
                            <Text style={styles.recipientName}>{recipient.display_name}</Text>
                            <Text style={styles.recipientEmail}>{recipient.email}</Text>
                          </TouchableOpacity>
                        ))}
                      {recipients.filter(recipient =>
                        recipientSearchQuery === '' ||
                        recipient.display_name.toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
                        recipient.email.toLowerCase().includes(recipientSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <View style={styles.emptyRecipientList}>
                          <Text style={styles.emptyRecipientText}>No recipients found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Select Recipient</Text>
                    <View style={styles.emptyPickerContainer}>
                      <Text style={styles.emptyPickerHint}>No recipients available.</Text>
                    </View>
                  </>
                )
              )}
            </>
          )}

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[
              styles.messageInput,
              (messageContext === 'team' && !selectedContextId) ||
              (messageContext === 'organization' && !selectedContextId) ||
              (messageContext === 'direct' && !selectedRecipient)
                ? styles.messageInputDisabled
                : null
            ]}
            placeholder={
              (messageContext === 'team' && !selectedContextId) ||
              (messageContext === 'organization' && !selectedContextId) ||
              (messageContext === 'direct' && !selectedRecipient)
                ? 'Select a recipient first...'
                : 'Write your message...'
            }
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={Boolean(
              (messageContext === 'team' && selectedContextId) ||
              (messageContext === 'organization' && selectedContextId) ||
              (messageContext === 'direct' && selectedRecipient)
            )}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending ||
                (messageContext === 'team' && !selectedContextId) ||
                (messageContext === 'organization' && !selectedContextId) ||
                (messageContext === 'direct' && !selectedRecipient)) &&
                styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={Boolean(
              !newMessage.trim() || sending ||
              (messageContext === 'team' && !selectedContextId) ||
              (messageContext === 'organization' && !selectedContextId) ||
              (messageContext === 'direct' && !selectedRecipient)
            )}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>
                {sending ? 'Sending...' : 'Send Message'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  const renderAlertItem = ({ item: alert }) => {
    const isTeamInvite = !!alert.team_id;
    const contextName = isTeamInvite ? alert.team_name : alert.org_name;
    const roleName = isTeamInvite ? alert.team_role_name : alert.org_role_name;

    return (
      <View style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <Ionicons 
            name={isTeamInvite ? 'people' : 'business'} 
            size={24} 
            color={Colors.primary} 
          />
          <View style={styles.alertHeaderText}>
            <Text style={styles.alertTitle}>Invitation to {contextName}</Text>
            <Text style={styles.alertSubtitle}>Role: {roleName}</Text>
          </View>
        </View>
        <Text style={styles.alertMessage}>
          {alert.inviter_name} invited you to join {contextName}
        </Text>
        <View style={styles.alertActions}>
          <TouchableOpacity 
            style={[styles.alertButton, styles.acceptButton]}
            onPress={() => handleAcceptInvitation(alert.token)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.alertButton, styles.declineButton]}
            onPress={() => handleDeclineInvitation(alert.token)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.alertTime}>
          {new Date(alert.created_at).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const handleAcceptInvitation = async (token) => {
    try {
      const response = await messageApi.acceptInvitation(token);
      if (response.status === 'success') {
        Alert.alert('Success', 'Invitation accepted!');
        console.log('🎉 Invitation accepted, refreshing messaging data...');
        await loadAlerts();
        await loadTeams();
        await loadOrganizations();
        await loadRecipients();
        console.log('✅ Messaging data refreshed - Teams:', teams.length, 'Orgs:', organizations.length, 'Recipients:', recipients.length);
      }
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (token) => {
    try {
      const response = await messageApi.declineInvitation(token);
      if (response.status === 'success') {
        Alert.alert('Success', 'Invitation declined');
        await loadAlerts();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons 
            name="chatbubbles" 
            size={20} 
            color={activeTab === 'messages' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Ionicons 
            name="notifications" 
            size={20} 
            color={activeTab === 'alerts' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts
          </Text>
          {alerts.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alerts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'messages' ? (
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadMessages();
              setRefreshing(false);
            }}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.lightGray} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to send your first message</Text>
          </View>
        }
      />
      ) : (
      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.invitation_id}
        contentContainerStyle={styles.alertsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadAlerts();
              setRefreshing(false);
            }}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.lightGray} />
            <Text style={styles.emptyText}>No pending alerts</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        }
      />
      )}
      {renderComposeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertsList: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  alertSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  declineButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  composeButton: {
    marginRight: 16,
    padding: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  contextBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  readCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  replyCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  replyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  repliesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  repliesList: {
    marginBottom: 12,
  },
  replyCard: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarTextSmall: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  replySenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  replyTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  replyContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  replyCompose: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    maxHeight: 80,
  },
  sendReplyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendReplyButtonDisabled: {
    opacity: 0.5,
  },
  sendReplyButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  composeForm: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  selectorButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  emptyPickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  emptyPickerHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recipientSearchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  recipientListContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  recipientList: {
    flexGrow: 0,
  },
  recipientItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  recipientItemSelected: {
    backgroundColor: Colors.lightBackground,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  recipientEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyRecipientList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRecipientText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  pickerScrollView: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
    gap: 12,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyPicker: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyPickerSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyComposeState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyComposeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyComposeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  announcementToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  announcementLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  messageInputDisabled: {
    backgroundColor: Colors.lightBackground,
    color: Colors.textSecondary,
  },
  sendButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UnifiedMessagesScreen;
