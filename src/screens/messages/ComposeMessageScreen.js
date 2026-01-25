import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messageApi } from '../../services/api/messageApi';
import Colors from '../../constants/Colors';

const ComposeMessageScreen = ({ route, navigation }) => {
  const { teams = [], organizations = [], recipients = [] } = route.params || {};
  
  const [messageContext, setMessageContext] = useState('team');
  const [selectedContextId, setSelectedContextId] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!messageContent.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (messageContext === 'team' && !selectedContextId) {
      Alert.alert('Error', 'Please select a team');
      return;
    }

    if (messageContext === 'organization' && !selectedContextId) {
      Alert.alert('Error', 'Please select an organization');
      return;
    }

    if (messageContext === 'direct' && !selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient');
      return;
    }

    try {
      setSending(true);
      let response;

      if (messageContext === 'team') {
        response = await messageApi.sendTeamMessage(selectedContextId, messageContent, false);
      } else if (messageContext === 'organization') {
        response = await messageApi.sendOrgMessage(selectedContextId, messageContent, false);
      } else if (messageContext === 'direct') {
        response = await messageApi.sendDirectMessage(selectedRecipient, messageContent);
      }

      if (response?.status === 'success') {
        Alert.alert('Success', 'Message sent!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredRecipients = recipients.filter(recipient =>
    recipientSearchQuery === '' ||
    recipient.display_name.toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
    recipient.email.toLowerCase().includes(recipientSearchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          {/* Message Type Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Message Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, messageContext === 'team' && styles.typeButtonActive]}
                onPress={() => {
                  setMessageContext('team');
                  setSelectedContextId('');
                  setSelectedRecipient('');
                  setRecipientSearchQuery('');
                }}
              >
                <Ionicons
                  name="people"
                  size={20}
                  color={messageContext === 'team' ? Colors.white : Colors.primary}
                />
                <Text style={[styles.typeButtonText, messageContext === 'team' && styles.typeButtonTextActive]}>
                  Team
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, messageContext === 'organization' && styles.typeButtonActive]}
                onPress={() => {
                  setMessageContext('organization');
                  setSelectedContextId('');
                  setSelectedRecipient('');
                  setRecipientSearchQuery('');
                }}
              >
                <Ionicons
                  name="business"
                  size={20}
                  color={messageContext === 'organization' ? Colors.white : Colors.primary}
                />
                <Text style={[styles.typeButtonText, messageContext === 'organization' && styles.typeButtonTextActive]}>
                  Organization
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, messageContext === 'direct' && styles.typeButtonActive]}
                onPress={() => {
                  setMessageContext('direct');
                  setSelectedContextId('');
                  setSelectedRecipient('');
                  setRecipientSearchQuery('');
                }}
              >
                <Ionicons
                  name="chatbubble"
                  size={20}
                  color={messageContext === 'direct' ? Colors.white : Colors.primary}
                />
                <Text style={[styles.typeButtonText, messageContext === 'direct' && styles.typeButtonTextActive]}>
                  Direct
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Team Selector */}
          {messageContext === 'team' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Team</Text>
              {teams.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No teams available</Text>
                </View>
              ) : (
                <ScrollView style={styles.optionsList} nestedScrollEnabled>
                  {teams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      style={[styles.optionItem, selectedContextId === team.id && styles.optionItemSelected]}
                      onPress={() => setSelectedContextId(team.id)}
                    >
                      <Text style={styles.optionText}>{team.name}</Text>
                      {selectedContextId === team.id && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Organization Selector */}
          {messageContext === 'organization' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Organization</Text>
              {organizations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No organizations available</Text>
                </View>
              ) : (
                <ScrollView style={styles.optionsList} nestedScrollEnabled>
                  {organizations.map((org) => (
                    <TouchableOpacity
                      key={org.id}
                      style={[styles.optionItem, selectedContextId === org.id && styles.optionItemSelected]}
                      onPress={() => setSelectedContextId(org.id)}
                    >
                      <Text style={styles.optionText}>{org.name}</Text>
                      {selectedContextId === org.id && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Recipient Selector */}
          {messageContext === 'direct' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Recipient</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                value={recipientSearchQuery}
                onChangeText={setRecipientSearchQuery}
                placeholderTextColor={Colors.textSecondary}
              />
              {recipients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recipients available</Text>
                </View>
              ) : (
                <ScrollView style={styles.optionsList} nestedScrollEnabled>
                  {filteredRecipients.map((recipient) => (
                    <TouchableOpacity
                      key={recipient.user_id}
                      style={[
                        styles.optionItem,
                        selectedRecipient === recipient.user_id && styles.optionItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedRecipient(recipient.user_id);
                        setRecipientSearchQuery(recipient.display_name);
                      }}
                    >
                      <View style={styles.recipientInfo}>
                        <Text style={styles.recipientName}>{recipient.display_name}</Text>
                        <Text style={styles.recipientEmail}>{recipient.email}</Text>
                      </View>
                      {selectedRecipient === recipient.user_id && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredRecipients.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No recipients found</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          )}

          {/* Message Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Write your message..."
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
              numberOfLines={6}
              maxLength={10000}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Send Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageContent.trim() ||
              sending ||
              (messageContext === 'team' && !selectedContextId) ||
              (messageContext === 'organization' && !selectedContextId) ||
              (messageContext === 'direct' && !selectedRecipient)) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={
            !messageContent.trim() ||
            sending ||
            (messageContext === 'team' && !selectedContextId) ||
            (messageContext === 'organization' && !selectedContextId) ||
            (messageContext === 'direct' && !selectedRecipient)
          }
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={Colors.white} />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  optionsList: {
    maxHeight: 200,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  optionItemSelected: {
    backgroundColor: Colors.lightBackground,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  recipientEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messageInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComposeMessageScreen;
