# VoiceNotes AI

> A premium cross-platform mobile voice notes app with AI-powered transcription and summarization.

Built with React Native, TypeScript, and custom native modules for iOS and Android.

---

## 📱 Features

### Core Functionality
- **🎙️ Voice Recording** - High-quality audio recording with live waveform visualization
- **📝 Auto-Transcription** - Automatic speech-to-text conversion using OpenAI Whisper
- **✨ AI Summaries** - Intelligent summarization and key point extraction
- **📊 History** - Beautiful timeline view with search and filters
- **⚡ Offline Support** - Queue system with automatic retry on reconnection
- **🎯 Settings** - Clear history and future customization options

### Premium UX
- **Animated Orb Button** - Pulsing gradient with live audio level feedback
- **Typewriter Effect** - Smooth character-by-character transcript display
- **Swipe to Delete** - Intuitive gesture-based deletion
- **Pull to Refresh** - Manually refresh transcription queue
- **Status Indicators** - Real-time status chips (Pending/Done/Error)
- **Dark Mode** - Stunning dark theme with cyan/purple accents

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React Native (Expo SDK 52)
- TypeScript
- React Navigation
- Expo AV (Audio/Video)
- MMKV (Fast storage)
- Linear Gradient
- Gesture Handler

**Backend:**
- Node.js + Express
- OpenAI Whisper (ASR)
- OpenAI GPT-3.5-turbo (LLM)
- Groq (Fallback provider)

**Native Modules:**
- `NativeAudioSession` (Audio routing control)
- `NativeLevelMeter` (Live mic level streaming)

---

## 🎯 Custom Native Modules

### 1. NativeAudioSession
**Purpose:** Control audio output routing (Speaker/Earpiece)

**Implementation:**
- **iOS:** `AVAudioSession` category management
- **Android:** `AudioManager` routing

**API:**
```typescript
export interface NativeAudioSession {
  getRoute(): Promise<AudioRoute>;
  setRoute(route: "speaker" | "earpiece"): Promise<void>;
}
```

**Usage:** Toggle between speaker and earpiece in the detail screen.

---

### 2. NativeLevelMeter
**Purpose:** Stream real-time microphone audio levels

**Implementation:**
- **iOS:** `AVAudioRecorder` metering API
- **Android:** RMS calculation from `AudioRecord`

**API:**
```typescript
export interface NativeLevelMeter {
  start(): void;
  stop(): void;
  addListener(cb: (level: number) => void): { remove: () => void };
}
```

**Usage:** Drives the animated waveform visualization during recording.

---

## 🤖 AI Integration

### ASR (Speech-to-Text)

**Primary:** OpenAI Whisper API
- **Model:** `whisper-1`
- **Quality:** Best-in-class accuracy
- **Latency:** ~2-5 seconds for typical notes
- **Cost:** $0.006/minute

**Fallback:** Groq Whisper
- Activates if OpenAI fails
- Free tier available
- Faster but may have quality tradeoffs

**Why Whisper?**
- Industry-leading accuracy
- Excellent multilingual support
- Handles accents and noise well
- Simple API, reliable service

---

### LLM (Summarization)

**Primary:** OpenAI GPT-3.5-turbo
- **Concise summaries** (2-3 sentences)
- **Key points** extraction (3-4 bullets)
- **Title suggestions**

**Fallback:** Groq Llama
- Free tier for development
- Fast inference times

**Prompt Engineering:**
```
"You are a helpful AI assistant that creates clear, concise summaries.
Be brief, use simple language, and focus on key information.

1. SHORT summary (2-3 sentences max)
2. 3-4 key points (one sentence each)
3. Brief title (3-5 words max)"
```

**Tradeoffs:**
- **Latency:** 1-3s (acceptable for async operation)
- **Cost:** ~$0.002 per summary (very affordable)
- **Privacy:** Data sent to OpenAI (documented in terms)
- **Quality:** Excellent understanding and brevity

---

## 📦 Local Persistence

**Storage:** MMKV (with AsyncStorage fallback)

**Why MMKV?**
- **100x faster** than AsyncStorage
- Synchronous API (simpler code)
- Used by Instagram, Discord
- Automatic fallback in Expo Go

**Data Persisted:**
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
  needsTranscription?: boolean;
}
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Create .env file
echo "ASR_API_KEY=your_openai_api_key" > .env
echo "LLM_API_KEY=your_openai_api_key" >> .env

