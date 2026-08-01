import React, { useState, useCallback } from 'react';
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
import invitationApi from '../../services/api/invitationApi';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';
import {
  normalizePendingRow,
  normalizeByEmailRow,
  mergeInvitations,
  effectiveStatus,
  getStatusMeta,
  getAvailableActions,
  getActionLabel,
  describeContext,
} from '../../services/utils/invitationLifecycle';

// Map a status badge "tone" (from the pure helper) to a concrete color.
const TONE_COLORS = {
  success: Colors.success,
  error: Colors.error,
  info: Colors.info,
  neutral: Colors.textSecondary,
};

const InvitationsScreen = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadInvitations();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email])
  );

  const loadInvitations = async () => {
    try {
      // GET /pending returns pending invites addressed by internal user id (rich
      // org+team context). GET /?email returns email-addressed invites across all
      // statuses. Merging covers both invite styles; the /pending source wins on
      // dedupe so combo context is preserved.
      const [pendingRaw, byEmailRaw] = await Promise.all([
        invitationApi.getPendingInvitations().catch((err) => {
          console.error('Error loading pending invitations:', err);
          return [];
        }),
        user?.email
          ? invitationApi.getInvitations({ email: user.email }).catch((err) => {
              console.error('Error loading invitations by email:', err);
              return [];
            })
          : Promise.resolve([]),
      ]);

      const pending = (pendingRaw || []).map(normalizePendingRow);
      const byEmail = (byEmailRaw || []).map(normalizeByEmailRow);
      const serverList = mergeInvitations(pending, byEmail);

      setInvitations((prev) => {
        // Responses are reversible while an invite is OPEN, but GET /pending drops
        // an invite once it leaves 'pending'. To keep a just-answered invite on
        // screen so the invitee can still flip their response, carry over any
        // locally-answered (accepted/declined) item the server no longer returns.
        const serverTokens = new Set(serverList.map((inv) => inv.token));
        const carried = prev.filter(
          (inv) =>
            !serverTokens.has(inv.token) &&
            (inv.status === 'accepted' || inv.status === 'declined')
        );
        return mergeInvitations(serverList, carried);
      });
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

  const setItemStatus = (token, status) => {
    setInvitations((prev) =>
      prev.map((inv) => (inv.token === token ? { ...inv, status } : inv))
    );
  };

  const contextName = (invitation) =>
    invitation.orgName || invitation.teamName || 'this group';

  const runAccept = async (invitation) => {
    try {
      setProcessing((p) => ({ ...p, [invitation.token]: true }));
      await invitationApi.acceptInvitation(invitation.token);
      setItemStatus(invitation.token, 'accepted');
      Alert.alert('Accepted', `You have joined ${contextName(invitation)}.`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    } finally {
      setProcessing((p) => ({ ...p, [invitation.token]: false }));
    }
  };

  const runDecline = async (invitation) => {
    try {
      setProcessing((p) => ({ ...p, [invitation.token]: true }));
      await invitationApi.declineInvitation(invitation.token);
      setItemStatus(invitation.token, 'declined');
      Alert.alert('Declined', `Invitation to ${contextName(invitation)} declined.`);
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', error.message || 'Failed to decline invitation');
    } finally {
      setProcessing((p) => ({ ...p, [invitation.token]: false }));
    }
  };

  const handleAccept = (invitation, status) => {
    // Accepting after a prior decline is a change of mind — confirm it.
    if (status === 'declined') {
      Alert.alert(
        'Accept invitation?',
        `You previously declined the invitation to ${contextName(invitation)}. Accept it now and join?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Accept', onPress: () => runAccept(invitation) },
        ]
      );
      return;
    }
    runAccept(invitation);
  };

  const handleDecline = (invitation, status) => {
    // Declining removes any membership just granted — always confirm.
    const message =
      status === 'accepted'
        ? `You have joined ${contextName(invitation)}. Decline now and leave?`
        : `Are you sure you want to decline the invitation to ${contextName(invitation)}?`;
    Alert.alert('Decline invitation?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => runDecline(invitation) },
    ]);
  };

  const renderInvitation = ({ item }) => {
    const status = effectiveStatus(item);
    const statusMeta = getStatusMeta(status);
    const actions = getAvailableActions(status);
    const isProcessing = !!processing[item.token];
    const contextLines = describeContext(item);
    const icon = item.isCombo ? 'git-merge' : item.teamName ? 'people' : 'business';
    const iconColor = item.teamName && !item.orgName ? Colors.primary : Colors.secondary;

    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.invitationInfo}>
            <Text style={styles.entityName}>
              {item.orgName || item.teamName || 'Invitation'}
            </Text>
            <Text style={styles.invitationType}>
              {item.isCombo
                ? 'Organization + Team Invitation'
                : item.teamName && !item.orgName
                ? 'Team Invitation'
                : 'Organization Invitation'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: TONE_COLORS[statusMeta.tone] + '20' }]}>
            <Text style={[styles.badgeText, { color: TONE_COLORS[statusMeta.tone] }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {contextLines.length > 0 && (
          <View style={styles.contextBlock}>
            {contextLines.map((line, idx) => (
              <View style={styles.contextRow} key={`${item.token}-ctx-${idx}`}>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.textTertiary}
                />
                <Text style={styles.contextText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {item.inviterName ? (
          <Text style={styles.invitedBy}>Invited by {item.inviterName}</Text>
        ) : null}

        {actions.length > 0 ? (
          <View style={styles.actionButtons}>
            {actions.includes('decline') && (
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={() => handleDecline(item, status)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                    <Text style={styles.declineButtonText}>
                      {getActionLabel('decline', status)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {actions.includes('accept') && (
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAccept(item, status)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.acceptButtonText}>
                      {getActionLabel('accept', status)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.terminalNote}>
            {status === 'closed'
              ? 'This invitation was closed and can no longer be changed.'
              : 'This invitation has expired.'}
          </Text>
        )}

        {(status === 'accepted' || status === 'declined') && (
          <Text style={styles.reversibleHint}>
            You can still change your response while this invitation is open.
          </Text>
        )}
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
      {invitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No invitations</Text>
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
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contextBlock: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 4,
    flex: 1,
  },
  invitedBy: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
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
    color: Colors.white,
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
  terminalNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  reversibleHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 10,
  },
});

export default InvitationsScreen;
