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
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../utils/haptics';
import { loadSettingsAsync, saveSettings } from '../storage';

type RootStackParamList = {
  List: undefined;
  History: undefined;
  Detail: { noteId: string };
};

type Nav = StackNavigationProp<RootStackParamList, 'List'>;

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const BAR_COUNT = 32;
const SCREEN_WIDTH = Dimensions.get('window').width;

import VoiceWaveform from '../components/VoiceWaveform';

const AudioVisualizer = ({ level }: { level: number }) => {
  return (
    <View style={styles.visualizerContainer}>
      <VoiceWaveform currentLevel={level} height={120} width={SCREEN_WIDTH - 40} />
    </View>
  );
};

const TimerText = ({ text }: { text: string }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.0, duration: 100, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(scale, { toValue: 1.0, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.bounce) }),
    ]).start();
  }, [text]);

  return (
    <Animated.Text style={[styles.timerLarge, { transform: [{ scale }] }]}>
      {text}
    </Animated.Text>
  );
};

const BouncingDots = () => {
  const animations = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = animations.map((anim, i) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(anim, {
            toValue: -10,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(anims).start();
  }, [animations]);

  return (
    <View style={styles.dotsContainer}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { transform: [{ translateY: anim }] }
          ]}
        />
      ))}
    </View>
  );
};

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
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            HapticFeedback.error(); // Error/destructive vibration
            // Delete all notes
            notes.forEach(note => deleteNote(note.id));
            setShowSettings(false);
            Alert.alert('Success', 'All voice notes have been deleted.');
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
                  'Transcribing...'
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
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconWrapper}>
            <Ionicons name="radio-outline" size={24} color="#00D4FF" />
            <Ionicons name="sparkles" size={12} color="#5E5CE6" style={styles.sparkleIcon} />
          </View>
          <View>
            <Text style={styles.logoText}>Voice<Text style={styles.logoTextAI}>AI</Text></Text>
            <Text style={styles.logoSubtext}>Smart Transcription</Text>
          </View>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.historyButton} onPress={onPressHistory}>
            <Ionicons name="time-outline" size={18} color="#00D4FF" />
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton} onPress={() => { HapticFeedback.impact(); setShowSettings(true); }}>
            <Ionicons name="settings-outline" size={20} color="#00D4FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.15)', 'rgba(94, 92, 230, 0.15)']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Ionicons name="settings" size={24} color="#00D4FF" />
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={() => { HapticFeedback.selection(); setShowSettings(false); }}>
                  <Ionicons name="close" size={24} color="#888" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Haptic Feedback Option */}
                <View style={styles.settingOption}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="finger-print-outline" size={22} color="#00D4FF" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Haptic Feedback</Text>
                    <Text style={styles.settingDescription}>Vibrate on interactions</Text>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={toggleHaptics}
                    trackColor={{ false: '#333', true: '#5E5CE6' }}
                    thumbColor={hapticsEnabled ? '#00FFFF' : '#666'}
                    ios_backgroundColor="#333"
                  />
                </View>
                {/* Clear History Option */}
                <TouchableOpacity style={styles.settingOption} onPress={clearAllHistory}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="trash-outline" size={22} color="#ff3366" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Clear All History</Text>
                    <Text style={styles.settingDescription}>Delete all voice notes permanently</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                {/* Placeholder for future options */}
                <TouchableOpacity style={[styles.settingOption, styles.settingOptionDisabled]}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="cloud-upload-outline" size={22} color="#666" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingTitle, styles.settingTitleDisabled]}>Export Data</Text>
                    <Text style={styles.settingDescription}>Coming soon</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingOption, styles.settingOptionDisabled]}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="color-palette-outline" size={22} color="#666" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingTitle, styles.settingTitleDisabled]}>Theme</Text>
                    <Text style={styles.settingDescription}>Coming soon</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalFooter}>v1.0.0 • VoiceAI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.mainContent}>
        {isRecording ? (

          <>
            <Text style={styles.recordingText}>Recording...</Text>
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
        <OrbRecordButton
          isRecording={isRecording}
          onPress={onPressRecord}
          size={75}
          currentLevel={currentLevel}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  logoTextAI: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5E5CE6',
  },
  logoSubtext: {
    fontSize: 10,
    color: '#888',
    marginTop: -2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  historyButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
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
  timerLarge: {
    color: 'white',
    fontSize: 48,
    fontWeight: '300',
    marginBottom: 40,
    fontVariant: ['tabular-nums'],
  },
  visualizerWrapper: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  visualizerContainer: {
    flex: 1, // fill the visualizerWrapper
    width: '100%',
    position: 'relative', // for absolute children
    justifyContent: 'center', // center vertically
    alignItems: 'center',
  },
  layerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  dotsWrapper: {
    height: 40,
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#42f59e', // Green/Teal accent
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
  },
  modalGradient: {
    borderRadius: 20,
    padding: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#0a0b0f',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginLeft: 12,
  },
  modalBody: {
    backgroundColor: '#0a0b0f',
    padding: 16,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#151621',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1b25',
  },
  settingOptionDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: '#666',
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
  },
  modalFooter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#0a0b0f',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
});
