/**
 * Plan Details Screen
 * 
 * Mobile-first view for training plan details with intro video and collapsible task sections.
 * Prioritizes video content and task overview, with expandable sections for tips, instructions, and safety.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAuth } from '../../contexts/AuthContext';
import planApi from '../../services/api/planApi';
import assignmentApi from '../../services/api/assignmentApi';
import AssignmentModal from '../../components/AssignmentModal';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * 0.5625; // 16:9 aspect ratio

const PlanDetailsScreen = ({ route, navigation }) => {
  const { assignmentId, programId, programName = 'Training Plan' } = route.params || {};
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  
  // Assignment state
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assignmentType, setAssignmentType] = useState(null); // 'personal' | 'team' | null
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    fetchPlanDetails();
    if (user?.userId) {
      checkAssignmentStatus();
    }
  }, [programId, user?.userId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch program details with tasks from API
      const program = await planApi.getProgramDetails(programId);
      
      setPlanData(program);
      setLoading(false);
      
    } catch (err) {
      console.error('Error fetching plan details:', err);
      setError(err.message || 'Failed to load plan details');
      setLoading(false);
    }
  };

  const checkAssignmentStatus = async () => {
    if (!user?.userId || !programId) return;
    
    try {
      setAssignmentLoading(true);
      
      // Check if this program is assigned to the user
      const result = await assignmentApi.checkProgramAssignment(user.userId, programId);
      
      console.log('Assignment check result:', result);
      
      if (result.isAssigned) {
        setCurrentAssignment(result.assignment);
        setAssignmentType(result.assignmentType);
      } else {
        setCurrentAssignment(null);
        setAssignmentType(null);
      }
    } catch (err) {
      console.error('Error checking assignment status:', err);
      // Don't show error to user, just log it
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleSaveAssignment = async (assignmentData) => {
    if (!user?.userId) {
      Alert.alert('Error', 'You must be logged in to create assignments');
      return;
    }

    try {
      if (currentAssignment && assignmentType === 'personal') {
        // Update existing personal assignment
        await assignmentApi.updateAssignment(currentAssignment.assignmentId, assignmentData);
        Alert.alert('Success', 'Training schedule updated successfully');
      } else {
        // Create new personal assignment
        const newAssignment = await assignmentApi.createAssignment({
          ...assignmentData,
          programId,
          assignedToUser: user.userId,
        });
        Alert.alert('Success', 'Training plan added to your schedule');
      }
      
      // Refresh assignment status
      await checkAssignmentStatus();
    } catch (error) {
      console.error('Error saving assignment:', error);
      throw error; // Let modal handle the error display
    }
  };

  const toggleSection = (taskId, section) => {
    const key = `${taskId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSectionExpanded = (taskId, section) => {
    const key = `${taskId}-${section}`;
    return expandedSections[key] || false;
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const openVideo = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return Colors.success;
      case 'medium': return Colors.warning;
      case 'hard': return Colors.error;
      case 'elite': return Colors.primary;
      default: return Colors.textSecondary;
    }
  };

  const renderIntroVideo = () => {
    if (!planData.introVideoUrl) {
      console.log('No introVideoUrl found');
      return null;
    }

    console.log('Original video URL:', planData.introVideoUrl);
    const videoId = getYouTubeVideoId(planData.introVideoUrl);
    console.log('Extracted video ID:', videoId);
    
    if (!videoId) {
      console.log('Failed to extract video ID');
      return null;
    }

    return (
      <View style={styles.videoContainer}>
        <Text style={styles.videoTitle}>Introduction Video</Text>
        <View style={styles.video}>
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            videoId={videoId}
            play={false}
            onError={(error) => console.log('YouTube Player Error:', error)}
          />
        </View>
      </View>
    );
  };

  const renderCollapsibleSection = (taskId, section, title, content, icon) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    
    const isExpanded = isSectionExpanded(taskId, section);
    const displayContent = Array.isArray(content) ? content.join('\n') : content;

    return (
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => toggleSection(taskId, section)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons name={icon} size={18} color={Colors.primary} />
            <Text style={styles.collapsibleTitle}>{title}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.collapsibleContent}>
            <Text style={styles.collapsibleText}>{displayContent}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTask = (task, index) => {
    const totalXp = task.timeTarget * task.xpPerMinute;
    
    return (
      <View key={task.taskId} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskNumberBadge}>
            <Text style={styles.taskNumber}>{index + 1}</Text>
          </View>
          <View style={styles.taskHeaderContent}>
            <Text style={styles.taskName}>{task.name}</Text>
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}
          </View>
        </View>

        <View style={styles.taskMeta}>
          <View style={styles.taskMetaItem}>
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
            <Text style={styles.taskMetaText}>{task.timeTarget} min</Text>
          </View>
          <View style={styles.taskMetaItem}>
            <Ionicons name="trophy-outline" size={16} color={Colors.warning} />
            <Text style={styles.taskMetaText}>{totalXp} XP</Text>
          </View>
        </View>

        {task.primaryVideoUrl && (
          <TouchableOpacity
            style={styles.taskVideoButton}
            onPress={() => openVideo(task.primaryVideoUrl)}
          >
            <Ionicons name="play-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.taskVideoButtonText}>Watch Demo</Text>
          </TouchableOpacity>
        )}

        {renderCollapsibleSection(task.taskId, 'instructions', 'Instructions', task.instructions, 'list-outline')}
        {renderCollapsibleSection(task.taskId, 'tips', 'Tips', task.tips, 'bulb-outline')}
        {renderCollapsibleSection(task.taskId, 'safety', 'Safety Notes', task.safetyNotes, 'shield-checkmark-outline')}
        {renderCollapsibleSection(task.taskId, 'equipment', 'Equipment', task.equipment, 'fitness-outline')}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlanDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!planData) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {planData.name}
          </Text>
          {assignmentType && (
            <View style={styles.scheduledBadge}>
              <Ionicons name="calendar" size={12} color={Colors.primary} />
              <Text style={styles.scheduledBadgeText}>Scheduled</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderIntroVideo()}

        <View style={styles.planInfo}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{planData.name}</Text>
            <View style={styles.planBadges}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(planData.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(planData.difficulty) }]}>
                  {planData.difficulty}
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{planData.sportCategory}</Text>
              </View>
            </View>
          </View>

          {planData.description && (
            <Text style={styles.planDescription}>{planData.description}</Text>
          )}

          <View style={styles.planStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{planData.estimatedDurationMinutes}</Text>
              <Text style={styles.statLabel}>minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{planData.tasks?.length || 0}</Text>
              <Text style={styles.statLabel}>tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={20} color={Colors.warning} />
              <Text style={styles.statValue}>{planData.totalXp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>
        </View>

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Training Tasks</Text>
          {planData.tasks?.map((task, index) => renderTask(task, index))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        {assignmentType === 'team' ? (
          // Team assignment: Only Start Training button
          <View style={styles.footerButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('ActiveTraining', { 
                planData, 
                assignmentId: currentAssignment?.assignmentId 
              })}
            >
              <Ionicons name="play" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Start Training</Text>
            </TouchableOpacity>
          </View>
        ) : assignmentType === 'personal' ? (
          // Personal assignment: Start Training + Edit Assignment buttons
          <View style={styles.footerButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setShowAssignmentModal(true)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton, { flex: 2 }]}
              onPress={() => navigation.navigate('ActiveTraining', { 
                planData, 
                assignmentId: currentAssignment?.assignmentId 
              })}
            >
              <Ionicons name="play" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Start Training</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // No assignment: Start Training + Create Assignment buttons
          <View style={styles.footerButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setShowAssignmentModal(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton, { flex: 2 }]}
              onPress={() => navigation.navigate('ActiveTraining', { planData, assignmentId: null })}
            >
              <Ionicons name="play" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Start Training</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {assignmentType && (
          <View style={styles.assignmentInfo}>
            <Ionicons 
              name={assignmentType === 'team' ? 'people' : 'person'} 
              size={14} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.assignmentInfoText}>
              {assignmentType === 'team' ? 'Team Assignment' : 'Personal Assignment'}
              {currentAssignment?.teamName && ` • ${currentAssignment.teamName}`}
            </Text>
          </View>
        )}
      </View>

      <AssignmentModal
        visible={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSave={handleSaveAssignment}
        assignment={assignmentType === 'personal' ? currentAssignment : null}
        programName={planData.name}
        isEditing={assignmentType === 'personal'}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  scheduledBadgeText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  
  // Video Section
  videoContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: Colors.surface,
    marginBottom: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  videoTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  video: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: Colors.black,
  },
  
  // Plan Info
  planInfo: {
    padding: Layout.spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  planHeader: {
    marginBottom: Layout.spacing.md,
  },
  planName: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  planBadges: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  difficultyText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryBadge: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary + '20',
  },
  categoryText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  planDescription: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Layout.spacing.md,
  },
  planStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Layout.spacing.xs,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  
  // Tasks Section
  tasksSection: {
    padding: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.sm,
  },
  taskNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  taskNumber: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.white,
  },
  taskHeaderContent: {
    flex: 1,
  },
  taskName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  taskVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  taskVideoButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  
  // Collapsible Sections
  collapsibleSection: {
    marginTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.spacing.sm,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  collapsibleTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  collapsibleContent: {
    paddingTop: Layout.spacing.sm,
    paddingLeft: Layout.spacing.md,
  },
  collapsibleText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Footer
  footer: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.white,
  },
  secondaryButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  assignmentInfoText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
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
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  retryButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  
  bottomPadding: {
    height: Layout.spacing.xl,
  },
});

export default PlanDetailsScreen;
