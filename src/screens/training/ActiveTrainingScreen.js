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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import apiClient from '../../services/api/apiClient';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * 0.5; // Optimized for space usage

const ActiveTrainingScreen = ({ route, navigation }) => {
  const { planData, assignmentId } = route.params;
  
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
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Audio players using expo-audio
  const player30s = useAudioPlayer(require('../../assets/sounds/beep.mp3'));
  const player10s = useAudioPlayer(require('../../assets/sounds/beep.mp3'));
  // Using beep for completion since horn.mp3 is corrupted
  const playerComplete = useAudioPlayer(require('../../assets/sounds/beep.mp3'));

  const tasks = planData?.tasks || [];
  const currentTask = tasks[currentTaskIndex];
  const isLastTask = currentTaskIndex === tasks.length - 1;
  const allTasksComplete = currentTaskIndex >= tasks.length;

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
  }, [currentTaskIndex]);

  // Start session when component mounts
  useEffect(() => {
    startTrainingSession();
  }, []);

  // Complete session when all tasks are done
  useEffect(() => {
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
              handleFinish();
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
    if (currentTask?.timeTarget) {
      setTimeRemaining(currentTask.timeTarget * 60); // Convert minutes to seconds
      setTimerActive(true);
      setTimerPaused(false);
    }
  };

  const toggleTimer = () => {
    if (!timerActive) {
      startTimer();
    } else {
      setTimerPaused(!timerPaused);
    }
  };

  const handleSkip = () => {
    setSkippedTasks([...skippedTasks, currentTask.taskId]);
    setTimerActive(false);
    setTimeRemaining(0);
    
    if (isLastTask) {
      setCurrentTaskIndex(tasks.length);
    } else {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const handleFinish = () => {
    setCompletedTasks([...completedTasks, currentTask.taskId]);
    setTimerActive(false);
    setTimeRemaining(0);
    
    if (isLastTask) {
      setCurrentTaskIndex(tasks.length);
    } else {
      setCurrentTaskIndex(currentTaskIndex + 1);
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
        setSessionId(response.data.data.session.sessionId);
        setSessionStartTime(new Date());
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
          setSessionStartTime(new Date(activeSession.startedAt));
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
              setSessionStartTime(new Date());
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

      const endTime = new Date();
      const totalTime = sessionStartTime 
        ? Math.floor((endTime - sessionStartTime) / 1000 / 60) // minutes
        : planData.estimatedDurationMinutes || 30;

      // Build performance data for each task
      const performanceData = tasks.map(task => ({
        taskId: task.taskId,
        completed: completedTasks.includes(task.taskId),
        skipped: skippedTasks.includes(task.taskId),
        timeSpent: task.timeTarget || 0
      }));

      const completionData = {
        totalTime,
        tasksCompleted: completedTasks.length,
        tasksTotal: tasks.length,
        performanceData,
        difficulty: planData.difficulty || 'medium'
      };

      const response = await apiClient.post(
        `/api/gamification/sessions/${sessionId}/complete`,
        completionData
      );
      
      if (response.data.status === 'success') {
        console.log('Training session completed:', response.data.data);
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

  // Summary Screen
  if (allTasksComplete) {
    const stats = calculateStats();
    
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trophy" size={80} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Workout Complete! 🎉</Text>
            <Text style={styles.planName}>{planData.name}</Text>
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
              onPress={handleSkip}
            >
              <Ionicons name="play-skip-forward" size={20} color={Colors.textSecondary} />
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.finishButton]}
              onPress={handleFinish}
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
});

export default ActiveTrainingScreen;
