export type TranscriptStatus = 'pending' | 'done' | 'error';

export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  titleSuggestion?: string;
}

export interface VoiceNote {
  id: string;
  audioUri: string;
  durationMs: number;
  createdAt: string; // ISO string
  transcript?: string;
  transcriptStatus: TranscriptStatus;
  aiSummary?: string;
  aiKeyPoints?: string[];
  aiTitleSuggestion?: string;
  // Queue & Retry fields
  retryCount?: number;
  lastRetryAt?: string; // ISO string
  needsTranscription?: boolean; // True if offline when created
}

export type RootStackParamList = {
  List: undefined;
  History: undefined;
  Detail: { noteId: string };
  Lipsync: undefined;
};

export type AppSettings = {
  hapticsEnabled: boolean;
};

export const defaultSettings: AppSettings = {
  hapticsEnabled: true,
};
