/**
 * Org Switcher Modal (ORG-4)
 *
 * Presents the user's organizations so they can pick which one is their active
 * context. The currently active org is marked and non-interactive; tapping any
 * other org invokes `onSelect(orgId)`. State (fetching/switching) is owned by
 * the parent (ProfileScreen); this component is purely presentational.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

const OrgSwitcherModal = ({
  visible,
  organizations = [],
  switchingOrgId = null,
  onSelect,
  onClose,
}) => {
  const busy = switchingOrgId !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Switch Organization</Text>
          <Text style={styles.subtitle}>
            Choose which organization you're acting within.
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {organizations.length === 0 ? (
              <Text style={styles.emptyText}>You don't belong to any organizations yet.</Text>
            ) : (
              organizations.map((org) => {
                const isActive = !!org.isActive;
                const isSwitching = switchingOrgId === org.orgId;
                const personal = !!org.isPersonal;
                return (
                  <TouchableOpacity
                    key={org.orgId}
                    style={[styles.orgRow, isActive && styles.orgRowActive]}
                    onPress={() => {
                      if (isActive || busy) return;
                      onSelect(org.orgId);
                    }}
                    disabled={isActive || busy}
                    activeOpacity={0.7}
                  >
                    <View style={styles.orgRowMain}>
                      <View style={styles.orgNameRow}>
                        <Text style={styles.orgName} numberOfLines={1}>
                          {org.name}
                        </Text>
                        <View
                          style={[
                            styles.tenancyBadge,
                            personal ? styles.tenancyPersonal : styles.tenancyEnterprise,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tenancyBadgeText,
                              personal
                                ? styles.tenancyPersonalText
                                : styles.tenancyEnterpriseText,
                            ]}
                          >
                            {personal ? 'Personal' : 'Enterprise'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.orgMeta}>
                        {(org.memberCount ?? 0)} members · {(org.teamCount ?? 0)} teams
                      </Text>
                    </View>
                    <View style={styles.orgRowTrailing}>
                      {isSwitching ? (
                        <ActivityIndicator color={Colors.primary} />
                      ) : isActive ? (
                        <Text style={styles.activeLabel}>Active</Text>
                      ) : (
                        <Text style={styles.selectChevron}>›</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={busy}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  list: {
    marginTop: Layout.spacing.md,
  },
  listContent: {
    paddingBottom: Layout.spacing.xs,
  },
  emptyText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    paddingVertical: Layout.spacing.md,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  orgRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  orgRowMain: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgName: {
    flexShrink: 1,
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
  orgRowTrailing: {
    minWidth: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activeLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  selectChevron: {
    fontSize: 24,
    color: Colors.textTertiary,
    lineHeight: 24,
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
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: Layout.spacing.md,
    height: Layout.buttonHeight.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.buttonSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
});

export default OrgSwitcherModal;
