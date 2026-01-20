import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { messageApi } from '../../services/api/messageApi';
import Colors from '../../constants/Colors';

const TeamMessagesScreen = ({ route, navigation }) => {
  const { teamId, teamName } = route.params;
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [lastPollTime, setLastPollTime] = useState(new Date().toISOString());
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [sendingReply, setSendingReply] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: `${teamName} Messages`
    });
    loadMessages();
  }, [teamId, teamName]);

  // Polling effect for real-time updates
  useEffect(() => {
    if (!teamId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await messageApi.pollMessages(lastPollTime, [teamId]);
        const newMessages = response.data?.messages || [];
        
        if (newMessages.length > 0) {
          // Update messages and merge new ones
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.message_id));
            const uniqueNew = newMessages.filter(m => !existingIds.has(m.message_id));
            
            // Merge new messages and update existing ones
            const updatedMessages = prev.map(msg => {
              const updated = newMessages.find(m => m.message_id === msg.message_id);
              return updated || msg;
            });
            
            return [...updatedMessages, ...uniqueNew];
          });
          
          // Check for reply_count changes and reload affected threads
          newMessages.forEach(async (newMsg) => {
            // If this message is currently expanded, reload its replies
            if (expandedMessageId === newMsg.message_id) {
              console.log('Reloading replies for expanded message:', newMsg.message_id, 'reply_count:', newMsg.reply_count);
              try {
                const response = await messageApi.getReplies(newMsg.message_id);
                const repliesData = response.data?.replies || [];
                console.log('Loaded replies:', repliesData.length);
                setReplies(prev => ({ ...prev, [newMsg.message_id]: repliesData }));
              } catch (error) {
                console.error('Failed to reload replies:', error);
              }
            }
          });
          
          // Auto-mark new messages as read
          newMessages.forEach(async (msg) => {
            if (!msg.read_at) {
              try {
                await messageApi.markMessageRead(msg.message_id);
              } catch (error) {
                console.error('Failed to auto-mark message as read:', msg.message_id, error);
              }
            }
          });
        }
        
        // Update last poll time
        if (response.data?.polled_at) {
          setLastPollTime(response.data.polled_at);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [teamId, lastPollTime, expandedMessageId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getTeamMessages(teamId);
      const messages = response.data?.messages || [];
      setMessages(messages);
      
      // Auto-mark unread messages as read
      const unreadMessages = messages.filter(msg => !msg.read_at);
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          try {
            await messageApi.markMessageRead(msg.message_id);
          } catch (error) {
            console.error('Failed to auto-mark message as read:', msg.message_id, error);
          }
        });
      }
    } catch (error) {
      console.error('TeamMessagesScreen - Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, [teamId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    try {
      setSending(true);
      await messageApi.sendTeamMessage(teamId, newMessage.trim(), false);
      setNewMessage('');
      // Update last poll time to prevent duplicate on next poll
      setLastPollTime(new Date().toISOString());
      await loadMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim()) {
      Alert.alert('Error', 'Message content cannot be empty');
      return;
    }

    try {
      await messageApi.updateMessage(editingMessageId, editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');
      await loadMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to update message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const toggleReplies = async (messageId) => {
    if (expandedMessageId === messageId) {
      setExpandedMessageId(null);
    } else {
      setExpandedMessageId(messageId);
      // Always reload replies when opening thread to ensure we have latest
      try {
        const response = await messageApi.getReplies(messageId);
        const repliesData = response.data?.replies || [];
        setReplies(prev => ({ ...prev, [messageId]: repliesData }));
      } catch (error) {
        console.error('Failed to load replies:', error);
      }
    }
  };

  const handleSendReply = async (messageId) => {
    const content = replyContent[messageId]?.trim();
    if (!content) return;

    try {
      setSendingReply(prev => ({ ...prev, [messageId]: true }));
      await messageApi.createReply(messageId, content);
      
      // Clear reply input
      setReplyContent(prev => ({ ...prev, [messageId]: '' }));
      
      // Reload replies
      const response = await messageApi.getReplies(messageId);
      const repliesData = response.data?.replies || [];
      setReplies(prev => ({ ...prev, [messageId]: repliesData }));
      
      // Update reply_count for this message without reloading entire list
      setMessages(prev => prev.map(msg => 
        msg.message_id === messageId 
          ? { ...msg, reply_count: repliesData.length }
          : msg
      ));
      
      // Update last poll time
      setLastPollTime(new Date().toISOString());
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setSendingReply(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }) => {
    const isEditing = editingMessageId === item.message_id;
    const isOwnMessage = currentUserId && item.sender_id === currentUserId;

    return (
      <TouchableOpacity 
        style={[
          styles.messageCard,
          item.is_announcement && styles.announcementCard,
          !item.read_at && styles.unreadCard
        ]}
        onPress={() => toggleReplies(item.message_id)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.sender_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.senderName}>{item.sender_name}</Text>
              <Text style={styles.messageTime}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          {item.is_announcement && (
            <View style={styles.announcementBadge}>
              <Text style={styles.announcementText}>📢 Announcement</Text>
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editingContent}
              onChangeText={setEditingContent}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.messageContent}>{item.content}</Text>
        )}

        <View style={styles.messageFooter}>
          <View style={styles.messageStats}>
            <Text style={styles.readCount}>
              {item.read_count}/{item.total_recipients} read
            </Text>
            {item.reply_count > 0 && (
              <Text style={styles.replyCount}>
                • {item.reply_count} {item.reply_count === 1 ? 'reply' : 'replies'}
              </Text>
            )}
          </View>
          {isOwnMessage && !isEditing && (
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.editMessageButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditMessage(item.message_id, item.content);
                }}
              >
                <Text style={styles.editMessageButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Replies Section */}
        {expandedMessageId === item.message_id && (
          <View style={styles.repliesSection}>
            {replies[item.message_id] && replies[item.message_id].length > 0 && (
              <View style={styles.repliesList}>
                {replies[item.message_id].map((reply) => (
                  <View key={reply.message_id} style={styles.replyCard}>
                    <View style={styles.replyHeader}>
                      <View style={styles.senderInfo}>
                        <View style={styles.avatarSmall}>
                          <Text style={styles.avatarTextSmall}>
                            {reply.sender_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.senderName}>{reply.sender_name}</Text>
                          <Text style={styles.messageTime}>
                            {new Date(reply.created_at).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.replyContent}>{reply.content}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Reply Input */}
            <View style={styles.replyCompose}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply..."
                value={replyContent[item.message_id] || ''}
                onChangeText={(text) => setReplyContent(prev => ({ ...prev, [item.message_id]: text }))}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendReplyButton,
                  (!replyContent[item.message_id]?.trim() || sendingReply[item.message_id]) && styles.sendReplyButtonDisabled
                ]}
                onPress={() => handleSendReply(item.message_id)}
                disabled={!replyContent[item.message_id]?.trim() || sendingReply[item.message_id]}
              >
                <Text style={styles.sendReplyButtonText}>
                  {sendingReply[item.message_id] ? 'Sending...' : 'Send Reply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{teamName}</Text>
          <Text style={styles.headerSubtitle}>Team Messages</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to send a message!</Text>
          </View>
        }
        inverted={false}
      />

      <View style={styles.composeContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={10000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 12,
    padding: 4
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2
  },
  contentContainer: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  announcementCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    backgroundColor: '#f0f7ff'
  },
  unreadCard: {
    backgroundColor: '#fffbf0',
    borderLeftWidth: 4,
    borderLeftColor: '#ffa500'
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  announcementBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  announcementText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  messageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  readCount: {
    fontSize: 12,
    color: '#666'
  },
  replyCount: {
    fontSize: 12,
    color: '#666'
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8
  },
  replyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6c757d',
    borderRadius: 6
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6c757d',
    borderRadius: 6
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  deleteButton: {
    backgroundColor: '#dc3545'
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  editMessageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0066cc',
    borderRadius: 6
  },
  editMessageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  editContainer: {
    marginBottom: 12
  },
  editInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },
  saveButton: {
    backgroundColor: '#28a745'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#6c757d'
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999'
  },
  composeContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 12
  },
  announcementToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#0066cc',
    borderRadius: 2
  },
  announcementLabel: {
    fontSize: 14,
    color: '#333'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8
  },
  sendButton: {
    backgroundColor: '#0066cc',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  repliesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  repliesList: {
    marginBottom: 12
  },
  replyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  replyHeader: {
    marginBottom: 8
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  avatarTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  replyContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333'
  },
  replyCompose: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80
  },
  sendReplyButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  sendReplyButtonDisabled: {
    backgroundColor: '#ccc'
  },
  sendReplyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  }
});

export default TeamMessagesScreen;
