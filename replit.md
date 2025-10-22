# Bridge - Smart Demand Matching Platform

## Overview

Bridge is a dynamic, intelligent demand-potential matching platform that connects demand providers with task performers. The platform transforms natural language demand descriptions into structured micro-tasks using AI and matches them with performers. Performers complete tasks and receive badges as recognition from providers.

The system serves two primary user personas:
- **Demand Providers**: Users who describe their needs in natural language, receive AI-decomposed tasks, and review performer submissions
- **Task Performers**: Users who complete provider tasks, submit their work, and earn badges upon provider approval

## Recent Changes (October 22, 2025)

**Session 4 - Q&A System Completion and Application Management**
- **Q&A Voting & Bookmarking**:
  - Implemented question voting (upvote/downvote with toggle) via `/api/questions/:id/vote`
  - Implemented question save/unsave (bookmarking) via `/api/questions/:id/save` and `DELETE /api/questions/:id/save`
  - Added `GET /api/saved-questions` to retrieve user's bookmarked questions
  - Integrated voting UI in question-detail page with real-time vote counts
  - Added "Saved" tab in Profile page displaying bookmarked questions with author info and empty state
- **Comment System**:
  - Implemented comment creation via `/api/questions/:id/comments`
  - Implemented comment voting via `/api/comments/:id/vote`
  - Added comment listing with author information in question-detail page
  - Comments display with upvote/downvote buttons and vote counts
- **Provider Application Management** (CRITICAL FIX):
  - Added `getApplicationsByProvider()` storage method - fetches all applications for provider's tasks with JOIN queries
  - Added `GET /api/provider/applications` - provider can view all task applications
  - Added `PATCH /api/applications/:id` - provider can accept/reject applications
  - On accept: automatically matches task to performer and creates notification
  - On reject: creates notification to inform performer
  - Provider Dashboard now has "Task Applications" tab with:
    - Pending Applications section showing performer details, ratings, task info
    - Accept/Reject buttons for each pending application
    - Past Applications section showing historical accepted/rejected applications
    - Empty state when no applications exist
- **Schema Updates**:
  - Added `questionVotes` table with integer vote (-1/1)
  - Added `savedQuestions` junction table for bookmarking
  - Fixed exports for new tables in shared/schema.ts
- **Architect Review**: Q&A features passed review with no blocking defects

**Session 3 - User Profile System and Q&A Enhancements**
- **User Profile System**:
  - Extended users table with profile fields: avatar, bio, company, location, website, skills, rating
  - Created comprehensive profile page (/users/:id) with edit functionality
  - Added profile editing API with strict security validation
  - Integrated Messages and Notifications tabs into profile (placeholder)
  - Added "View Profile" option in Header user menu
- **Task List Enhancements**:
  - Modified `getAvailableTasks()` to return Provider information (username and ID)
  - Tasks now display Provider information with clickable link to Provider profile
  - Performers can view Provider details from task cards
- **Q&A UI Enhancements**:
  - Added upvote/downvote buttons with vote counts
  - Added save button for bookmarking questions
  - Added AI Answer button (UI only, backend pending)
  - Improved visual design with action buttons
- **Security Fixes**:
  - Implemented strict Zod validation for profile updates
  - Whitelisted allowed fields to prevent privilege escalation
  - Added max length constraints for text fields

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