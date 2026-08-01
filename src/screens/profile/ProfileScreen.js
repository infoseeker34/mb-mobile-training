/**
 * Profile Screen
 * 
 * User profile with settings and logout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import organizationApi from '../../services/api/organizationApi';
import userApi from '../../services/api/userApi';
import teamApi from '../../services/api/teamApi';
import OrgSwitcherModal from '../../components/OrgSwitcherModal';
import {
  PERSONAL_ORG_TEAM_LIMIT,
  isPersonalOrg,
  isPersonalOrgTeamLimitError,
  getReportedTeamLimit,
  buildTeamLimitAlert,
} from '../../services/api/teamLimit';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // Active-org context switching state (ORG-4). `myOrgs` comes from
  // GET /api/users/me/organizations, where each org carries an `isActive` flag
  // marking the user's current context.
  const [myOrgs, setMyOrgs] = useState([]);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState(null);

  // Team-creation modal state (ORG-6)
  const [createOrg, setCreateOrg] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      const result = await organizationApi.getOrganizations();
      return result?.data?.organizations || [];
    } catch (error) {
      // Non-fatal — the section just renders empty if the fetch fails.
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const orgs = await loadOrganizations();
      if (mounted && orgs) setOrganizations(orgs);
      if (mounted) setOrgsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadOrganizations]);

  const refreshOrganizations = useCallback(async () => {
    const orgs = await loadOrganizations();
    if (orgs) setOrganizations(orgs);
  }, [loadOrganizations]);

  // ORG-4: load the user's orgs with their active-context flag. Kept separate
  // from the ORG-6 organizations list (different endpoint/shape) so the two
  // slices don't entangle.
  const loadMyOrgs = useCallback(async () => {
    try {
      const result = await userApi.getUserOrganizations();
      return result?.data?.organizations || [];
    } catch (error) {
      // Non-fatal — the switcher simply won't render if this fails.
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const orgs = await loadMyOrgs();
      if (mounted && orgs) setMyOrgs(orgs);
    })();
    return () => {
      mounted = false;
    };
  }, [loadMyOrgs]);

  const activeOrg = myOrgs.find((org) => org.isActive) || null;

  // Switch active org context: persist server-side, then re-fetch so the
  // active label and the switcher's highlight reflect the new context.
  const handleSelectOrg = async (orgId) => {
    if (!orgId || orgId === activeOrg?.orgId) {
      setSwitcherVisible(false);
      return;
    }
    setSwitchingOrgId(orgId);
    try {
      await userApi.setActiveOrganization(orgId);
      const orgs = await loadMyOrgs();
      if (orgs) setMyOrgs(orgs);
      setSwitcherVisible(false);
      const picked = (orgs || myOrgs).find((org) => org.orgId === orgId);
      Alert.alert(
        'Organization switched',
        picked ? `You're now acting within "${picked.name}".` : 'Active organization updated.'
      );
    } catch (error) {
      // 403 when the user isn't an active member of the target org.
      const message =
        error?.response?.status === 403
          ? error?.response?.data?.message ||
            'You are not an active member of that organization.'
          : error?.response?.data?.message || error?.message || 'Failed to switch organization.';
      Alert.alert('Could not switch', message);
    } finally {
      setSwitchingOrgId(null);
    }
  };

  // Personal orgs are capped; short-circuit with the friendly limit alert when
  // the org is already at its limit, otherwise open the create-team modal.
  const handleCreateTeamPress = (org) => {
    if (isPersonalOrg(org) && (org.team_count ?? 0) >= PERSONAL_ORG_TEAM_LIMIT) {
      const { title, message } = buildTeamLimitAlert(PERSONAL_ORG_TEAM_LIMIT);
      Alert.alert(title, message);
      return;
    }
    setTeamName('');
    setCreateOrg(org);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOrg(null);
    setTeamName('');
  };

  const submitCreateTeam = async () => {
    const name = teamName.trim();
    if (!name) {
      Alert.alert('Team name required', 'Please enter a name for the team.');
      return;
    }
    if (!createOrg) return;

    setCreating(true);
    try {
      await teamApi.createTeam(createOrg.id, { name });
      setCreateOrg(null);
      setTeamName('');
      await refreshOrganizations();
      Alert.alert('Team created', `"${name}" was created.`);
    } catch (error) {
      // Backend is the source of truth for the cap: handle its 403 even if the
      // client's team_count was stale and let us open the modal.
      if (isPersonalOrgTeamLimitError(error)) {
        setCreateOrg(null);
        setTeamName('');
        const { title, message } = buildTeamLimitAlert(getReportedTeamLimit(error));
        Alert.alert(title, message);
      } else {
        Alert.alert('Error', error?.message || 'Failed to create team');
      }
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'Athlete'}</Text>
          <Text style={styles.username}>@{user?.username || 'user'}</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoCard}>
            <InfoRow label="Email" value={user?.email || 'N/A'} />
            <InfoRow label="First Name" value={user?.extensions?.firstName || 'N/A'} />
            <InfoRow label="Last Name" value={user?.extensions?.lastName || 'N/A'} />
            <InfoRow label="Date of Birth" value={formatDate(user?.extensions?.dateOfBirth)} />
            <InfoRow label="Age Group" value={user?.ageGroup || 'N/A'} />
            <InfoRow label="Gender" value={user?.extensions?.gender || 'N/A'} />
            <InfoRow label="Phone" value={user?.extensions?.phoneNumber || 'N/A'} />
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.infoCard}>
            <InfoRow label="Account Type" value={user?.accountType || 'N/A'} />
            <InfoRow label="Member Since" value={formatDate(user?.createdAt)} />
            <InfoRow label="Last Login" value={formatDate(user?.lastLogin)} />
          </View>
        </View>

        {/* Active Organization (ORG-4) */}
        {myOrgs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Organization</Text>
            <View style={styles.infoCard}>
              <View style={styles.activeOrgRow}>
                <View style={styles.activeOrgTextGroup}>
                  <Text style={styles.activeOrgName} numberOfLines={1}>
                    {activeOrg?.name || 'None selected'}
                  </Text>
                  {activeOrg && (
                    <Text style={styles.activeOrgMeta}>
                      {activeOrg.isPersonal ? 'Personal' : 'Enterprise'}
                    </Text>
                  )}
                </View>
                {myOrgs.length > 1 && (
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setSwitcherVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchButtonText}>Switch</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Organizations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organizations</Text>
          {orgsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : organizations.length === 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>No organizations yet.</Text>
            </View>
          ) : (
            organizations.map((org) => {
              const personal = isPersonalOrg(org);
              const teamCount = org.team_count ?? 0;
              const atLimit = personal && teamCount >= PERSONAL_ORG_TEAM_LIMIT;
              const teamsLabel = personal
                ? `${teamCount} of ${PERSONAL_ORG_TEAM_LIMIT} teams`
                : `${teamCount} teams`;
              return (
                <View key={org.id} style={styles.orgCard}>
                  <View style={styles.orgHeaderRow}>
                    <Text style={styles.orgName}>{org.name}</Text>
                    <View
                      style={[
                        styles.tenancyBadge,
                        personal ? styles.tenancyPersonal : styles.tenancyEnterprise,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tenancyBadgeText,
                          personal ? styles.tenancyPersonalText : styles.tenancyEnterpriseText,
                        ]}
                      >
                        {personal ? 'Personal' : 'Enterprise'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orgMeta}>
                    {(org.member_count ?? 0)} members · {teamsLabel}
                  </Text>
                  {atLimit && (
                    <Text style={styles.orgLimitNote}>
                      Team limit reached — delete a team or upgrade to enterprise to add more.
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.createTeamButton}
                    onPress={() => handleCreateTeamPress(org)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.createTeamButtonText}>+ Create Team</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Settings Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Coming Soon →</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy</Text>
            <Text style={styles.settingValue}>Coming Soon →</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Text style={styles.settingValue}>Coming Soon →</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Team modal (ORG-6) */}
      <Modal
        visible={createOrg !== null}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Team</Text>
            <Text style={styles.modalSubtitle}>in {createOrg?.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Team name"
              placeholderTextColor={Colors.textTertiary}
              value={teamName}
              onChangeText={setTeamName}
              autoFocus
              editable={!creating}
              returnKeyType="done"
              onSubmitEditing={submitCreateTeam}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeCreateModal}
                disabled={creating}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={submitCreateTeam}
                disabled={creating}
                activeOpacity={0.7}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.modalButtonCreateText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Org context switcher (ORG-4) */}
      <OrgSwitcherModal
        visible={switcherVisible}
        organizations={myOrgs}
        switchingOrgId={switchingOrgId}
        onSelect={handleSelectOrg}
        onClose={() => {
          if (switchingOrgId === null) setSwitcherVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.textInverse,
  },
  displayName: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  username: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  
  // Sections
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Active organization (ORG-4)
  activeOrgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeOrgTextGroup: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  activeOrgName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  activeOrgMeta: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  switchButton: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  switchButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Organization card
  orgCard: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orgName: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Layout.spacing.sm,
  },
  orgMeta: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  orgLimitNote: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.xs,
    color: Colors.warning,
  },
  createTeamButton: {
    alignSelf: 'flex-start',
    marginTop: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  createTeamButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  tenancyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tenancyPersonal: {
    backgroundColor: '#e5e7eb',
  },
  tenancyEnterprise: {
    backgroundColor: '#dbeafe',
  },
  tenancyBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  tenancyPersonalText: {
    color: '#374151',
  },
  tenancyEnterpriseText: {
    color: '#1e40af',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  
  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  // Create Team modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
  },
  modalTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSubtitle: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  modalInput: {
    marginTop: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Layout.spacing.lg,
  },
  modalButton: {
    minWidth: 96,
    height: Layout.buttonHeight.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginLeft: Layout.spacing.sm,
  },
  modalButtonCancel: {
    backgroundColor: Colors.buttonSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonCancelText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  modalButtonCreate: {
    backgroundColor: Colors.buttonPrimary,
  },
  modalButtonCreateText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: Colors.error,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  logoutButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});

export default ProfileScreen;
