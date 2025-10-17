# Bridge - Smart Demand Matching Platform

## Overview

Bridge is a dynamic, intelligent demand-potential matching platform that connects demand providers with task performers. The platform transforms natural language demand descriptions into structured micro-tasks using AI and matches them with performers. Performers complete tasks and receive badges as recognition from providers.

The system serves two primary user personas:
- **Demand Providers**: Users who describe their needs in natural language, receive AI-decomposed tasks, and review performer submissions
- **Task Performers**: Users who complete provider tasks, submit their work, and earn badges upon provider approval

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type safety and component-based architecture
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Theme system supporting dark and light modes via context provider
- Custom color palette focused on trust and innovation (teal-blue primary colors)

**State Management Strategy**
- React Context for authentication state and theme preferences
- TanStack Query for server-side data fetching, caching, and mutations
- Local component state for UI interactions
- Session-based authentication with cookies

**Key Design Patterns**
- Protected routes that redirect unauthenticated users to login
- Form validation using React Hook Form with Zod schemas
- Reusable component composition (cards, badges, buttons with variants)
- Progressive disclosure in UI (showing complexity only when needed)

**Social Features UI Components**
- MessageInbox: Message center component in Header with "Private Messages" and "Notifications" tabs
- MessageDialog: Private messaging dialog with conversation view and send functionality
- UserAvatar: Reusable avatar component with image display or username initials fallback
- Notification badge: Displays unread message/notification count in Header

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- Session-based authentication using Passport.js with LocalStrategy
- Custom middleware for request logging and error handling

**API Design**
- RESTful endpoints prefixed with `/api`
- Authentication endpoints: `/api/register`, `/api/login`, `/api/logout`, `/api/user`
- Social feature endpoints: `/api/avatar`, `/api/messages`, `/api/conversations`, `/api/follow`, `/api/notifications`, `/api/block`
- Session management with PostgreSQL session store
- Password hashing using scrypt with salted hashes
- First-message restriction enforced via `canSendMessage` guard

**Authentication & Security**
- Passport.js for authentication strategy
- Session-based auth with secure session cookies
- Password validation with minimum length requirements
- CSRF protection through same-origin session cookies

**Storage Layer**
- Abstract storage interface (`IStorage`) for database operations
- Drizzle ORM for type-safe database queries
- Organized storage methods by domain (users, projects, tasks, task submissions, badges, etc.)

### Data Architecture

**Database Schema (PostgreSQL)**

Core entities:
- **Users**: Authentication, role designation (provider/performer), and avatar URL
- **Projects**: Demand provider's original requests with budget and status tracking
- **Tasks**: Decomposed micro-tasks with skills, budget, time estimates, and matching status
- **TaskSubmissions**: Performer work submissions with provider feedback and approval status
- **Badges**: Achievement badges with categories (completion, quality, speed, specialty)
- **UserBadges**: Records of badges earned by performers for completed tasks
- **TaskApplications**: Performer applications and assignment records
- **Messages**: Private messaging system with sender/receiver and read status
- **Follows**: User follow relationships for social connections
- **Notifications**: System notifications for messages, follows, and other events
- **BlockedUsers**: User blocking system for privacy control

**Data Relationships**
- One-to-many: Users → Projects, Projects → Tasks, Tasks → TaskSubmissions
- Many-to-many via junction: Users ↔ Tasks (through TaskApplications)
- Badge system: Performers earn UserBadges when providers approve TaskSubmissions

**ORM Strategy**
- Drizzle ORM with Neon serverless PostgreSQL driver
- Type-safe schema definitions with Zod validation
- WebSocket support for serverless PostgreSQL connections
- Schema-first approach with generated TypeScript types

### External Dependencies

**Database**
- Neon Serverless PostgreSQL as the primary database
- `@neondatabase/serverless` driver with WebSocket support for serverless environments
- `connect-pg-simple` for PostgreSQL-backed session storage

**UI Component Libraries**
- Radix UI primitives for accessible headless components (dialogs, dropdowns, tooltips, etc.)
- Recharts for data visualization (radar charts for skill profiles)
- Embla Carousel for image/content carousels
- Lucide React for icon system

**Form & Validation**
- React Hook Form for form state management
- Zod for schema validation
- `@hookform/resolvers` for Zod integration with React Hook Form
- Drizzle-Zod for generating Zod schemas from database schema

**Styling & Theming**
- Tailwind CSS with custom configuration
- Class Variance Authority (CVA) for component variant management
- CLSX and tailwind-merge for conditional class composition
- Custom CSS variables for theme tokens (light/dark mode)

**Development Tools**
- Replit-specific plugins for development experience (error overlay, dev banner, cartographer)
- TSX for running TypeScript files directly in development
- ESBuild for production bundling
- Drizzle Kit for database migrations

**Utilities**
- date-fns for date manipulation
- nanoid for generating unique IDs
- cmdk for command palette functionality