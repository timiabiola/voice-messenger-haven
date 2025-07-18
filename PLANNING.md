# Voice Messenger Haven - Planning Document

## 🚨 IMPORTANT: Shadcn Components
**Always use the MCP server when working with shadcn components during planning and implementation. See `shad-cn.mdc` for detailed usage rules.**

## Vision

Voice Messenger Haven is a modern web application that reimagines voice communication by providing a seamless, intuitive platform for recording, sending, and managing voice messages. The app bridges the gap between traditional phone calls and text messaging, offering the personal touch of voice with the convenience of asynchronous communication.

### Core Value Propositions
- **Personal Connection**: Voice messages preserve tone, emotion, and personality that text cannot capture
- **Asynchronous Communication**: Users can send and receive messages at their convenience
- **Phone Integration**: Direct integration with phone numbers via Twilio for SMS/voice delivery
- **Organization Tools**: Built-in notes system and message saving for better communication management
- **Accessibility**: Voice-first interface suitable for users who prefer speaking over typing

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React SPA)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React +   │  │   Tailwind   │  │  shadcn/ui   │      │
│  │ TypeScript  │  │     CSS      │  │  Components  │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL │  │   Storage    │  │     Auth     │      │
│  │   Database  │  │   (Audio)    │  │   (Phone)    │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│  ┌─────────────────────────────────────────────────┐       │
│  │           Edge Functions (Deno)                  │       │
│  │  • Twilio Webhook Handler                       │       │
│  │  • Voice Message Notifications                  │       │
│  │  • Phone Number Sync                           │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Twilio    │  │    OpenAI    │  │  Push Notif  │      │
│  │  (SMS/Voice)│  │ (AI Features)│  │   Services   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Architecture

#### Core Entities
1. **Users** - Profile information, authentication, preferences
2. **Voice Messages** - Audio recordings with metadata
3. **Contacts** - User's contact list with phone integration
4. **Notes** - Text notes with tags and folder organization
5. **Saved Messages** - Bookmarked voice messages for quick access

#### Real-time Features
- WebSocket connections via Supabase for live message updates
- Presence indicators for online status
- Real-time notification delivery

### Security Architecture
- Row Level Security (RLS) policies on all database tables
- Phone number verification via Twilio
- Secure audio file storage with signed URLs
- Rate limiting on API endpoints
- Input validation and sanitization

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.x for fast development and optimized builds
- **Styling**: 
  - Tailwind CSS for utility-first styling
  - shadcn/ui for consistent component library
  - Radix UI primitives for accessibility
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - React Context for global app state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Audio Processing**: Web Audio API with custom utilities

### Backend
- **Platform**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Database**: PostgreSQL with PostGIS for location features
- **File Storage**: Supabase Storage for audio files
- **Edge Functions**: Deno runtime for serverless functions
- **Authentication**: Supabase Auth with phone number verification

### External Services
- **Communication**: Twilio (SMS, Voice calls, Phone verification)
- **AI Features**: OpenAI API for transcription and AI assistant
- **Monitoring**: Sentry for error tracking
- **Analytics**: PostHog or similar for usage analytics

### Development Tools
- **Version Control**: Git with GitHub
- **Code Quality**: 
  - ESLint for linting
  - Prettier for formatting
  - TypeScript for type safety
- **Testing**: 
  - Vitest for unit tests
  - React Testing Library for component tests
  - Playwright for E2E tests
- **CI/CD**: GitHub Actions for automated testing and deployment

## Required Tools List

### Development Environment
1. **Node.js** (v18 or later) - JavaScript runtime
2. **npm** or **pnpm** - Package manager
3. **Git** - Version control
4. **VS Code** (recommended) - Code editor with extensions:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript React code snippets

### Backend Services
1. **Supabase Account** - Backend platform
   - PostgreSQL database
   - Authentication service
   - File storage
   - Edge Functions
2. **Twilio Account** - Phone integration
   - Phone number provisioning
   - SMS/Voice capabilities
   - Webhook configuration
3. **OpenAI API Key** (optional) - AI features
   - Voice transcription
   - AI assistant capabilities

### Deployment & Monitoring
1. **Vercel** or **Netlify** - Frontend hosting
2. **Supabase CLI** - Database migrations and function deployment
3. **GitHub** - Source control and CI/CD
4. **Sentry** (optional) - Error monitoring
5. **PostHog** (optional) - Analytics

### Local Development Tools
1. **Thunder Client** or **Postman** - API testing
2. **TablePlus** or **pgAdmin** - Database management
3. **Chrome DevTools** - Debugging and performance
4. **React Developer Tools** - React debugging

### Design & Assets
1. **Figma** (optional) - Design mockups
2. **Lucide Icons** - Icon library (included via shadcn/ui)
3. **Audio editing software** (optional) - For testing audio features

## Development Workflow

### Initial Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables (.env.local)
4. Set up Supabase project
5. Configure Twilio webhooks
6. Run database migrations
7. Start development server: `npm run dev`

### Feature Development
1. Create feature branch
2. Implement with TypeScript and React
3. Test locally with hot reload
4. Write unit tests
5. Submit pull request
6. Deploy to staging after review

### Deployment Pipeline
1. Push to main branch triggers CI/CD
2. Automated tests run
3. Build process creates optimized bundle
4. Deploy to Vercel/Netlify
5. Database migrations run on Supabase
6. Edge functions deploy automatically

## Future Considerations

### Scalability
- Implement CDN for audio file delivery
- Add caching layers for frequently accessed data
- Consider message queuing for high-volume notifications
- Optimize database queries with proper indexing

### Features Roadmap
- Group voice messages
- Voice message transcription
- Multi-language support
- Desktop and mobile apps
- Integration with calendar apps
- Voice message templates
- Advanced search capabilities

### Performance Targets
- Initial page load < 3 seconds
- Audio playback start < 1 second
- Message send confirmation < 2 seconds
- Real-time updates < 500ms latency