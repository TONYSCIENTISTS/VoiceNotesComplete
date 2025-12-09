import { Platform } from 'react-native';
import { AISummaryResult } from './types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'https://backend-jdue.onrender.com';

export async function uploadAudioForTranscription(
  fileUri: string
): Promise<{ transcript: string }> {
  console.log('[uploadAudioForTranscription] Starting upload for:', fileUri);

  const formData = new FormData();

  // Ensure URI has file:// prefix on Android
  let uri = fileUri;
  if (Platform.OS === 'android' && !uri.startsWith('file://')) {
    uri = `file://${uri}`;
  }

  const filename = uri.split('/').pop() ?? 'recording.m4a';

  console.log('[uploadAudioForTranscription] Processed URI:', uri);

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('audio', blob, filename);
  } else {
    formData.append('audio', {
      // @ts-ignore - React Native FormData type
      uri: uri,
      name: filename,
      type: 'audio/m4a',
    });
  }

  const res = await fetch(`${BACKEND_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Transcription failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function getAISummary(transcript: string): Promise<AISummaryResult> {
  const res = await fetch(`${BACKEND_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI summary failed: ${res.status} ${text}`);
  }

  return res.json();
}
