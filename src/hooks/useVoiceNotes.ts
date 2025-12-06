// src/hooks/useVoiceNotes.ts

import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import { loadNotes, loadNotesAsync, saveNotes } from '../storage';
import { VoiceNote, TranscriptStatus, AISummaryResult } from '../types';
import { uploadAudioForTranscription, getAISummary } from '../api';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // Exponential backoff: 2s, 5s, 10s

export function useVoiceNotes() {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  const processingQueue = useRef(false);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const hasProcessedQueue = useRef(false);

  // Load notes and auto-process pending transcriptions
  useEffect(() => {
    (async () => {
      // Use async load for compatibility with both MMKV and AsyncStorage
      const stored = await loadNotesAsync();
      setNotes(stored);
      setIsLoading(false);

      // Count pending transcriptions
      const pending = stored.filter(n => n.needsTranscription || n.transcriptStatus === 'error').length;
      setQueuedCount(pending);

      // Auto-process queue on app load (once)
      if (pending > 0 && !hasProcessedQueue.current) {
        hasProcessedQueue.current = true;
        console.log(`Found ${pending} pending transcriptions, processing...`);
        // Small delay to let UI render first
        setTimeout(() => {
          processTranscriptionQueue();
        }, 1000);
      }
    })();
  }, []);

  // Save notes
  useEffect(() => {
    if (!isLoading) {
      saveNotes(notes);
      const pending = notes.filter(n => n.needsTranscription || n.transcriptStatus === 'error').length;
      setQueuedCount(pending);
    }
  }, [notes, isLoading]);

  const addNote = useCallback((note: VoiceNote) => {
    setNotes(prev => [note, ...prev]);
  }, []);

  const updateNote = useCallback((id: string, partial: Partial<VoiceNote>) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...partial } : n)));
  }, []);

  const deleteNote = useCallback((id: string) => {
    // Clear any pending retry timeout
    const timeout = retryTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(id);
    }
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const createNote = useCallback(
    (audioUri: string, durationMs: number): VoiceNote => {
      const note: VoiceNote = {
        id: uuidv4(),
        audioUri,
        durationMs,
        createdAt: new Date().toISOString(),
        transcriptStatus: 'pending',
        needsTranscription: false, // Will transcribe immediately
        retryCount: 0,
      };
      addNote(note);
      return note;
    },
    [addNote]
  );

  // Single transcription attempt with retry logic
  const transcribeNote = useCallback(async (id: string, audioUri: string, isRetry = false) => {
    console.log(`[transcribeNote] Starting transcription for note ${id}, isRetry: ${isRetry}`);

    // For retry attempts, check if note exists and get retry count
    let retryCount = 0;
    if (isRetry) {
      const note = notes.find(n => n.id === id);
      if (!note) {
        console.error(`[transcribeNote] Note not found for retry: ${id}`);
        return;
      }

      retryCount = note.retryCount || 0;

      // Check if we've exceeded retry limit
      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        console.log(`[transcribeNote] Max retries reached for ${id}`);
        updateNote(id, {
          transcriptStatus: 'error',
          needsTranscription: false
        });
        Alert.alert('Transcription Failed', 'Maximum retry attempts reached. Pull to refresh to try again.');
        return;
      }
    }

    try {
      console.log(`[transcribeNote] Updating status to pending for ${id}`);
      updateNote(id, { transcriptStatus: 'pending' as TranscriptStatus });

      console.log(`[transcribeNote] Calling uploadAudioForTranscription with URI: ${audioUri}`);
      const { transcript } = await uploadAudioForTranscription(audioUri);

      console.log(`[transcribeNote] Transcription successful for ${id}, length: ${transcript?.length || 0}`);

      updateNote(id, {
        transcript,
        transcriptStatus: 'done',
        needsTranscription: false,
        retryCount: 0,
      });
    } catch (err: any) {
      console.error('[transcribeNote] Transcription error:', err);
      console.error('[transcribeNote] Error message:', err.message);
      console.error('[transcribeNote] Error stack:', err.stack);

      const newRetryCount = retryCount + 1;

      updateNote(id, {
        transcriptStatus: 'error',
        retryCount: newRetryCount,
        lastRetryAt: new Date().toISOString(),
        needsTranscription: true,
      });

      // Exponential backoff retry
      if (newRetryCount < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS[newRetryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

        console.log(`[transcribeNote] Will retry transcription for ${id} in ${delay}ms (attempt ${newRetryCount + 1})`);

        const timeout = setTimeout(() => {
          console.log(`[transcribeNote] Retrying transcription for ${id}, attempt ${newRetryCount + 1}`);
          transcribeNote(id, audioUri, true);
        }, delay);

        retryTimeouts.current.set(id, timeout);
      } else if (!isRetry) {
        Alert.alert('Transcription error', `${err.message || 'Unknown error'}. Will retry automatically.`);
      }
    }
  }, [notes, updateNote]);

  // Process all queued transcriptions
  const processTranscriptionQueue = useCallback(async () => {
    if (processingQueue.current) {
      console.log('Queue already processing...');
      return;
    }

    processingQueue.current = true;
    const pending = notes.filter(n => n.needsTranscription && n.transcriptStatus !== 'pending');

    console.log(`Processing ${pending.length} queued transcriptions...`);

    for (const note of pending) {
      await transcribeNote(note.id, note.audioUri, true);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    processingQueue.current = false;
    console.log('Queue processing complete');
  }, [notes, transcribeNote]);

  // Manual retry for a specific note
  const retryTranscription = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // Clear any existing timeout
    const timeout = retryTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(id);
    }

    // Reset retry count for manual retry
    updateNote(id, { retryCount: 0 });
    await transcribeNote(id, note.audioUri, false);
  }, [notes, updateNote, transcribeNote]);

  const aiAssist = useCallback(
    async (id: string, transcript?: string) => {
      if (!transcript) {
        Alert.alert('No transcript', 'Record and transcribe first.');
        return;
      }

      try {
        const result: AISummaryResult = await getAISummary(transcript);
        updateNote(id, {
          aiSummary: result.summary,
          aiKeyPoints: result.keyPoints,
          aiTitleSuggestion: result.titleSuggestion,
        });
      } catch (err: any) {
        console.error('AI Assist error', err);
        Alert.alert('AI Assist error', err?.message ?? 'Unknown error');
      }
    },
    [updateNote]
  );

  return {
    notes,
    isLoading,
    queuedCount,
    createNote,
    transcribeNote,
    retryTranscription,
    processTranscriptionQueue,
    aiAssist,
    updateNote,
    deleteNote,
  };
}