# Start server
npm start
```

Server runs on `http://localhost:4000`

---

### Frontend Setup

```bash
cd VoiceNotesComplete

# Install dependencies
npm install

# Update backend URL (if needed)
# Edit .env and set EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:4000

# Start Expo
npm start
```

**Run on Device:**
- **iOS:** Press `i` for iOS Simulator
- **Android:** Press `a` for Android Emulator
- **Physical Device:** Scan QR code with Expo Go

---

## 🔧 Environment Variables

### Backend (.env)
```bash
ASR_API_KEY=sk-...          # OpenAI API key for Whisper
LLM_API_KEY=sk-...          # OpenAI API key for GPT
PORT=4000                   # Server port (optional)
```

### Frontend (.env)
```bash
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.x:4000
```

⚠️ **Note:** Use your local IP address, not `localhost`, for physical devices.

---

## 📱 Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build APK
eas build -p android --profile preview
```

### iOS Build

```bash
# Build for iOS
eas build -p ios --profile preview
```

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

**Coverage:**
- `useVoiceNotes` hook logic
- `useAudioRecorder` hook
- Utility functions (format, storage)

### Integration Tests
- Record → Note appears → Transcription shown
- AI Assist → Summary generated → Key points displayed

---

## 🎨 Design Decisions

### Premium UI/UX
- **Dark theme** with cyan (#00D4FF) and purple (#5E5CE6) accents
- **Gradient borders** for depth and premium feel
- **Glassmorphism** for modern card designs
- **Smooth animations** for delightful interactions

### Performance
- **MMKV storage** for instant saves
- **Debounced search** (500ms) for smooth filtering
- **Optimized re-renders** with React.memo and useCallback
- **Lazy loading** for large lists

### Error Handling
- **Exponential backoff** for failed transcriptions
- **Retry queue** for offline scenarios
- **Fallback providers** (Groq) for reliability
- **User-friendly errors** with actionable messages

---

## 📂 Project Structure

```
VoiceNotesComplete/
├── src/
│   ├── api.ts              # API calls (transcription, AI)
│   ├── storage.ts          # MMKV persistence layer
│   ├── types.ts            # TypeScript interfaces
│   ├── utils/              # Helper functions
│   ├── hooks/
│   │   ├── useVoiceNotes.ts    # Notes management + queue
│   │   ├── useAudioRecorder.ts # Recording logic
│   │   └── useAudioPlayer.ts   # Playback logic
│   ├── components/
│   │   ├── OrbRecordButton.tsx # Animated record button
│   │   ├── VoiceWaveform.tsx   # Live waveform visualization
│   │   └── AudioPlayer.tsx     # Playback controls
│   ├── screens/
│   │   ├── VoiceNotesListScreen.tsx  # Home screen
│   │   ├── HistoryScreen.tsx         # History timeline
│   │   └── VoiceNoteDetailScreen.tsx # Note details
│   ├── nativeModules/
│   │   ├── NativeAudioSession.ts     # Audio routing wrapper
│   │   └── NativeLevelMeter.ts       # Mic level wrapper
│   ├── android/            # Native Android code
│   └── ios/                # Native iOS code
└── Backend/
    └── server.js           # Express server
```

---

## 🐛 Known Issues

### Expo Go Limitations
- **NativeLevelMeter** not available (native build required)
- **NativeAudioSession** not available (native build required)
- Fallback implementations provided for development

### Solutions
- Build native app with `eas build` for full functionality
- MMKV works in native builds, AsyncStorage in Expo Go

---

## 🔮 Future Enhancements

- [ ] Export voice notes (JSON/CSV)
- [ ] Cloud sync with Firebase
- [ ] Folders/tags for organization
- [ ] Voice commands ("Hey VoiceAI")
- [ ] Custom themes (light mode)
- [ ] Multi-language transcription
- [ ] Share notes as audio/text

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👤 Author

Built as a technical take-home project showcasing:
- React Native + TypeScript proficiency
- Custom native module integration
- AI/ML API integration
- Production-quality UX design
- Clean architecture patterns

---

## 🙏 Acknowledgments

- **OpenAI** - Whisper & GPT APIs
- **Groq** - Fast inference fallback
- **Expo** - Amazing React Native tooling
- **MMKV** - High-performance storage

---

**Version:** 1.0.0  
**Last Updated:** December 2024
