# AI Voice Assistant Hub

A sophisticated, production-ready AI voice assistant application with multi-provider support, real-time voice conversation, advanced customization capabilities, and conversation templates.

## 🌟 Key Features

### 🤖 Multi-Provider AI Integration
- **OpenAI** (GPT-4, GPT-3.5 Turbo) - Built-in support, no API key required
- **OpenRouter** - Access to Mistral, Claude, Llama, and 200+ models
- **Mistral AI** - Support for normal and custom fine-tuned models
- **Anthropic Claude** - Claude 3.5 Sonnet, Opus, and Haiku
- **Hume AI** - Emotion-aware AI conversations
- Easy provider switching per conversation
- Custom model configuration with temperature control (0-2.0)
- Per-conversation system prompts

### 🎤 Advanced Voice Capabilities
- **Real-time Voice Recording** with waveform visualization
- **Voice Activity Detection (VAD)** with configurable sensitivity (0-100%)
- **Automatic Silence Detection** with adjustable thresholds (500-3000ms)
- **Speech-to-Text** powered by:
  - OpenAI Whisper (built-in, no API key required)
  - Deepgram (with custom API key)
- **Text-to-Speech** via:
  - ElevenLabs (multiple voice options)
  - Hume AI (emotion-aware voices)
- **Voice Call Mode** - Continuous conversation with automatic turn detection
- **Audio Playback Controls** - Play/pause AI responses on demand
- **TTS Speed Control** (50-200%)
- **Auto-play Toggle** for AI responses

### 💬 Conversation Management
- **Conversation Templates** - Pre-configured AI settings for specific use cases:
  - **Creative Writing** - High creativity (temp: 0.9) for storytelling
  - **Code Assistant** - Precise (temp: 0.3) for programming help
  - **Business Advisor** - Analytical (temp: 0.5) for strategy
  - **Personal Tutor** - Patient (temp: 0.4) for learning
  - **Brainstorm Partner** - Creative (temp: 0.85) for idea generation
  - **Quick Answers** - Fast (temp: 0.2) with GPT-3.5 Turbo
- **Per-Conversation Settings Menu** - Customize provider, model, temperature, and system prompt without leaving the chat
- **Export Conversations** - Download as:
  - JSON (full data with metadata)
  - Markdown (formatted documentation)
  - Plain Text (simple transcript)
- **Conversation History** with timestamps
- **Thread Organization** and management
- **Delete Conversations** with confirmation

### ⚙️ User Settings & Customization
- **Voice Settings Tab**:
  - Silence threshold (500-3000ms)
  - VAD sensitivity (0-100%)
  - TTS speed (50-200%)
  - Auto-play AI responses toggle
  - Default STT provider selection
  - Default TTS provider selection
- **API Keys Tab** - Manage provider credentials:
  - OpenRouter API key
  - Mistral AI API key
  - Anthropic API key
  - ElevenLabs API key
  - Deepgram API key
  - Hume AI API key
  - Optional labels for identification
- **Account Tab**:
  - User profile information
  - Usage statistics
  - Account settings

### 🎨 Modern UI/UX
- **Glassmorphism Design** with dark gradient background
- **Mobile-Responsive Layout** with collapsible sidebar
- **Keyboard Shortcuts**:
  - `Ctrl+Enter` / `Cmd+Enter` - Send message
  - `Enter` - Send message (when not multiline)
- **Real-time Message Streaming** with markdown rendering
- **Token Usage Display** per message
- **Loading States & Skeletons** for smooth UX
- **Typing Indicators** during AI processing
- **Error Handling** with retry mechanisms
- **Smooth Animations** and transitions
- **Message Bubbles** with user/assistant distinction

## 🚀 Getting Started

### Prerequisites
- Node.js 22.x
- pnpm package manager
- MySQL/TiDB database (provided by platform)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables (automatically injected by platform):
   - `DATABASE_URL` - Database connection string
   - `JWT_SECRET` - Session signing secret
   - `VITE_APP_ID` - OAuth application ID
   - `BUILT_IN_FORGE_API_KEY` - API key for built-in services
   - `BUILT_IN_FORGE_API_URL` - Built-in services URL

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

## 📖 Usage Guide

### Creating a Conversation

**Option 1: From Templates (Recommended)**
1. Click "Templates" button in sidebar
2. Choose a template that matches your use case
3. Start chatting immediately with optimized settings

**Option 2: Manual Creation**
1. Click "New Conversation" button in sidebar
2. Enter a title for your conversation
3. Configure AI settings via the settings menu in chat header

### Using Voice Features

**Voice Recording:**
1. Click the microphone button in the chat input
2. Speak your message clearly
3. Recording stops automatically after silence is detected
4. Transcription appears in the input field
5. Review and edit if needed, then send

**Voice Call Mode:**
1. Open a conversation
2. Click "Voice Call" button in chat header
3. Start speaking naturally when ready
4. AI listens and responds automatically with voice
5. Turn detection handles conversation flow
6. Mute/unmute with microphone button
7. Click red phone icon to end call

