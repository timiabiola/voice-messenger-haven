# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 IMPORTANT: Shadcn Components
**Always use the MCP server when working with shadcn components. For detailed usage rules, see `shad-cn.mdc`.**

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm i` - Install dependencies

## Architecture Overview

This is a React voice messaging application built with Vite, TypeScript, and Tailwind CSS. The app integrates with Supabase for backend services and uses shadcn/ui components.

### Key Technologies
- **Frontend**: React 18 with TypeScript, Vite bundler
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Backend**: Supabase (database, auth, storage, edge functions)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM
- **UI Components**: Radix UI primitives via shadcn/ui

### Project Structure

#### Core Pages (`src/pages/`)
- `Index.tsx` - Main landing/home page
- `Auth.tsx` - Authentication page
- `Inbox.tsx` - Voice message inbox
- `Microphone.tsx` - Voice recording interface
- `Saved.tsx` - Saved messages view
- `Notes.tsx` - Notes management
- `Contacts.tsx` - Contact management
- `AIAssistant.tsx` - AI assistant interface
- `AdminDashboard.tsx` - Admin panel
- `Settings.tsx` - User settings

#### Component Organization
- `components/ui/` - shadcn/ui components and custom UI primitives
- `components/messages/` - Voice message related components with playback controls
- `components/notes/` - Note-taking and management components
- `components/saved/` - Saved messages functionality
- `components/home/` - Home page components including microphone controls
- `components/layout/` - App layout components (sidebar, header, navigation)
- `components/voice-message/` - Voice message recording and playback UI

#### Data & State
- `hooks/` - Custom React hooks for state management
- `integrations/supabase/` - Supabase client and type definitions
- `types/` - TypeScript type definitions
- `data/` - Static data and configuration

#### Supabase Integration
- `supabase/functions/` - Edge functions for Twilio integration and notifications
- `supabase/migrations/` - Database schema migrations
- Uses Supabase for authentication, real-time subscriptions, and file storage

### Key Features
- Voice message recording and playback with waveform visualization
- Real-time messaging with phone number integration via Twilio
- Notes system with tagging and folder organization
- Saved messages with filtering and search
- Admin dashboard for user management
- Mobile-responsive design with touch interactions
- Notification system for new messages

### Development Notes
- Uses path aliases (`@/` maps to `src/`)
- Lovable integration for AI-assisted development
- Mobile-first responsive design
- Real-time features using Supabase subscriptions
- Audio processing utilities in `src/utils/audio.ts`
- Phone authentication and Twilio webhook integration