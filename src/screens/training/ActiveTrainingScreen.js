/**
 * Active Training Session Screen
 * 
 * Simple sequential walkthrough of training tasks with timer and completion tracking.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/api/apiClient';
import planApi from '../../services/api/planApi';
import assignmentApi from '../../services/api/assignmentApi';
import { APP_CONFIG } from '../../constants/Config';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * 0.5; // Optimized for space usage

// Session autosave: an in-progress session snapshot survives an app kill and
// is offered for resume when the same program is reopened soon after.
//
// CNT-1: the snapshot key is scoped per program AND per version. It used to be
// a single global key, so a snapshot taken against one version could be
// restored on top of a different one -- its currentTaskIndex then pointed at a
// different exercise entirely. Scoping the key means a superseded snapshot is
// never even found; the explicit versionId check below is the second gate, and
// it also catches a pre-CNT-1 snapshot written under the legacy key.
const SESSION_SNAPSHOT_KEY_PREFIX = 'active_session_snapshot_';
const LEGACY_SESSION_SNAPSHOT_KEY = 'active_session_snapshot';
const SNAPSHOT_MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours

const snapshotKeyFor = (programId, versionId) =>
  `${SESSION_SNAPSHOT_KEY_PREFIX}${programId || 'unknown'}_v${versionId || 'none'}`;

const ActiveTrainingScreen = ({ route, navigation }) => {
  const { planData: initialPlanData, assignmentId, planId, programId } = route.params || {};
  
  // An assignment-driven run must resolve its PINNED version before it can
  // show anything, so any planData handed over by the previous screen (which
  // was loaded from the live plan) is deliberately not trusted here.
  const [planData, setPlanData] = useState(assignmentId ? null : initialPlanData);
  const [loadingPlan, setLoadingPlan] = useState(assignmentId ? true : !initialPlanData);
  const [planError, setPlanError] = useState(null);
  const [versionId, setVersionId] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [skippedTasks, setSkippedTasks] = useState([]);
  const [videoKey, setVideoKey] = useState(0);
  const [hasPlayed30sWarning, setHasPlayed30sWarning] = useState(false);
  const [lastBeepSecond, setLastBeepSecond] = useState(-1);
  const [sessionId, setSessionId] = useState(null);
  const [totalTrainingTime, setTotalTrainingTime] = useState(0); // Accumulated time in seconds
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [taskTimes, setTaskTimes] = useState({}); // taskId -> actual seconds spent
  const resumeCheckedRef = useRef(false);
  const snapshotRef = useRef(null);
  const sessionStartRef = useRef(false);
  
  // Audio players using expo-audio
  const player30s = useAudioPlayer(require('../../assets/sounds/beep.mp3'));
  const player10s = useAudioPlayer(require('../../assets/sounds/beep.mp3'));
  // Using beep for completion since horn.mp3 is corrupted
  const playerComplete = useAudioPlayer(require('../../assets/sounds/beep.mp3'));

  const tasks = planData?.tasks || [];
  const currentTask = tasks[currentTaskIndex];
  const isLastTask = currentTaskIndex === tasks.length - 1;
  const allTasksComplete = tasks.length > 0 && currentTaskIndex >= tasks.length;

  // Keep the latest snapshot data available to the autosave interval without
  // re-registering it on every state change.
  snapshotRef.current = {
    sessionId,
    programId: planData?.programId || programId || planId || null,
    versionId,
    currentTaskIndex,
    totalTrainingTime,
    completedTasks,
    skippedTasks,
    taskTimes,
    inProgress: !allTasksComplete && (currentTaskIndex > 0 || totalTrainingTime > 0),
  };

  const persistSnapshot = async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot || !snapshot.inProgress || !snapshot.programId) return;
    try {
      await AsyncStorage.setItem(
        snapshotKeyFor(snapshot.programId, snapshot.versionId),
        JSON.stringify({ ...snapshot, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Error saving session snapshot:', error);
    }
  };

  const clearSnapshot = async () => {
    const snapshot = snapshotRef.current;
    try {
      await AsyncStorage.removeItem(
        snapshotKeyFor(snapshot?.programId, snapshot?.versionId)
      );
    } catch (error) {
      console.error('Error clearing session snapshot:', error);
    }
  };

  const offerResumeIfAvailable = async () => {
    try {
      // A pre-CNT-1 snapshot lives under the old global key and carries no
      // version at all, so there is no way to prove which version its task
      // index refers to. Discard it rather than risk restoring an index into a
      // different exercise list.
      await AsyncStorage.removeItem(LEGACY_SESSION_SNAPSHOT_KEY);

      const currentProgramId = planData?.programId || programId || planId || null;
      const snapshotKey = snapshotKeyFor(currentProgramId, versionId);
      const raw = await AsyncStorage.getItem(snapshotKey);
      if (!raw) return;

      const snapshot = JSON.parse(raw);
      const isFresh =
        snapshot.timestamp && Date.now() - snapshot.timestamp < SNAPSHOT_MAX_AGE_MS;
      if (!isFresh) {
        await AsyncStorage.removeItem(snapshotKey);
        return;
      }

      // CNT-1 (AC): the snapshot must belong to the exact version being
      // trained. The scoped key already makes a mismatch unfindable; this is
      // the explicit gate. A resumed index against a different task list is a
      // silent corruption -- restoring the WRONG exercise is strictly worse
      // than losing the resume, so a mismatch discards the snapshot.
      if ((snapshot.versionId || null) !== (versionId || null)) {
        console.log('Discarding session snapshot: version mismatch');
        await AsyncStorage.removeItem(snapshotKey);
        return;
      }

      const taskCount = planData?.tasks?.length || 0;
      const isResumable =
        snapshot.programId === currentProgramId &&
        (snapshot.currentTaskIndex > 0 || snapshot.totalTrainingTime > 0) &&
        snapshot.currentTaskIndex < taskCount;
      if (!isResumable) {
        await AsyncStorage.removeItem(snapshotKey);
        return;
      }

      Alert.alert(
        'Resume Session?',
        'Resume where you left off?',
        [
          {
            text: 'Start Over',
            style: 'destructive',
            onPress: () => {
              AsyncStorage.removeItem(snapshotKey).catch(err =>
                console.error('Error clearing session snapshot:', err)
              );
            },
          },
          {
            text: 'Resume',
            onPress: () => {
              setCurrentTaskIndex(snapshot.currentTaskIndex || 0);
              setTotalTrainingTime(snapshot.totalTrainingTime || 0);
              setCompletedTasks(snapshot.completedTasks || []);
              setSkippedTasks(snapshot.skippedTasks || []);
              setTaskTimes(snapshot.taskTimes || {});
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error checking session snapshot:', error);
    }
  };

  // Offer resume once, as soon as the plan (and its program id) is known
  useEffect(() => {
    if (planData && !resumeCheckedRef.current) {
      resumeCheckedRef.current = true;
      offerResumeIfAvailable();
    }
  }, [planData]);

  // Autosave the snapshot on the configured interval
  useEffect(() => {
    const interval = setInterval(persistSnapshot, APP_CONFIG.sessionAutoSaveInterval);
    return () => clearInterval(interval);
  }, []);

  // Save the snapshot on task transitions
  useEffect(() => {
    if (currentTaskIndex > 0 && !allTasksComplete) {
      persistSnapshot();
    }
  }, [currentTaskIndex]);

  // Resolve what this run actually trains, before anything is rendered.
  useEffect(() => {
    resolveTrainingContent();
  }, []);

  /**
   * CNT-1 (AC): an assignment-driven run trains the version the assignment
   * PINS -- never the author's live working copy. The assignment is read fresh
   * (assignmentApi.getAssignment is uncached) so a roll-forward is picked up
   * immediately, and its versionId then selects an immutable snapshot. Ad-hoc
   * (unassigned) training keeps using the current published plan, which is
   * correct: there is no pin to honour.
   */
  const resolveTrainingContent = async () => {
    setLoadingPlan(true);
    setPlanError(null);
    try {
      if (assignmentId) {
        const assignment = await assignmentApi.getAssignment(assignmentId);
        const pinnedVersionId = assignment?.versionId;

        if (pinnedVersionId) {
          const version = await planApi.getPlanVersion(pinnedVersionId);
          setVersionId(version.versionId || pinnedVersionId);
          setPlanData(version);
          return;
        }

        // No pin recorded. Fall through to the live plan rather than dead-end
        // the athlete; this is the legacy-assignment path.
        console.warn('Assignment has no pinned version; using the current plan');
      }

      if (initialPlanData && !assignmentId) {
        setVersionId(initialPlanData.currentVersionId || null);
        setPlanData(initialPlanData);
        return;
      }

      const id = planId || programId || initialPlanData?.programId;
      if (!id) {
        setPlanError('Failed to load training plan');
        return;
      }

      const plan = await planApi.getProgramDetails(id);
      setVersionId(plan.currentVersionId || null);
      setPlanData(plan);
    } catch (error) {
      // An archived plan or a deleted version lands here and shows the normal
      // error state rather than rendering a blank screen.
      console.error('Error resolving training content:', error);
      setPlanError('Failed to load training plan');
    } finally {
      setLoadingPlan(false);
    }
  };

  // Configure audio mode on mount
  useEffect(() => {
    configureAudio();
  }, []);

  // Reset audio warning flags when task changes
  useEffect(() => {
    setHasPlayed30sWarning(false);
    setLastBeepSecond(-1);
    setTimerPaused(false);
    setVideoKey(prev => prev + 1); // Force video reload
    // Reset task start time for new task
    setTaskStartTime(null);
  }, [currentTaskIndex]);

  // Start the session only once the content is resolved -- an assignment-driven
  // run has no planData at mount (it is still resolving its pinned version),
  // and startTrainingSession needs planData.programId.
  useEffect(() => {
    if (planData && !sessionStartRef.current) {
      sessionStartRef.current = true;
      startTrainingSession();
    }
  }, [planData]);

  // Complete session when all tasks are done
  useEffect(() => {
    if (allTasksComplete) {
      // The finished run should never be offered for resume again
      clearSnapshot();
    }
    if (allTasksComplete && sessionId) {
      completeTrainingSession();
    }
  }, [allTasksComplete, sessionId]);

  // Timer effect with audio notifications
  useEffect(() => {
    let interval;
    if (timerActive && !timerPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Play 30 second warning
          if (newTime === 30 && !hasPlayed30sWarning) {
            player30s.seekTo(0);
            player30s.play();
            setHasPlayed30sWarning(true);
          }
          
          // Play beep for each of the last 10 seconds
          if (newTime <= 10 && newTime > 0 && newTime !== lastBeepSecond) {
            player10s.seekTo(0);
            player10s.play();
            setLastBeepSecond(newTime);
          }
          
          // Timer complete - play completion sound and auto-advance
          if (newTime <= 0) {
            setTimerActive(false);
            console.log('Timer expired, playing completion sound');
            // Play three quick beeps for completion
            playerComplete.seekTo(0);
            playerComplete.play();
            setTimeout(() => {
              playerComplete.seekTo(0);
              playerComplete.play();
            }, 300);
            setTimeout(() => {
              playerComplete.seekTo(0);
              playerComplete.play();
            }, 600);
            // Auto-finish the task after sounds play
            setTimeout(() => {
              handleTaskComplete();
            }, 1500);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerPaused, timeRemaining, hasPlayed30sWarning, lastBeepSecond]);

  const configureAudio = async () => {
    try {
      // Configure audio mode for maximum volume and override silent mode
      await setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      // Set volume to maximum for all players
      player30s.volume = 1.0;
      player10s.volume = 1.0;
      playerComplete.volume = 1.0;
      
      console.log('Audio configured successfully');
    } catch (error) {
      console.error('Error configuring audio mode:', error);
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const startTimer = () => {
    if (currentTask) {
      setTimeRemaining(currentTask.timeTarget * 60); // Convert minutes to seconds
      setTimerActive(true);
      setTimerPaused(false);
      // Track when this task actually starts
      setTaskStartTime(new Date());
    }
  };

  const toggleTimer = () => {
    if (!timerActive) {
      startTimer();
    } else {
      setTimerPaused(!timerPaused);
    }
  };

  // Record the actual time spent on the current task (in seconds) into both
  // the session total and the per-task breakdown. No-op if the task was never
  // started, so an immediately skipped task records ~0.
  const recordTaskElapsed = () => {
    if (taskStartTime && currentTask) {
      const elapsedSeconds = Math.floor((new Date() - taskStartTime) / 1000);
      setTotalTrainingTime(prev => prev + elapsedSeconds);
      setTaskTimes(prev => ({
        ...prev,
        [currentTask.taskId]: (prev[currentTask.taskId] || 0) + elapsedSeconds,
      }));
    }
  };

  const handleSkipTask = () => {
    // Add time spent on this task (even if skipped) to totals
    recordTaskElapsed();

    setSkippedTasks([...skippedTasks, currentTask.taskId]);
    setTimerActive(false);
    
    if (!isLastTask) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setCurrentTaskIndex(currentTaskIndex + 1); // Triggers completion
    }
  };

  const handleTaskComplete = () => {
    // Add time spent on this task to totals
    recordTaskElapsed();

    setCompletedTasks([...completedTasks, currentTask.taskId]);
    playerComplete.seekTo(0);
    playerComplete.play();
    setTimerActive(false);
    
    // Move to next task or finish
    if (!isLastTask) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setCurrentTaskIndex(currentTaskIndex + 1); // Triggers completion
    }
  };

  const startTrainingSession = async () => {
    // Prevent duplicate session start attempts
    if (sessionId) {
      console.log('Session already initialized:', sessionId);
      return;
    }

    try {
      console.log('Starting session with programId:', planData.programId);
      console.log('Starting session with assignmentId:', assignmentId);
      
      const response = await apiClient.post('/api/gamification/sessions/start', {
        programId: planData.programId,
        assignmentId: assignmentId || null
      });
      
      if (response.data.status === 'success') {
        // Note: totalTrainingTime is deliberately not reset here — it starts at
        // 0 for a fresh run and may already hold restored snapshot time.
        setSessionId(response.data.data.session.sessionId);
        console.log('✅ Training session started:', response.data.data.session.sessionId);
      }
    } catch (error) {
      // If there's already an active session, use it or abandon it
      if (error.response?.status === 400 && error.response?.data?.data?.activeSession) {
        const activeSession = error.response.data.data.activeSession;
        
        // If it's for the same program, reuse it
        if (activeSession.programId === planData.programId) {
          console.log('♻️ Reusing existing session for same program:', activeSession.sessionId);
          setSessionId(activeSession.sessionId);
          // Preserve any accumulated training time — resetting it here would
          // discard progress from the run being resumed.
        } else {
          // Different program - abandon the old session and start new one
          console.log('🔄 Abandoning old session for different program');
          try {
            await apiClient.post(`/api/gamification/sessions/${activeSession.sessionId}/abandon`);
            console.log('✅ Old session abandoned, starting new session');
            // Clear sessionId to allow retry
            setSessionId(null);
            // Try starting again (but only once to prevent infinite loop)
            const retryResponse = await apiClient.post('/api/gamification/sessions/start', {
              programId: planData.programId,
              assignmentId: assignmentId || null
            });
            if (retryResponse.data.status === 'success') {
              setSessionId(retryResponse.data.data.session.sessionId);
              console.log('✅ New training session started:', retryResponse.data.data.session.sessionId);
            }
          } catch (abandonError) {
            console.error('❌ Error abandoning/restarting session:', abandonError.message);
          }
        }
      } else {
        console.error('❌ Error starting training session:', error.message);
      }
    }
  };

  const completeTrainingSession = async () => {
    try {
      if (!sessionId) {
        console.log('No session ID, skipping completion');
        return;
      }

      // Convert accumulated seconds to minutes
      const totalTime = Math.ceil(totalTrainingTime / 60) || 1; // At least 1 minute
      console.log(`Total training time: ${totalTime} minutes (${totalTrainingTime} seconds)`);

      // Build performance data for each task. timeSpent is the actual minutes
      // spent on the task (0 for tasks that were never started, e.g. skipped
      // immediately) — not the target.
      const performanceData = tasks.map(task => ({
        taskId: task.taskId,
        completed: completedTasks.includes(task.taskId),
        skipped: skippedTasks.includes(task.taskId),
        timeSpent: Math.round(((taskTimes[task.taskId] || 0) / 60) * 100) / 100
      }));

      const completionData = {
        totalTime,
        tasksCompleted: completedTasks.length,
        tasksTotal: tasks.length,
        performanceData,
        difficulty: planData.difficulty || 'medium'
      };

      console.log('Completing session with data:', completionData);

      const response = await apiClient.post(
        `/api/gamification/sessions/${sessionId}/complete`,
        completionData
      );
      
      if (response.data.status === 'success') {
        console.log('Training session completed successfully:', response.data.data);
      }
    } catch (error) {
      console.error('Error completing training session:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateStats = () => {
    const totalTasks = tasks.length;
    const completed = completedTasks.length;
    const skipped = skippedTasks.length;
    const totalXp = completedTasks.reduce((sum, taskId) => {
      const task = tasks.find(t => t.taskId === taskId);
      return sum + (task?.xpPerMinute * task?.timeTarget || 0);
    }, 0);

    return { totalTasks, completed, skipped, totalXp };
  };

  // Loading state
  if (loadingPlan) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading training plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (planError || !planData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{planError || 'Failed to load training plan'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (assignmentId || planId || programId || initialPlanData) {
                resolveTrainingContent();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.retryButtonText}>
              {assignmentId || planId || programId || initialPlanData ? 'Retry' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Summary Screen
  if (allTasksComplete) {
    const stats = calculateStats();
    
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trophy" size={80} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Workout Complete! 🎉</Text>
            <Text style={styles.planName}>{planData?.name || 'Training Session'}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalXp}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
          </View>

          {stats.skipped > 0 && (
            <View style={styles.skippedInfo}>
              <Text style={styles.skippedText}>
                {stats.skipped} task{stats.skipped > 1 ? 's' : ''} skipped
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active Task Screen
  const videoId = getYouTubeVideoId(currentTask?.primaryVideoUrl);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.contentContainer}>
        {/* Compact Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Task {currentTaskIndex + 1}/{tasks.length}
            </Text>
            <Text style={styles.taskName}>{currentTask?.name}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentTaskIndex + 1) / tasks.length) * 100}%` }
              ]} 
            />
          </View>
          {currentTask?.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {currentTask.description}
            </Text>
          )}
        </View>

        {/* Optimized Video Player */}
        {videoId && (
          <View style={styles.videoContainer}>
            <YoutubePlayer
              key={`video-${currentTaskIndex}-${videoKey}`}
              height={VIDEO_HEIGHT}
              videoId={videoId}
              play={false}
              onError={(error) => console.log('YouTube Player Error:', error)}
            />
          </View>
        )}

        {/* Compact Timer & Actions Combined */}
        <View style={styles.bottomSection}>
          <View style={styles.timerContainer}>
            <TouchableOpacity 
              style={styles.timerButton}
              onPress={toggleTimer}
            >
              <Ionicons 
                name={!timerActive ? "play" : (timerPaused ? "play" : "pause")} 
                size={28} 
                color={Colors.primary} 
              />
            </TouchableOpacity>
            
            <View style={styles.timerInfo}>
              <Text style={styles.timerLabel}>
                {timerActive ? (timerPaused ? 'Paused' : 'Time Remaining') : 'Target'}
              </Text>
              <Text style={styles.timerDisplay}>
                {timerActive ? formatTime(timeRemaining) : `${currentTask?.timeTarget || 0} min`}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.skipButton]}
              onPress={handleSkipTask}
            >
              <Ionicons name="play-skip-forward" size={20} color={Colors.textSecondary} />
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.finishButton]}
              onPress={handleTaskComplete}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressContainer: {
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.xs,
    backgroundColor: Colors.surface,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  progressText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
    lineHeight: 18,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  taskName: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: Colors.black,
  },
  bottomSection: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.xs,
    gap: Layout.spacing.sm,
  },
  timerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  timerDisplay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.xs,
  },
  skipButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  finishButton: {
    backgroundColor: Colors.success,
  },
  finishButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  // Summary Screen Styles
  summaryContainer: {
    flex: 1,
  },
  summaryHeader: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
    paddingTop: Layout.spacing.xxl,
  },
  summaryTitle: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  planName: {
    fontSize: Layout.fontSize.lg,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.xs,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  skippedInfo: {
    marginHorizontal: Layout.spacing.lg,
    padding: Layout.spacing.md,
    backgroundColor: Colors.warningLight,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
  },
  skippedText: {
    fontSize: Layout.fontSize.md,
    color: Colors.warning,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Layout.spacing.lg,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  doneButtonText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
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
    padding: Layout.spacing.xl,
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
    color: Colors.textInverse,
  },
});

export default ActiveTrainingScreen;
