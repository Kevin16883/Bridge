# Bridge - Smart Demand Matching Platform

## Overview

Bridge is an intelligent demand-potential matching platform that connects demand providers with task performers. It uses AI to transform natural language demand descriptions into structured micro-tasks, which are then matched with performers. Performers complete tasks and receive badges as recognition. The platform serves two primary user personas: Demand Providers (who describe needs and review submissions) and Task Performers (who complete tasks and earn badges).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React with TypeScript, Vite, and Wouter for routing. TanStack Query manages server state and caching. UI is built with Shadcn/ui (Radix UI primitives) and Tailwind CSS, supporting dark/light themes. State management utilizes React Context for auth/theme and TanStack Query for data. Key design patterns include protected routes, React Hook Form with Zod validation, and reusable component composition.

### Backend Architecture

The backend is built with Express.js and TypeScript, using Node.js. Session-based authentication is handled by Passport.js with a local strategy. APIs are RESTful (`/api` prefix), and session management uses a PostgreSQL store. Password hashing uses scrypt. The storage layer uses an abstract `IStorage` interface with Drizzle ORM for type-safe PostgreSQL queries.

### Data Architecture

The database is PostgreSQL. Core entities include Users (auth, roles), Projects (provider requests), Tasks (AI-decomposed micro-tasks), TaskSubmissions (performer work), Badges (achievements), UserBadges, and TaskApplications. Data relationships are one-to-many and many-to-many. Drizzle ORM with Neon serverless driver is used for type-safe, schema-first data access and Zod validation.

### UI/UX Decisions

The platform employs a custom color palette focused on trust and innovation (teal-blue primary colors). The UI features progressive disclosure, displaying complexity only when needed, and includes robust form validation.

### Technical Implementations

- **User Management**: Includes profile creation, editing, follow/unfollow functionality, rating system, and privacy controls (public/private profiles).
- **Task Management**: Providers can create and manage tasks. Performers can browse available tasks, apply, and submit work.
- **Application Management**: Providers can view, accept, or reject applications. Performers can view and cancel their applications.
- **Q&A System**: Community forum with question posting, voting, commenting, and bookmarking.
- **Notifications & Messaging**: Real-time messaging and a notification system with unread badges.
- **Search & Filter**: Comprehensive search and filtering options for tasks, projects, and Q&A.

### Feature Specifications

- **Follow System**: Users can follow/unfollow others, view followers/following lists, and see follow counts.
- **Rating System**: Users can rate other users; profiles display average ratings.
- **Privacy Controls**: Users can set their profile to public or private, affecting visibility of tasks and personal data.
- **Q&A Voting & Bookmarking**: Questions can be upvoted/downvoted and bookmarked.
- **Comment System**: Comments can be added and voted on within Q&A.
- **Provider Application Management**: Providers can manage all applications for their tasks, accepting or rejecting them, which triggers notifications and task assignments.

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL
- `@neondatabase/serverless`
- `connect-pg-simple`

**UI Component Libraries:**
- Radix UI
- Recharts
- Embla Carousel
- Lucide React

**Form & Validation:**
- React Hook Form
- Zod
- `@hookform/resolvers`
- Drizzle-Zod

**Styling & Theming:**
- Tailwind CSS
- Class Variance Authority (CVA)
- CLSX, tailwind-merge

**Development Tools:**
- Vite
- TSX
- ESBuild
- Drizzle Kit

**Utilities:**
- `date-fns`
- `nanoid`
- `cmdk`