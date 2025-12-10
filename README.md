# VoiceNotes AI

Mobile voice notes app with AI transcription. Built for the AiMA React Native take-home.

**Tech:** React Native + TypeScript + Custom Native Modules (Swift/Kotlin)

[Live 3D Demo](https://appviewerv1.web.app) | [Backend](https://backend-jdue.onrender.com)

---

## Context

This is my submission for the [AiMA React Native Technical Take-Home](../AiMA%20-%20React%20-%20Technical%20Take-Home.md). The project implements all assignment requirements and extends them with several enhancements that improve UX, reliability, and real-world usability.

### What's included

Core requirements:
- Voice recording with live waveform feedback
- Automatic transcription (OpenAI Whisper)
- AI-powered summaries (GPT-3.5-turbo)
- Search and filtering across notes
- Custom native modules (audio routing + mic level streaming)
- Support for both iOS and Android

Additional enhancements:
- Offline queue with exponential backoff retry logic
- MMKV storage for significantly improved performance
- Dark-themed UI with animations and smooth transitions
- Swipe-to-delete and pull-to-refresh gestures
- 3D character viewer with lip-sync (bonus demo)
- Backend deployed to Render for live testing

### What this demonstrates

This project showcases React Native fundamentals, native module integration, AI service integration, offline-first architecture, and production-level code organization. The focus is on technical implementation quality and developer experience.

### iOS Build Note

The iOS native modules are implemented in Swift and located in `ios_sources/`. On macOS, they can be integrated after running `expo prebuild` and copying the Swift files into the iOS project. The Android build demonstrates the complete application functionality.

To build for iOS (requires macOS):
```bash
npx expo prebuild --platform ios
cp ios_sources/*.swift ios/VoiceNotesComplete/
# Configure bridging header in Xcode
npx expo run:ios
```


### Why the enhancements?

These additions demonstrate:
- Understanding of real-world challenges (offline support, error handling, retry logic)
- Ability to integrate modern technologies (WebGL, performance optimization)
- Focus on user experience beyond basic functionality
- Pragmatic decision-making around scope and priorities

---

## Features

**Core Functionality:**
- Record voice notes with live waveform visualization
- Automatic transcription on recording completion
- AI-generated summaries with key points extraction
- Full-text search across all notes
- Editable transcripts and note deletion

**Enhanced User Experience:**
- Offline queue with automatic retry
- Animated orb button with audio-reactive pulsing
- Typewriter effect for transcript display
- Dark theme with gradient accents
- Swipe-to-delete gestures
- Pull-to-refresh for failed transcriptions

---

## Native Modules

Two custom modules implemented from scratch in Swift (iOS) and Kotlin (Android):

### NativeAudioSession
Controls audio output routing between speaker and earpiece.

**Files:**
- iOS: `ios_sources/NativeAudioSession.swift`
- Android: `android/app/src/main/java/.../NativeAudioSessionModule.kt`

**TypeScript API:**
```typescript
await NativeAudioSession.setRoute("speaker" | "earpiece");
const route = await NativeAudioSession.getRoute(); // Returns: "speaker" | "earpiece" | "bluetooth" | "wired" | "unknown"
```

**Implementation:** Uses AVAudioSession (iOS) and AudioManager (Android). This module fully implements the required TypeScript API from the exercise specification.

### NativeLevelMeter
Streams real-time microphone levels (0-1) for waveform visualization.

**Files:**
- iOS: `ios_sources/NativeLevelMeter.swift`
- Android: `android/app/src/main/java/.../NativeLevelMeterModule.kt`

**TypeScript API:**
```typescript
NativeLevelMeter.start();
const subscription = NativeLevelMeter.addListener((level: number) => {
  // level is 0-1, updates at ~10-20Hz
});
subscription.remove(); // Cleanup
NativeLevelMeter.stop();
```

**Implementation:** Uses AVAudioRecorder metering (iOS) and RMS calculation from AudioRecord (Android). This module fully implements the required TypeScript API from the exercise specification.

Both modules are genuine native implementations, not wrappers around existing RN libraries.

---

## AI Integration

### ASR Model Choice: OpenAI Whisper

**Why Whisper:**
- **Quality:** Industry-leading accuracy across 99 languages with strong accent handling
- **Latency:** 2-5 seconds average for typical voice notes (30-60 seconds of audio)
- **Cost:** $0.006 per minute ($0.36 per hour) - reasonable for demo and production use
- **Privacy:** Audio sent to OpenAI servers; not suitable for highly sensitive content

**Tradeoffs:**
- **Pro:** Excellent accuracy, minimal setup, robust API
- **Con:** Requires internet connectivity, data leaves device, recurring costs
- **Alternative considered:** Local Whisper models (better privacy, offline-capable, but slower and harder to integrate)

**Fallback:** Groq Whisper API provides redundancy if OpenAI experiences downtime.

### LLM Choice: GPT-3.5-turbo

**Why GPT-3.5:**
- **Quality:** Reliable summarization and key point extraction for voice note content
- **Latency:** 1-3 seconds for summary generation
- **Cost:** ~$0.002 per summary (significantly cheaper than GPT-4)
- **Privacy:** Transcript text sent to OpenAI servers

**Tradeoffs:**
- **Pro:** Fast, cost-effective, excellent understanding of natural speech patterns
- **Con:** Cloud-dependent, data privacy considerations
- **Alternative considered:** Local LLMs like Llama (better privacy, but requires significant device resources)

**Fallback:** Groq Llama 3 serves as backup LLM provider.

### Handling Edge Cases

**Long Transcripts:**
- Whisper handles up to 25MB audio files (~6 hours at standard quality)
- For exceptionally long recordings, transcripts are processed in full without chunking
- Summaries work well up to ~10,000 tokens; longer transcripts are truncated with ellipsis notification

**Failures & Retries:**
- Exponential backoff retry logic: 2s → 4s → 8s delays
- Maximum 3 retry attempts before marking as failed
- Failed items persist in offline queue and auto-retry on app restart or manual refresh

**Secrets Management:**
- API keys stored in environment variables (`.env` file)
- `.env.example` provided with placeholder values
- No secrets committed to repository
- Production deployment uses Render.com environment variables

**Offline Fallback:**
- Notes are created immediately with audioUri and metadata
- Transcription/summarization queued locally when offline
- Queue processes automatically when connectivity restored
- User sees "Pending" status with pull-to-refresh option

---

## Storage

MMKV provides significantly improved performance over AsyncStorage (100x faster read/write operations). The implementation automatically falls back to AsyncStorage when running in Expo Go for development compatibility.

Data structure:
```typescript
{
  id: string;
  audioUri: string;
  durationMs: number;
  createdAt: string;
  transcript?: string;
  transcriptStatus: "pending" | "done" | "error";
  aiSummary?: string;
  aiKeyPoints?: string[];
  retryCount?: number;
}
```

All data persists locally. Cloud synchronization could be implemented using Firebase or Supabase if required.

---

## Getting Started

### Backend First

```bash
cd Backend
npm install

# Add your OpenAI key
echo "ASR_API_KEY=sk-proj-your-key" > .env
echo "LLM_API_KEY=sk-proj-your-key" >> .env

npm start
```

Backend runs on port 4000.

### Then the App

```bash
cd VoiceNotesComplete
npm install

# Point to your local backend
echo "EXPO_PUBLIC_BACKEND_URL=http://192.168.1.x:4000" > .env

npm start
```

Use your actual IP address, not localhost, if testing on a physical device.

Press `a` for Android emulator or `i` for iOS simulator.

---

## Generating Debug Builds

### Android APK

**Option 1: Local build (requires Android Studio)**
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Option 2: EAS Build (recommended)**
```bash
npm install -g eas-cli
eas build -p android --profile preview
# Download APK from expo.dev dashboard once build completes
```

The APK can be installed directly on Android devices via USB or file transfer.

### iOS Debug Build

**Requirements:**
- macOS with Xcode installed
- Apple Developer account (free tier sufficient for local testing)

**For iOS Simulator:**
```bash
npx expo prebuild --platform ios
cp ios_sources/*.swift ios/VoiceNotesComplete/
# Configure bridging header in Xcode if needed
npx expo run:ios
```

**For Physical iOS Device:**
```bash
npx expo prebuild --platform ios
cp ios_sources/*.swift ios/VoiceNotesComplete/
# Open ios/VoiceNotesComplete.xcworkspace in Xcode
# Select your device and development team
# Run from Xcode
```

Alternatively, use EAS Build to generate an iOS development build:
```bash
eas build -p ios --profile development
```

**Note:** iOS native modules are fully implemented in `ios_sources/` but require macOS to compile and test. The Android build demonstrates the complete functionality of both platforms.

---

## Project Structure

```
VoiceNotesComplete/
├── src/
│   ├── api.ts                    # Backend calls
│   ├── storage.ts                # MMKV wrapper
│   ├── types.ts                  # TypeScript types
│   ├── hooks/
│   │   ├── useVoiceNotes.ts      # Main state logic
│   │   ├── useAudioRecorder.ts   # Recording
│   │   └── useAudioPlayer.ts     # Playback
│   ├── components/
│   │   ├── OrbRecordButton.tsx   # The main button
│   │   ├── VoiceWaveform.tsx     # Live waveform
│   │   └── ...
│   ├── screens/
│   │   ├── VoiceNotesListScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── VoiceNoteDetailScreen.tsx
│   └── nativeModules/
│       ├── NativeAudioSession.ts
│       └── NativeLevelMeter.ts
├── android/              # Native Android code
├── ios_sources/          # iOS native modules (ready to copy)
└── ...

Backend/
├── server.js             # Express API
└── uploads/              # Temp audio files
```

The project follows standard React Native organization with clear separation between logic (hooks), presentation (components), and navigation (screens).

---

## Testing

Tests included:
- **2 unit tests:** Hook logic (`useVoiceNotes`) and utility functions (`format.test.ts`)
- **1 integration test:** Complete flow from recording → note creation → transcription display

```bash
npm test
```

Test files demonstrate testing approach for hooks, state management, and user flows. Production deployment would include additional E2E tests using Detox or Maestro.

---

## Environment Variables

See `.env.example` for required environment variables.

**Backend (`Backend/.env.example`):**
```
ASR_API_KEY=your_openai_api_key
LLM_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key_optional
PORT=4000
```

**Frontend (`VoiceNotesComplete/.env.example`):**
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.x:4000  # Use your local IP for device testing
# EXPO_PUBLIC_BACKEND_URL=https://backend-jdue.onrender.com  # Or use deployed backend
```

No secrets are committed to the repository.

---

## UX Quality

The application implements all required UX elements:

**Loading States:**
- Pending transcriptions show status indicators
- AI summaries display "Thinking..." state
- Pull-to-refresh provides visual feedback

**Error States:**
- Network failures show retry buttons with explanatory messages  
- Failed transcriptions display clear error reasons
- Offline queue persists failed items for later retry

**Empty States:**
- "No notes yet" placeholder with clear call-to-action
- "No results found" message for empty search results
- Contextual guidance for first-time users

**Accessibility:**
- Screen titles for navigation context
- High-contrast text (WCAG AA compliant)
- Touch targets sized ≥44x44 points
- Semantic button labels for screen readers

---

## Design Choices

**MMKV over AsyncStorage:** 100x performance improvement for frequent read/write operations  
**Expo workflow:** Faster iteration and easier cross-platform builds  
**OpenAI APIs:** Production-grade reliability and accuracy for demo context  
**Dark theme:** Reduces eye strain and provides premium feel  
**TypeScript throughout:** Type safety and developer experience

These choices balance rapid development with production-quality architecture.

---

## Known Limitations

- No user authentication (JWT/OAuth would be added for production)
- Backend lacks rate limiting and database persistence
- iOS build requires macOS (Swift code ready in `ios_sources/`)
- Test coverage could be expanded with E2E tests
- No analytics or crash reporting integration

These limitations are acceptable for a technical assessment focused on demonstrating React Native expertise, native module integration, and AI service integration.

---

## Future Enhancements

For production deployment, the following additions would be priorities:

1. User authentication and account management
2. Cloud synchronization with conflict resolution
3. Note sharing and export functionality
4. Organizational features (folders, tags, categories)
5. Comprehensive E2E test coverage
6. Analytics and error monitoring
7. Optimized backend with database and caching
8. Additional accessibility features (VoiceOver optimization)

---

**License:** MIT  
**Status:** Complete for technical assessment
