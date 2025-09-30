# Bridge Platform - Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from Linear (modern task management), Tinder (matching UX), and Notion (dynamic cards), creating a professional yet approachable platform that builds trust while maintaining engagement.

## Core Design Principles
1. **Clarity in Complexity**: Transform complex AI-driven matching into intuitive visual interfaces
2. **Trust Through Transparency**: Every AI decision should be visually explained
3. **Progressive Disclosure**: Show depth only when needed, keep surfaces clean
4. **Dual Persona Balance**: Serve both demand providers and task performers with cohesive design

---

## Color Palette

**Primary Colors**:
- Brand Primary (Dark): `245 85% 55%` - Vibrant teal-blue conveying innovation and trust
- Brand Primary (Light): `245 75% 65%`

**Accent Colors**:
- Success/Match: `155 70% 50%` - Fresh green for successful matches
- Warning/Learning: `35 90% 60%` - Warm orange for growth opportunities
- Neutral/Professional: `220 15% 50%` - Balanced gray-blue

**Dark Mode** (Primary):
- Background: `220 20% 8%`
- Surface: `220 18% 12%`
- Surface Elevated: `220 16% 16%`
- Text Primary: `220 10% 95%`
- Text Secondary: `220 8% 70%`

**Light Mode**:
- Background: `220 15% 98%`
- Surface: `0 0% 100%`
- Surface Elevated: `220 20% 96%`

---

## Typography

**Font Families**:
- Primary: Inter (clean, modern, excellent readability)
- Monospace: JetBrains Mono (for task codes, challenge scores)

**Scale**:
- Hero: 4xl-6xl (48-60px) font-bold
- H1: 3xl-4xl (36-48px) font-semibold
- H2: 2xl-3xl (24-36px) font-semibold
- H3: xl (20px) font-medium
- Body: base (16px) font-normal
- Small: sm (14px) font-normal
- Micro: xs (12px) font-medium

---

## Layout System

**Spacing Primitives**: Use Tailwind units of `2, 4, 6, 8, 12, 16, 20, 24` for consistent rhythm
- Component padding: `p-4` to `p-8`
- Section spacing: `py-12` to `py-24`
- Card gaps: `gap-6` to `gap-8`

**Grid System**:
- Desktop: 12-column grid, max-w-7xl container
- Dashboard layouts: Sidebar (256px fixed) + Main content (flex-1)
- Card grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## Component Library

### Navigation
- **Top Nav**: Fixed header, backdrop blur, minimal height (64px), logo left, user profile right
- **Side Nav** (Dashboard): Fixed sidebar, collapsible on mobile, icon + label pattern
- **Breadcrumbs**: For task hierarchies and multi-step flows

### Cards & Containers
- **Task Cards**: Rounded borders (rounded-xl), subtle shadow, hover lift effect (translate-y-1)
- **Challenge Cards**: Highlighted border on active, timer badge in corner
- **Match Cards**: Tinder-style swipeable on mobile, grid on desktop, large avatar/icon
- **Micro-task Tiles**: Compact chips with skill tags, estimated time, difficulty indicator

### Data Visualization
- **Potential Graph**: Radar chart showing multi-dimensional capability scores
- **Task Breakdown Tree**: Hierarchical flow diagram from main need to micro-tasks
- **Progress Indicators**: Circular progress for challenges, linear for task completion
- **Skill Tags**: Pill-shaped, color-coded by category (logic=blue, creative=purple, technical=green)

### Forms & Inputs
- **Demand Input**: Large textarea with AI suggestion helper below
- **Challenge Interface**: Full-screen modal with timer, question area, answer input
- **File Upload**: Drag-drop zone with preview thumbnails

### Buttons & CTAs
- **Primary**: bg-primary text-white, rounded-lg, px-6 py-3
- **Secondary**: border-2 border-primary text-primary, same padding
- **Ghost**: text-primary hover:bg-primary/10
- **Icon Buttons**: Square (40x40px), rounded-lg, centered icon

### Overlays
- **Modals**: Centered, max-w-2xl, rounded-2xl, backdrop-blur background
- **Toasts**: Top-right, auto-dismiss, icon + message pattern
- **Tooltips**: Small, dark background, appear on hover with 200ms delay

---

## Key Interface Patterns

### Landing Page
- **Hero**: Full-width split layout - left side with headline + CTA, right side with animated matching visualization
- **How It Works**: 3-step horizontal timeline with icons and descriptions
- **Live Stats**: Animated counter showing tasks completed, matches made, skills assessed
- **Dual CTA**: Separate entry points for "Post a Need" vs "Build Your Potential"

### Demand Provider Dashboard
- **Quick Post**: Prominent natural language input at top
- **Active Projects**: Kanban-style board showing task status
- **AI Breakdown Preview**: Expandable cards showing how AI parsed their needs
- **Matched Talents**: Grid of potential graph previews with match % scores

### Task Performer Dashboard  
- **Potential Overview**: Circular stat display showing overall score + breakdown
- **Recommended Tasks**: Card grid with "Why this matches you" AI explanation
- **Challenge Library**: Filterable grid of available skill assessments
- **Achievements**: Badge collection showing completed challenges and verified skills

### Challenge Experience
- **Fullscreen Focus Mode**: Minimal distractions, timer always visible
- **Question Display**: Large, readable text with code syntax highlighting if needed
- **Multi-step Progress**: Dot indicators for multi-question challenges
- **Instant Feedback**: Animated success/failure states with score breakdown

---

## Images & Media

**Hero Section**: Use high-quality abstract imagery showing connection/network patterns, or diverse individuals collaborating. Style: modern, bright, slightly abstract

**Dashboard Illustrations**: Empty states use friendly, minimal illustrations (unDraw style) encouraging action

**User Avatars**: Circular, 40px-120px depending on context, fallback to colorful initial badges

**Icons**: Heroicons (outline for nav, solid for emphasis), 20px-24px standard size

---

## Animation Guidelines

**Minimal but Meaningful**:
- Card hover: Subtle lift (4px) with shadow increase, 150ms ease-out
- Page transitions: Fade + slight slide (20px), 200ms
- Loading states: Skeleton screens, no spinners unless necessary
- Matching animation: Brief confetti burst on successful match (particles.js)
- Challenge completion: Scale + checkmark animation, 300ms

**No Animations**: Background gradients, scrolling effects, parallax - keep it clean and performant

---

## Accessibility & Responsiveness

- Maintain WCAG AA contrast ratios in both modes
- All interactive elements minimum 44x44px touch target
- Keyboard navigation with visible focus states (2px ring)
- Responsive breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Mobile-first: Stack cards vertically, collapsible navigation, larger touch areas