**TTS Playback:**
1. Click the speaker icon next to any AI message
2. Audio plays automatically after generation
3. Click again to pause/resume
4. Configure voice provider and speed in Settings

### Configuring AI Providers

**Adding API Keys:**
1. Go to Settings (gear icon in sidebar)
2. Navigate to "API Keys" tab
3. Select provider from dropdown
4. Enter your API key
5. Optional: Add a label for identification
6. Click "Add API Key"

**Supported Providers:**
- **OpenRouter** - Access 200+ models from various providers
- **Mistral AI** - Mistral models including fine-tuned versions
- **Anthropic** - Claude 3.5 Sonnet, Opus, Haiku
- **ElevenLabs** - High-quality TTS with multiple voices
- **Deepgram** - Advanced STT with custom models
- **Hume AI** - Emotion-aware AI and TTS

**Per-Conversation Settings:**
1. Open a conversation
2. Click the settings icon (⚙️) in chat header
3. Choose AI provider and model
4. Adjust temperature (0 = deterministic, 2 = creative)
5. Add custom system prompt (optional)
6. Click "Save Settings"

### Exporting Conversations

1. Open the conversation you want to export
2. Click the download icon (⬇️) in chat header
3. Choose format:
   - **JSON** - Full data including metadata, timestamps, token counts
   - **Markdown** - Formatted for documentation with headers
   - **Text** - Simple plain text transcript

### Keyboard Shortcuts

- `Ctrl+Enter` or `Cmd+Enter` - Send message
- `Enter` - Send message (in single-line mode)
- `Esc` - Close dialogs and modals

## 🛠️ Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 with custom design system
- shadcn/ui components
- tRPC for type-safe API calls
- Wouter for routing
- Streamdown for markdown rendering
- Web Audio API for voice processing

**Backend:**
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB database
- OpenAI API (GPT-4, Whisper)
- Multi-provider LLM integration

**Voice Processing:**
- MediaRecorder API for audio capture
- Web Audio API for analysis
- Voice Activity Detection (VAD)
- Silence detection algorithms
- Real-time audio streaming

## 📊 Database Schema

- **users** - User accounts and authentication
  - id, openId, name, email, role, timestamps
- **conversations** - Chat sessions with AI settings
  - id, userId, title, llmProvider, llmModel, temperature, systemPrompt, timestamps
- **messages** - Individual messages with metadata
  - id, conversationId, role, content, audioUrl, provider, model, tokenCount, timestamps
- **userSettings** - User preferences and defaults
  - userId, silenceThreshold, vadSensitivity, ttsSpeed, autoPlayTts, defaultLlmProvider, defaultLlmModel, defaultSttProvider, defaultTtsProvider
- **providerConfigs** - API keys and provider settings
  - id, userId, provider, apiKey, label, isActive, timestamps
- **voiceProfiles** - Voice customization settings
  - id, userId, name, provider, voiceId, settings, timestamps
- **usageTracking** - Token and audio usage statistics
  - id, userId, conversationId, provider, model, tokensUsed, audioMinutes, cost, timestamps

## 🎨 Design Philosophy

The application features a modern glassmorphism design with:
- **Dark gradient background** (purple to blue)
- **Translucent panels** with backdrop blur
- **Smooth animations** and micro-interactions
- **Accessible color contrast** for readability
- **Mobile-first responsive layout**
- **Consistent spacing** and typography
- **Visual hierarchy** with shadows and borders

## 🔒 Security & Privacy

- **Encrypted API Keys** - All provider credentials encrypted at rest
- **Session-based Authentication** with JWT
- **No Data Sharing** - Your data stays private
- **User Data Isolation** - Each user's data is separate
- **HTTPS Enforced** - All connections encrypted
- **Input Validation** - Protection against injection attacks
- **Rate Limiting** - Protection against abuse (future)

## 🚀 Performance Optimizations

- **Lazy Loading** - Components loaded on demand
- **Optimistic UI Updates** - Instant feedback
- **Efficient Re-rendering** - React hooks optimization
- **Database Query Optimization** - Indexed queries
- **Response Streaming** - Real-time AI responses
- **Audio Processing** - Efficient VAD algorithms
- **Caching Strategy** - Reduced API calls (future)

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebRTC support

## 🤝 Contributing

This is a private project. For issues or feature requests, please contact the project owner.

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- **OpenAI** - GPT models and Whisper API
- **Anthropic** - Claude models
- **Mistral AI** - Mistral models
- **ElevenLabs** - Voice synthesis
- **Deepgram** - Speech recognition
- **Hume AI** - Emotion-aware AI
- **Manus Platform** - Infrastructure and deployment
- **shadcn/ui** - UI component library

---

**Version:** 2.0.0  
**Last Updated:** November 2025  
**Built with ❤️ using Manus AI**
