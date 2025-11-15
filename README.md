# AI Voice Assistant Hub

A sophisticated, production-ready web application that serves as a universal AI assistant hub with advanced voice capabilities, multi-provider support, and intelligent conversation management.

## Features

### 🎤 Advanced Voice Capabilities
- **Real-time Voice Recording**: High-quality audio capture with WebRTC
- **Voice Activity Detection (VAD)**: Intelligent detection of speech vs. silence
- **Automatic Silence Detection**: Configurable thresholds (500ms-3000ms)
- **Live Transcription**: Powered by OpenAI Whisper API
- **Waveform Visualization**: Real-time audio level display during recording
- **Smart Turn Management**: Automatic stop after silence detection

### 🤖 AI Integration
- **Multi-Provider Support**: Built-in integration with OpenAI GPT models
- **Streaming Responses**: Real-time AI response generation
- **Context-Aware Conversations**: Maintains conversation history and context
- **Markdown Rendering**: Rich text formatting for AI responses
- **Token Usage Tracking**: Monitor API usage and costs

### 💬 Conversation Management
- **Thread Organization**: Create and manage multiple conversation threads
- **Conversation History**: Persistent message storage
- **Search and Filter**: Easy navigation through conversations
- **Auto-Save**: Automatic conversation updates
- **Delete and Archive**: Clean up old conversations

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful frosted glass effects
- **Dark Theme**: Eye-friendly dark mode interface
- **Responsive Layout**: Mobile-first design that works on all devices
- **Smooth Animations**: Polished transitions and micro-interactions
- **Typing Indicators**: Visual feedback during AI processing
- **Message Bubbles**: Clean, chat-like interface

### ⚙️ User Settings
- **Voice Recognition Settings**:
  - Adjustable silence threshold (500-3000ms)
  - VAD sensitivity control (0-100%)
- **Text-to-Speech Settings**:
  - Speaking speed control (50-200%)
  - Auto-play toggle
- **Account Management**: View profile and usage statistics

## Technology Stack

### Frontend
- **React 19**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling with custom design system
- **tRPC**: End-to-end typesafe APIs
- **Wouter**: Lightweight routing
- **Shadcn/ui**: High-quality UI components
- **Streamdown**: Markdown rendering for AI responses

### Backend
- **Node.js + Express**: Fast, scalable server
- **tRPC**: Type-safe API layer
- **Drizzle ORM**: Type-safe database queries
- **MySQL/TiDB**: Relational database
- **S3 Storage**: File storage for audio recordings

### AI Services
- **OpenAI GPT-4**: Text generation and chat
- **OpenAI Whisper**: Speech-to-text transcription
- **Manus Built-in Services**: Integrated AI infrastructure

## Database Schema

### Tables
- **users**: User accounts and authentication
- **conversations**: Chat threads and metadata
- **messages**: Individual messages with role and content
- **userSettings**: User preferences and configuration
- **providerConfigs**: API keys and provider settings
- **voiceProfiles**: Custom TTS voice configurations
- **usageStats**: Usage tracking and analytics

## API Endpoints (tRPC)

### Authentication
- `auth.me`: Get current user
- `auth.logout`: Logout user

### Conversations
- `conversations.list`: List all user conversations
- `conversations.create`: Create new conversation
- `conversations.get`: Get conversation by ID
- `conversations.update`: Update conversation title
- `conversations.delete`: Archive conversation

### Messages
- `messages.list`: Get messages for conversation
- `messages.create`: Create new message
- `messages.delete`: Delete message

### Chat
- `chat.send`: Send message and get AI response

### Voice
- `voice.transcribe`: Transcribe audio to text
- `voice.uploadAudio`: Upload audio file to storage

### Settings
- `settings.get`: Get user settings
- `settings.update`: Update user settings

### Providers
- `providers.list`: List configured providers
- `providers.create`: Add new provider
- `providers.update`: Update provider config
- `providers.delete`: Remove provider

### Voice Profiles
- `voiceProfiles.list`: List voice profiles
- `voiceProfiles.create`: Create voice profile
- `voiceProfiles.delete`: Delete voice profile

### Usage
- `usage.stats`: Get usage statistics

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL/TiDB database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (automatically configured in Manus platform)

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Start development server:
   ```bash
   pnpm dev
   ```

### Environment Variables

The following environment variables are automatically configured:
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Session signing secret
- `VITE_APP_ID`: OAuth application ID
- `OAUTH_SERVER_URL`: OAuth server URL
- `BUILT_IN_FORGE_API_KEY`: Manus AI services API key
- `BUILT_IN_FORGE_API_URL`: Manus AI services URL

## Usage

### Creating a Conversation
1. Click "New Conversation" in the sidebar
2. Enter a conversation title
3. Start chatting!

### Voice Input
1. Click the microphone button
2. Speak your message
3. The system will automatically detect when you stop speaking
4. Your speech will be transcribed and sent to the AI

### Text Input
1. Type your message in the input field
2. Press Enter or click the Send button
3. The AI will respond in real-time

### Adjusting Settings
1. Click the Settings icon in the sidebar
2. Navigate to the Voice Settings tab
3. Adjust silence threshold and VAD sensitivity
4. Configure TTS preferences
5. Click "Save Voice Settings"

## Features in Development

- Multi-provider AI support (Anthropic, Google, etc.)
- Custom voice cloning with ElevenLabs
- File upload and multimodal analysis
- Voice playback controls
- Interrupt handling for AI responses
- Advanced conversation branching
- Usage analytics dashboard

## Architecture

### Frontend Architecture
- Component-based React architecture
- Custom hooks for state management
- tRPC hooks for API calls
- Optimistic updates for instant feedback
- Error boundaries for graceful error handling

### Backend Architecture
- tRPC routers for type-safe APIs
- Drizzle ORM for database queries
- Middleware for authentication
- File upload handling with S3
- Error handling and validation

### Voice Processing Pipeline
1. Audio capture via MediaRecorder API
2. Real-time audio analysis with Web Audio API
3. Voice activity detection
4. Silence detection and auto-stop
5. Upload to S3 storage
6. Transcription via Whisper API
7. Display transcribed text

### AI Response Pipeline
1. User message saved to database
2. Conversation history retrieved
3. Context built with system prompt
4. AI API call with streaming
5. Response saved to database
6. Real-time display with markdown rendering

## Performance Optimizations

- Lazy loading of components
- Optimistic UI updates
- Efficient re-rendering with React hooks
- Database query optimization
- Audio processing in Web Workers (future)
- Response caching (future)

## Security

- JWT-based authentication
- Secure session management
- API key encryption (in progress)
- Input validation and sanitization
- CORS protection
- Rate limiting (future)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebRTC support

## License

Proprietary - All rights reserved

## Support

For issues, questions, or feature requests, please contact the development team.
