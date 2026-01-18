/**
 * Invite Detail Modal
 * 
 * Modal for viewing and accepting/declining invitations.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import invitationApi from '../services/api/invitationApi';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

const InviteDetailModal = ({ visible, onClose, invitationToken, onAccepted }) => {
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible && invitationToken) {
      fetchInvitation();
    }
  }, [visible, invitationToken]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('InviteDetailModal - Fetching invitation for token:', invitationToken);
      
      const inviteData = await invitationApi.getInvitationByToken(invitationToken);
      console.log('InviteDetailModal - Fetched invitation:', inviteData);
      
      setInvitation(inviteData);
    } catch (err) {
      console.error('InviteDetailModal - Error fetching invitation:', err);
      setError(err.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setProcessing(true);
      console.log('InviteDetailModal - Accepting invitation');
      
      const result = await invitationApi.acceptInvitation(invitationToken);
      console.log('InviteDetailModal - Accept result:', result);
      
      Alert.alert(
        'Success! 🎉',
        `You've joined ${invitation.org_name || invitation.team_name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onAccepted) onAccepted();
              onClose();
            }
          }
        ]
      );
    } catch (err) {
      console.error('InviteDetailModal - Error accepting invitation:', err);
      Alert.alert('Error', err.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              console.log('InviteDetailModal - Declining invitation');
              
              await invitationApi.declineInvitation(invitationToken);
              
              Alert.alert(
                'Invitation Declined',
                'You have declined this invitation.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (onAccepted) onAccepted(); // Refresh notifications
                      onClose();
                    }
                  }
                ]
              );
            } catch (err) {
              console.error('InviteDetailModal - Error declining invitation:', err);
              Alert.alert('Error', err.message || 'Failed to decline invitation');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const getInvitationType = () => {
    if (invitation?.invitation_type === 'combo') return 'Team & Organization';
    if (invitation?.invitation_type === 'organization') return 'Organization';
    if (invitation?.invitation_type === 'team') return 'Team';
    return 'Invitation';
  };

  const getContextName = () => {
    if (invitation?.invitation_type === 'combo') {
      return `${invitation.team_name} (${invitation.org_name})`;
    }
    return invitation?.org_name || invitation?.team_name || 'Unknown';
  };

  const getRoleName = () => {
    return invitation?.team_role_name || invitation?.org_role_name || 'Member';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Invitation Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading invitation...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchInvitation}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : invitation ? (
              <>
                {/* Invitation Icon */}
                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="mail-open" size={40} color={Colors.primary} />
                  </View>
                </View>

                {/* Invitation Info */}
                <Text style={styles.inviteType}>{getInvitationType()}</Text>
                <Text style={styles.contextName}>{getContextName()}</Text>
                <Text style={styles.roleText}>as {getRoleName()}</Text>

                {/* Invited By */}
                {invitation.invited_by_name && (
                  <View style={styles.invitedByContainer}>
                    <Ionicons name="person" size={16} color={Colors.textSecondary} />
                    <Text style={styles.invitedByText}>
                      Invited by {invitation.invited_by_name}
                    </Text>
                  </View>
                )}

                {/* Expiration */}
                {invitation.expires_at && (
                  <View style={styles.expirationContainer}>
                    <Ionicons name="time" size={16} color={Colors.textSecondary} />
                    <Text style={styles.expirationText}>
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Status */}
                {invitation.status !== 'pending' && (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invitation.status) }]}>
                    <Text style={styles.statusText}>{invitation.status}</Text>
                  </View>
                )}

                {/* Actions */}
                {invitation.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.button, styles.acceptButton]}
                      onPress={handleAccept}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.declineButton]}
                      onPress={handleDecline}
                      disabled={processing}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'accepted': return Colors.success;
    case 'declined': return Colors.error;
    case 'expired': return Colors.textSecondary;
    default: return Colors.warning;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: Layout.spacing.xs,
  },
  content: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
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
  iconContainer: {
    marginBottom: Layout.spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteType: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Layout.spacing.xs,
  },
  contextName: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  roleText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.lg,
  },
  invitedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: 4,
  },
  invitedByText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    gap: 4,
  },
  expirationText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
  },
  statusText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  actions: {
    width: '100%',
    gap: Layout.spacing.md,
    marginTop: Layout.spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.sm,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  declineButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  declineButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.error,
  },
});

export default InviteDetailModal;
