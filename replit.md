# Bridge - Smart Demand Matching Platform

## Overview

Bridge is a dynamic, intelligent demand-potential matching platform that connects demand providers with task performers. The platform transforms natural language demand descriptions into structured micro-tasks using AI and matches them with performers. Performers complete tasks and receive badges as recognition from providers.

The system serves two primary user personas:
- **Demand Providers**: Users who describe their needs in natural language, receive AI-decomposed tasks, and review performer submissions
- **Task Performers**: Users who complete provider tasks, submit their work, and earn badges upon provider approval

## Recent Changes (October 22, 2025)

**Session 2 - Q&A Community Fixes and Navigation Refactor**
- Fixed Q&A Community questions not displaying by implementing full storage layer and API endpoints
- Added `createQuestion()`, `getQuestion()`, `getAllQuestions()`, `incrementQuestionViews()` storage methods
- Added Questions API routes: GET /api/questions, GET /api/questions/:id, POST /api/questions
- Refactored Tasks page (/tasks) to use Tabs component consolidating Browse Tasks and My Applications
- Removed standalone "My Applications" header link - now integrated as tab in Tasks page
- Both tabs retain search/filter functionality with improved UX

**Critical Bug Fix - Task Visibility**
- Fixed `getAvailableTasks()` method to properly filter available tasks
- Changed from incorrect `eq(tasks.matchedPerformerId, null)` to proper `isNull(tasks.matchedPerformerId)`
- Performers can now see Provider's published tasks on the Tasks page

**New Features - Applications Management**
1. **Applications Page** (`/applications`)
   - Displays all task applications with full task details
   - Separated into "Pending" and "Past Applications" sections
   - Shows application status (pending/accepted/rejected)
   - View task details directly from application cards
   - Cancel pending applications with confirmation dialog
   - Navigation link in Header for Performers

2. **Search & Filter - Performer Tasks** (`/tasks`)
   - Keyword search across title, description, and required skills
   - Difficulty level filter (easy/medium/hard)
   - Skill tag filter with dynamic skill list generation
   - Clear filters button when active
   - Shows "X of Y tasks available" count

3. **Search & Filter - Provider Dashboard** (`/provider-dashboard-real`)
   - Keyword search by demand description
   - Status filter (all/draft/open/active/completed/cancelled)
   - Clear filters button when active
   - Shows "Showing X of Y projects" count
   - Empty state with clear filters option

**Backend Enhancements**
- Added `GET /api/performer/applications` - Get applications with task details
- Added `DELETE /api/applications/:id` - Cancel application
- Added `getApplicationsWithTaskDetails()` storage method with JOIN query
- Added `deleteApplication()` storage method with security checks

**Previous Changes (October 21, 2025)**

**Schema Layer Expansion**
- Added TypeScript schema definitions for 14 additional database tables in `shared/schema.ts`
- All tables now have complete Drizzle ORM schema, Zod validation schemas, and TypeScript types

**New Features - UI Layer Implemented**
1. **Q&A Community** (`/community`, `/community/ask`)
   - Question listing with search and category filtering
   - Ask question form with tags support
   - Integration-ready for API endpoints
   
2. **Private Messaging** (`/messages`)
   - Conversation list with unread counts
   - Real-time messaging interface
   - Message sending and receiving UI

3. **Notifications System**
   - Dropdown notification center in header
   - Unread notification badges
   - Mark as read functionality

4. **User Profiles** (`/users/:userId`)
   - User statistics and achievements
   - Badge showcase
   - Follow/unfollow functionality
   - Send message integration

**Bug Fixes**
- Fixed ProviderDashboard crash when displaying projects with 'draft' or 'open' status
- Added proper status icon mappings for all project states

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

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- Session-based authentication using Passport.js with LocalStrategy
- Custom middleware for request logging and error handling

**API Design**
- RESTful endpoints prefixed with `/api`
- Authentication endpoints: `/api/register`, `/api/login`, `/api/logout`, `/api/user`
- Session management with PostgreSQL session store
- Password hashing using scrypt with salted hashes

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
- **Users**: Authentication and role designation (provider/performer)
- **Projects**: Demand provider's original requests with budget and status tracking
- **Tasks**: Decomposed micro-tasks with skills, budget, time estimates, and matching status
- **TaskSubmissions**: Performer work submissions with provider feedback and approval status
- **Badges**: Achievement badges with categories (completion, quality, speed, specialty)
- **UserBadges**: Records of badges earned by performers for completed tasks
- **TaskApplications**: Performer applications and assignment records

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