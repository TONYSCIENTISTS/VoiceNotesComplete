# VoiceNotes AI

AI-powered mobile voice notes app built for the AiMA React Native take-home exercise.  
Includes voice recording, automatic transcription, AI summaries, and custom native modules for iOS and Android.

**Tech Stack:** React Native (Expo), TypeScript, Swift/Kotlin native modules  
**Links:** 3D Demo: https://appviewerv1.web.app | Backend: https://backend-jdue.onrender.com

---

## Overview

This project implements the full assignment requirements and extends them with several enhancements that improve UX, reliability, and real-world usability.

### Included in the exercise requirements:
- Voice recording with live waveform feedback  
- Automatic transcription via OpenAI Whisper  
- AI-powered summaries (OpenAI GPT-3.5)  
- Search and filtering across notes  
- Custom native modules:
  - Audio routing (speaker/earpiece)
  - Live microphone level streaming  
- Support for both iOS & Android

### Additional improvements:
- Offline queue with retry logic  
- MMKV for fast, durable local storage  
- Dark themed UI with animations  
- Swipe-to-delete + pull-to-refresh  
- Backend deployed on Render  
- Separate 3D viewer demo (WebGL)

---

## iOS & Android Native Modules

Two custom modules written from scratch:

### NativeAudioSession  
Controls audio routing (speaker ↔ earpiece).

- iOS: Swift (AVAudioSession)  
- Android: Kotlin (AudioManager)

```ts
await NativeAudioSession.setRoute("speaker");
const current = await NativeAudioSession.getRoute();
```

### NativeLevelMeter  
Streams real-time microphone levels to drive waveform animations.

- iOS: Swift using AVAudioRecorder metering  
- Android: Kotlin using AudioRecord with RMS analysis  

```ts
NativeLevelMeter.start();
NativeLevelMeter.addListener(level => {
  // 0–1 float → live waveform
});
```

---

## AI Integration

### Transcription — OpenAI Whisper
- Accurate and robust for diverse accents  
- 2–5s typical latency  
- Cost-effective ($0.006/min)  

Fallback: Groq Whisper for reliability during outages.

### Summarization — GPT-3.5 Turbo
Generates:
- 2–3 sentence summary  
- Key points  
- Short title  

Fallback: Groq Llama when OpenAI is unavailable.

---

## Storage

Uses MMKV for high performance (100x faster than AsyncStorage).  
Automatically falls back to AsyncStorage when running inside Expo Go.

```ts
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

---

## Setup Instructions

### Backend
```bash
cd Backend
npm install
echo "ASR_API_KEY=sk-proj-..." > .env
echo "LLM_API_KEY=sk-proj-..." >> .env
npm start
```

Runs at http://localhost:4000

### Frontend
```bash
cd VoiceNotesComplete
npm install
echo "EXPO_PUBLIC_BACKEND_URL=http://192.168.1.x:4000" > .env
npm start
```

Use local IP (not localhost) when testing on device.

---

## iOS Setup Notes

iOS native modules are implemented in Swift and located in `ios_sources/`.  
On macOS, they integrate after:

```bash
npx expo prebuild --platform ios
cp ios_sources/*.swift ios/VoiceNotesComplete/
npx expo run:ios
```

Android builds work natively without additional configuration.

---

## Project Structure

```
VoiceNotesComplete/
├── src/
│   ├── api.ts
│   ├── storage.ts
│   ├── types.ts
│   ├── hooks/
│   ├── components/
│   ├── screens/
│   └── nativeModules/
├── android/
├── ios_sources/
└── Backend/
```

---

## Testing

```bash
npm test
```

Covers:
- Note creation/deletion  
- Retry queue logic  
- Storage handling  
- Utility functions  

---

## Design Principles

- Performance-first (MMKV, debounced search, memoized UI)  
- Modern UI with gradients, animations, and dark theme  
- Resilient offline behavior  
- Clear separation of logic and components  

---

## Future Enhancements

- Authentication and user accounts  
- Cloud sync (Firebase/Supabase)  
- Sharing/exporting notes  
- Folder/tag organization  
- Analytics & monitoring  
- Comprehensive E2E testing  

---

## License

MIT  
Status: Complete for assessment
