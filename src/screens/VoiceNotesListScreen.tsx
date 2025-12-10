import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
  Easing,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useVoiceNotes } from '../hooks/useVoiceNotes';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { OrbRecordButton } from '../components/OrbRecordButton';
import { ProModeButton } from '../components/ProModeButton';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../utils/haptics';
import { loadSettingsAsync, saveSettings } from '../storage';
import { RootStackParamList } from '../types';
import { formatDuration } from '../utils/format';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { TimerText } from '../components/TimerText';
import { BouncingDots } from '../components/BouncingDots';
import { SettingsModal } from '../components/SettingsModal';
import { MainHeader } from '../components/MainHeader';

type Nav = StackNavigationProp<RootStackParamList, 'List'>;



export const VoiceNotesListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { notes, createNote, transcribeNote, deleteNote } = useVoiceNotes();
  const { isRecording, durationMs, currentLevel, startRecording, stopRecording } = useAudioRecorder();

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettingsAsync().then(settings => {
      setHapticsEnabled(settings.hapticsEnabled);
      HapticFeedback.setEnabled(settings.hapticsEnabled);
    });
  }, []);

  const toggleHaptics = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    HapticFeedback.setEnabled(enabled);
    saveSettings({ hapticsEnabled: enabled });
    if (enabled) HapticFeedback.selection();
  };

  // Animation value for the "Recent Note" card to exit
  const exitAnim = useRef(new Animated.Value(0)).current;
  const [showRecent, setShowRecent] = useState(true);

  // Typewriter effect for transcription
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get the most recent note
  const latestNote = notes && notes.length > 0 ? notes[0] : null;

  // Typewriter effect when transcript changes
  useEffect(() => {
    if (!latestNote || !latestNote.transcript) {
      setDisplayedTranscript('');
      return;
    }

    const fullText = latestNote.transcript;
    let currentIndex = 0;
    setDisplayedTranscript(''); // Reset

    // Clear any existing interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    // Type character by character
    typewriterIntervalRef.current = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedTranscript(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
      }
    }, 30); // 30ms per character for smooth typing effect

    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, [latestNote?.transcript]);

  // Blinking cursor animation
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blinkAnimation.start();
    return () => blinkAnimation.stop();
  }, []);

  // Get the most recent note (keep for backwards compatibility)

  const onPressRecord = async () => {
    if (!isRecording) {
      // Starting a new recording

      // If there is a recent note displayed, animate it out first
      if (latestNote && showRecent) {
        Animated.timing(exitAnim, {
          toValue: 1, // 1 means exited
          duration: 400,
          useNativeDriver: true,
        }).start(async () => {
          setShowRecent(false); // Hide it from this view
          await startRecording();
        });
      } else {
        await startRecording();
      }
      return;
    }

    try {
      // Stop recording
      const result = await stopRecording();
      if (!result) {
        Alert.alert('Error', 'Recording stopped but returned no data. Was it too short?');
        return;
      }

      console.log('Recording stopped. URI:', result.uri);
      const note = createNote(result.uri, result.durationMs);

      // Show card immediately
      setShowRecent(true);
      exitAnim.setValue(0);

      // Start transcription
      transcribeNote(note.id, note.audioUri);

    } catch (e: any) {
      Alert.alert('Error', 'Failed to process recording: ' + e.message);
    }
  };

  const onPressHistory = () => {
    HapticFeedback.impact();
    navigation.navigate('History');
  };

  const onPressProMode = () => {
    HapticFeedback.impact();
    navigation.navigate('Lipsync');
  };

  const onClosePanel = () => {
    HapticFeedback.selection(); // Light feedback for closing
    // Animate out and hide - increased duration for smoother animation
    Animated.timing(exitAnim, {
      toValue: 1,
      duration: 600, // Increased from 300ms to 600ms
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Hide immediately
      setShowRecent(false);
      // Delay reset to prevent flash-back
      setTimeout(() => {
        exitAnim.setValue(0);
      }, 50);
    });
  };

  const clearAllHistory = () => {
    HapticFeedback.warning(); // Warning vibration for destructive action
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete ALL voice notes? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => HapticFeedback.selection(), // Light feedback on cancel
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Ask for verification code
            Alert.prompt(
              'Verification Required',
              'Please enter the verification code to confirm deletion:',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => HapticFeedback.selection(),
                },
                {
                  text: 'Delete All',
                  style: 'destructive',
                  onPress: (code?: string) => {
                    if (code === '12345') {
                      HapticFeedback.error(); // Error/destructive vibration
                      // Delete all notes
                      notes.forEach(note => deleteNote(note.id));
                      setShowSettings(false);
                      Alert.alert('Success', 'All voice notes have been deleted.');
                    } else {
                      HapticFeedback.error();
                      Alert.alert('Error', 'Incorrect verification code. Deletion cancelled.');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  const renderRecentNote = () => {
    if (!latestNote || !showRecent) return null;

    // Slide up/down or fade
    const translateY = exitAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 100], // slide down 100px
    });
    const opacity = exitAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0], // fade out
    });

    return (
      <Animated.View style={[styles.recentCardWrapper, { opacity, transform: [{ translateY }] }]} >
        {/* Gradient Border Container */}
        < LinearGradient
          colors={['#00D4FF', '#5E5CE6', '#00FFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }
          }
          style={styles.gradientBorder}
        >
          {/* Inner Card with Glass Effect */}
          < View style={styles.recentCard} >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClosePanel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={28} color="#00D4FF" />
            </TouchableOpacity>

            <Text style={styles.recentLabel}>Latest Recording</Text>
            <Text style={styles.recentTime}>
              {new Date(latestNote.createdAt).toLocaleTimeString()} • {formatDuration(latestNote.durationMs)}
            </Text>

            {/* Scrollable Transcription Area */}
            <ScrollView
              style={styles.transcriptScrollView}
              contentContainerStyle={styles.transcriptScrollContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle="white"
            >
              <Text style={styles.recentTranscript}>
                {latestNote.transcriptStatus === 'pending' ? (
                  'Transcribing'
                ) : displayedTranscript || 'No transcript'}
                {displayedTranscript && displayedTranscript.length < (latestNote.transcript?.length || 0) && (
                  <Animated.Text style={[styles.typingCursor, { opacity: cursorOpacity }]}>|</Animated.Text>
                )}
              </Text>
            </ScrollView>

            {/* Summary Section (if available) */}
            {
              latestNote.aiSummary && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryLabel}>AI Summary</Text>
                  <Text style={styles.summaryText}>{latestNote.aiSummary}</Text>
                </View>
              )
            }

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.recentOpenBtn}
                onPress={() => {
                  HapticFeedback.impact();
                  navigation.navigate('Detail', { noteId: latestNote.id });
                }}
              >
                <Text style={styles.recentOpenText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View >
        </LinearGradient >
      </Animated.View >
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader
        onHistoryPress={onPressHistory}
        onSettingsPress={() => { HapticFeedback.impact(); setShowSettings(true); }}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={toggleHaptics}
        onClearHistory={clearAllHistory}
      />

      <View style={styles.mainContent}>
        {isRecording ? (

          <>
            <Text style={styles.recordingText}>Recording</Text>
            <TimerText text={formatDuration(durationMs)} />

            <View style={styles.visualizerWrapper}>
              <AudioVisualizer level={currentLevel} />
            </View>

            <View style={styles.dotsWrapper}>
              <BouncingDots />
            </View>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            {/* If we have a recent note, show it. Otherwise show placeholder text */}
            {(latestNote && showRecent) ? (
              renderRecentNote()
            ) : (
              <Text style={styles.placeholderText}>Tap below to start</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {/* Pro Mode Button - Left */}
          <View style={styles.footerSide}>
            <ProModeButton onPress={onPressProMode} disabled={isRecording} />
          </View>

          {/* Recording Button - Center */}
          <View style={styles.footerCenter}>
            <OrbRecordButton
              isRecording={isRecording}
              onPress={onPressRecord}
              size={75}
              currentLevel={currentLevel}
            />
          </View>

          {/* Spacer - Right (for visual balance) */}
          <View style={styles.footerSide} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  recordingText: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
  },
  placeholderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    opacity: 0.5,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  footerSide: {
    flex: 1,
    alignItems: 'center',
  },
  footerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  bigRecordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  recordingButtonActive: {
    backgroundColor: '#ff3366', // Red when recording
    transform: [{ scale: 1.1 }],
  },
  innerRecordIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#05060b', // Dark center
  },
  // Premium transcription panel styles
  recentCardWrapper: {
    width: '100%',
    paddingHorizontal: 20,
  },
  gradientBorder: {
    padding: 3, // Border thickness
    borderRadius: 20,
  },
  recentCard: {
    width: '100%',
    backgroundColor: '#0a0b0f',
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  recentLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  recentTime: {
    color: '#00D4FF',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  transcriptScrollView: {
    maxHeight: 150,
    width: '100%',
    marginBottom: 16,
  },
  transcriptScrollContent: {
    paddingVertical: 8,
  },
  recentTranscript: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  typingCursor: {
    color: '#00D4FF',
    fontSize: 15,
    fontWeight: '300',
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: 'rgba(94, 92, 230, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 92, 230, 0.3)',
  },
  summaryLabel: {
    color: '#5E5CE6',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '600',
  },
  summaryText: {
    color: '#e0e0e0',
    fontSize: 13,
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  recentOpenBtn: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
  },
  recentOpenText: {
    color: '#00D4FF',
    fontWeight: '600',
    fontSize: 14,
  },
  visualizerWrapper: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dotsWrapper: {
    height: 40,
    justifyContent: 'center',
  },
});
