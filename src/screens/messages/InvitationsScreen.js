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

const InvitationsScreen = ({ navigation }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadInvitations();
    }, [])
  );

  const loadInvitations = async () => {
    try {
      const response = await messageApi.getPendingInvitations();
      if (response.status === 'success' && response.data) {
        setInvitations(response.data.invitations || []);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvitations();
  };

  const handleAccept = async (invitation) => {
    try {
      setProcessing({ ...processing, [invitation.token]: true });

      const response = await messageApi.acceptInvitation(invitation.token);

      if (response?.status === 'success') {
        Alert.alert('Success', `You have joined ${invitation.entity_name}!`);
        loadInvitations();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    } finally {
      setProcessing({ ...processing, [invitation.token]: false });
    }
  };

  const handleDecline = async (invitation) => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to ${invitation.entity_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing({ ...processing, [invitation.token]: true });

              const response = await messageApi.declineInvitation(invitation.token);

              if (response?.status === 'success') {
                Alert.alert('Declined', 'Invitation declined');
                loadInvitations();
              }
            } catch (error) {
              console.error('Error declining invitation:', error);
              Alert.alert('Error', 'Failed to decline invitation');
            } finally {
              setProcessing({ ...processing, [invitation.token]: false });
            }
          },
        },
      ]
    );
  };

  const renderInvitation = ({ item }) => {
    const isProcessing = processing[item.token];
    const icon = item.invitation_type === 'team' ? 'people' : 'business';
    const iconColor = item.invitation_type === 'team' ? Colors.primary : Colors.secondary;

    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.invitationInfo}>
            <Text style={styles.entityName}>{item.entity_name}</Text>
            <Text style={styles.invitationType}>
              {item.invitation_type === 'team' ? 'Team' : 'Organization'} Invitation
            </Text>
            {item.invited_by_name && (
              <Text style={styles.invitedBy}>Invited by {item.invited_by_name}</Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading invitations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invitations</Text>
      </View>

      {invitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No pending invitations</Text>
          <Text style={styles.emptySubtext}>
            You'll see team and organization invitations here
          </Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          renderItem={renderInvitation}
          keyExtractor={(item) => item.token}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  invitationType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  invitedBy: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  declineButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvitationsScreen;
