import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useVoiceNotes } from '../hooks/useVoiceNotes';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AudioSession } from '../nativeModules/NativeAudioSession';
import { HapticFeedback } from '../utils/haptics';
import { RootStackParamList } from '../types';
import { formatDuration } from '../utils/format';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;
type Nav = StackNavigationProp<RootStackParamList, 'Detail'>;


export const VoiceNoteDetailScreen: React.FC = () => {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { notes, updateNote, deleteNote, aiAssist } = useVoiceNotes();
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [audioRoute, setAudioRoute] = useState<string>('speaker');
  const [loadingAI, setLoadingAI] = useState(false);

  const note = useMemo(
    () => notes.find(n => n.id === route.params.noteId),
    [notes, route.params.noteId]
  );

  const {
    isLoaded,
    isPlaying,
    positionMs,
    durationMs,
    play,
    pause,
    seek,
  } = useAudioPlayer(note?.audioUri);

  if (!note) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Note not found</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    HapticFeedback.warning(); // Warning for destructive action
    Alert.alert('Delete Note', 'Are you sure you want to delete this voice note?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => HapticFeedback.selection(),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          HapticFeedback.error(); // Error vibration for deletion
          deleteNote(note.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSaveTranscript = () => {
    HapticFeedback.success(); // Success vibration
    updateNote(note.id, { transcript: editedTranscript });
    setIsEditingTranscript(false);
  };

  const handleAIAssist = async () => {
    HapticFeedback.impact(); // Tap feedback
    if (!note.transcript) {
      HapticFeedback.error();
      Alert.alert('No Transcript', 'Please wait for transcription to complete first.');
      return;
    }
    setLoadingAI(true);
    await aiAssist(note.id, note.transcript);
    HapticFeedback.success(); // Success when AI completes
    setLoadingAI(false);
  };

  const toggleRoute = async () => {
    HapticFeedback.selection(); // Light toggle feedback
    const newRoute = audioRoute === 'speaker' ? 'earpiece' : 'speaker';
    try {
      await AudioSession.setRoute(newRoute);
      setAudioRoute(newRoute);
    } catch (err) {
      console.error('Failed to set route:', err);
      HapticFeedback.error();
    }
  };

  const displayDuration = durationMs || note.durationMs;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <LinearGradient
          colors={['rgba(0, 212, 255, 0.15)', 'rgba(94, 92, 230, 0.15)', 'rgba(0, 212, 255, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.headerCard}>
            <Ionicons name="musical-note" size={32} color="#00D4FF" />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Voice Note</Text>
              <Text style={styles.headerDate}>
                {new Date(note.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.headerDuration}>
                Duration: {formatDuration(note.durationMs)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Audio Player Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={20} color="#00D4FF" />
            <Text style={styles.sectionTitle}>Audio Player</Text>
          </View>

          <View style={styles.playerControls}>
            <TouchableOpacity
              style={[styles.playButton, !isLoaded && styles.playButtonDisabled]}
              onPress={isPlaying ? pause : play}
              disabled={!isLoaded}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="white"
              />
            </TouchableOpacity>

            <View style={styles.playerInfo}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={displayDuration}
                value={positionMs}
                onSlidingComplete={seek}
                minimumTrackTintColor="#00D4FF"
                maximumTrackTintColor="#333"
                thumbTintColor="#00D4FF"
                disabled={!isLoaded}
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatDuration(positionMs)}</Text>
                <Text style={styles.timeText}>{formatDuration(displayDuration)}</Text>
              </View>
            </View>
          </View>

          {/* Audio Route Toggle */}
          <TouchableOpacity style={styles.routeButton} onPress={toggleRoute}>
            <Ionicons
              name={audioRoute === 'speaker' ? 'volume-high' : 'ear'}
              size={18}
              color="#00D4FF"
            />
            <Text style={styles.routeText}>
              {audioRoute === 'speaker' ? 'Speaker' : 'Earpiece'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transcript Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#00D4FF" />
            <Text style={styles.sectionTitle}>Transcript</Text>
            {!isEditingTranscript && note.transcript && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setEditedTranscript(note.transcript || '');
                  setIsEditingTranscript(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#00D4FF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {note.transcriptStatus === 'pending' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00D4FF" />
              <Text style={styles.loadingText}>Transcribing</Text>
            </View>
          ) : note.transcriptStatus === 'error' ? (
            <Text style={styles.errorText}>Transcription failed</Text>
          ) : isEditingTranscript ? (
            <>
              <TextInput
                style={styles.transcriptInput}
                value={editedTranscript}
                onChangeText={setEditedTranscript}
                multiline
                placeholder="Enter transcript"
                placeholderTextColor="#555"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditingTranscript(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveTranscript}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.transcriptText}>
              {note.transcript || 'No transcript available'}
            </Text>
          )}
        </View>

        {/* AI Summary Card */}
        {(note.aiSummary || note.transcript) && (
          <LinearGradient
            colors={['rgba(94, 92, 230, 0.1)', 'rgba(94, 92, 230, 0.05)']}
            style={styles.aiCard}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color="#5E5CE6" />
              <Text style={[styles.sectionTitle, { color: '#5E5CE6' }]}>AI Summary</Text>
              {!note.aiSummary && (
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleAIAssist}
                  disabled={loadingAI}
                >
                  {loadingAI ? (
                    <ActivityIndicator size="small" color="#5E5CE6" />
                  ) : (
                    <>
                      <Ionicons name="bulb" size={16} color="#5E5CE6" />
                      <Text style={styles.generateButtonText}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {note.aiSummary ? (
              <>
                <Text style={styles.aiSummaryText}>{note.aiSummary}</Text>
                {note.aiKeyPoints && note.aiKeyPoints.length > 0 && (
                  <View style={styles.keyPointsContainer}>
                    <Text style={styles.keyPointsLabel}>Key Points:</Text>
                    {note.aiKeyPoints.map((point, index) => (
                      <View key={index} style={styles.keyPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.keyPointText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.aiPlaceholder}>
                Tap "Generate" to create an AI summary
              </Text>
            )}
          </LinearGradient>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="#ff3366" />
          <Text style={styles.deleteButtonText}>Delete Note</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060b',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 16,
    marginBottom: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0b0f',
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  headerDuration: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#0f1015',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1b25',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#333',
  },
  playerInfo: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  routeText: {
    fontSize: 13,
    color: '#00D4FF',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  transcriptText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 24,
  },
  transcriptInput: {
    backgroundColor: '#0a0b0f',
    borderRadius: 12,
    padding: 12,
    color: 'white',
    fontSize: 15,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#1a1b25',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 13,
    color: '#00D4FF',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1b25',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#05060b',
  },
  aiCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 92, 230, 0.3)',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(94, 92, 230, 0.2)',
    borderRadius: 10,
  },
  generateButtonText: {
    fontSize: 13,
    color: '#5E5CE6',
    fontWeight: '600',
  },
  aiSummaryText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
    marginBottom: 12,
  },
  aiPlaceholder: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  keyPointsContainer: {
    marginTop: 8,
  },
  keyPointsLabel: {
    fontSize: 13,
    color: '#5E5CE6',
    fontWeight: '600',
    marginBottom: 8,
  },
  keyPoint: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    color: '#5E5CE6',
    fontSize: 16,
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    color: '#b8b7ff',
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
    marginBottom: 32,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff3366',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3366',
    textAlign: 'center',
    marginTop: 20,
  },
});
