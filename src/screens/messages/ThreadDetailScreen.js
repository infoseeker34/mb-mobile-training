import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messageApi } from '../../services/api/messageApi';
import Colors from '../../constants/Colors';

const ThreadDetailScreen = ({ route, navigation }) => {
  const { conversation } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [sendingReply, setSendingReply] = useState({});

  useEffect(() => {
    loadMessages();
    navigation.setOptions({
      title: conversation.name,
    });

    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [conversation]);

  const loadMessages = async (silent = false) => {
    try {
      const response = await messageApi.getConversationMessages(
        conversation.context_type,
        conversation.context_id
      );
      if (response.status === 'success' && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!silent) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      let response;

      if (conversation.context_type === 'team') {
        response = await messageApi.sendTeamMessage(conversation.context_id, newMessage, false);
      } else if (conversation.context_type === 'organization') {
        response = await messageApi.sendOrgMessage(conversation.context_id, newMessage, false);
      } else if (conversation.context_type === 'direct' && conversation.participant_id) {
        response = await messageApi.sendDirectMessage(conversation.participant_id, newMessage);
      }

      if (response?.status === 'success') {
        setNewMessage('');
        await loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const toggleReplies = async (messageId) => {
    if (expandedMessageId === messageId) {
      setExpandedMessageId(null);
    } else {
      setExpandedMessageId(messageId);
      if (!replies[messageId]) {
        try {
          const response = await messageApi.getReplies(messageId);
          if (response.status === 'success' && response.data) {
            setReplies(prev => ({ ...prev, [messageId]: response.data.replies }));
          }
        } catch (error) {
          console.error('Error loading replies:', error);
        }
      }
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

          setMessages(prev =>
            prev.map(msg =>
              msg.message_id === messageId
                ? { ...msg, reply_count: repliesResponse.data.replies.length }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setSendingReply(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageAvatar}>
        <Text style={styles.messageAvatarText}>{item.sender_name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.messageBubble}>
        <View style={styles.messageSenderInfo}>
          <Text style={styles.messageSender}>{item.sender_name}</Text>
          <Text style={styles.messageTimestamp}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.messageText}>{item.content}</Text>

        {item.reply_count > 0 && (
          <TouchableOpacity
            style={styles.viewRepliesButton}
            onPress={() => toggleReplies(item.message_id)}
          >
            <Text style={styles.viewRepliesText}>
              {expandedMessageId === item.message_id
                ? `Hide ${item.reply_count} ${item.reply_count === 1 ? 'reply' : 'replies'}`
                : `View ${item.reply_count} ${item.reply_count === 1 ? 'reply' : 'replies'}`}
            </Text>
          </TouchableOpacity>
        )}

        {expandedMessageId === item.message_id && (
          <View style={styles.repliesSection}>
            {replies[item.message_id]?.map((reply) => (
              <View key={reply.message_id} style={styles.replyItem}>
                <View style={styles.replyAvatar}>
                  <Text style={styles.replyAvatarText}>{reply.sender_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.replyContent}>
                  <View style={styles.replyHeader}>
                    <Text style={styles.replySender}>{reply.sender_name}</Text>
                    <Text style={styles.replyTime}>
                      {new Date(reply.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.replyText}>{reply.content}</Text>
                </View>
              </View>
            ))}

            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply..."
                value={replyContent[item.message_id] || ''}
                onChangeText={(text) =>
                  setReplyContent(prev => ({ ...prev, [item.message_id]: text }))
                }
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity
                style={[
                  styles.replySendButton,
                  (!replyContent[item.message_id]?.trim() || sendingReply[item.message_id]) &&
                    styles.replySendButtonDisabled,
                ]}
                onPress={() => handleSendReply(item.message_id)}
                disabled={!replyContent[item.message_id]?.trim() || sendingReply[item.message_id]}
              >
                <Ionicons name="send" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages in this conversation yet</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.message_id}
          inverted
          contentContainerStyle={styles.messagesList}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={10000}
          placeholderTextColor={Colors.textSecondary}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={24} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBadge: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  headerBadgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  messageBubble: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 16,
  },
  messageSenderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  messageTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  viewRepliesButton: {
    marginTop: 8,
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  repliesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replySender: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  replyTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  replyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  replyInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  replySendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replySendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ThreadDetailScreen;
