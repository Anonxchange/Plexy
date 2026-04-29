# Pexly - P2P Cryptocurrency Marketplace

## Overview

Pexly is a peer-to-peer cryptocurrency marketplace platform that enables users to buy, sell, and trade digital currencies using 500+ payment methods across 140 countries. The platform features a comprehensive trading interface with wallet management, offer listings, escrow protection, and a trust-based vendor system. Built with a modern React frontend and Express backend, Pexly prioritizes user trust, transaction security, and payment flexibility in the crypto trading space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Client-side routing implemented with Wouter, a lightweight alternative to React Router. The application uses a simple Switch/Route pattern for page navigation.

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. Local state is managed through React hooks and context providers.

**UI Component System**: Radix UI primitives with shadcn/ui component library using the "new-york" style variant. Components are built with composition patterns using Radix's unstyled primitives, styled with Tailwind CSS.

**Styling Approach**: Tailwind CSS with extensive CSS custom properties for theming. The design system implements a comprehensive color palette supporting both light and dark modes, with specialized variables for elevation states (`--elevate-1`, `--elevate-2`) and button styling.

**Theme System**: Custom theme provider supporting light/dark mode toggle with localStorage persistence. Theme state is managed through React Context and applies CSS classes to the document root.

**Design Language**: Inspired by established P2P platforms (Paxful, NoOnes) with lime green (#B4F22E) as the primary brand color. The design emphasizes trust indicators, clear data hierarchy, and action-oriented CTAs.

### Backend Architecture

**Server Framework**: Express.js with TypeScript, configured for ESM modules. The server handles API routes, static file serving, and Vite middleware integration in development.

**Development Setup**: Custom Vite integration for HMR (Hot Module Replacement) in development mode. The server conditionally loads Vite middleware and serves the built client application in production.

**Storage Layer**: Abstracted storage interface (`IStorage`) with in-memory implementation (`MemStorage`). The storage layer is designed for easy swapping between in-memory and database-backed implementations.

**Session Management**: Uses `connect-pg-simple` for PostgreSQL-based session storage, indicating planned session persistence.

**Error Handling**: Centralized error handling middleware that normalizes error responses and provides consistent API error formatting.

### Database Design

**ORM**: Drizzle ORM configured for PostgreSQL with the Neon serverless driver (`@neondatabase/serverless`).

**Schema Definition**: Type-safe schema definitions with Drizzle and Zod validation. Currently implements a basic users table with UUID primary keys, username, and password fields.

**Migration Strategy**: Drizzle Kit for schema migrations with migrations stored in the `/migrations` directory. Uses `drizzle-kit push` for development schema synchronization.

**Database Provider**: Configured for Neon serverless PostgreSQL, enabling serverless-friendly database connections with automatic scaling.

### Key Architectural Decisions

**Monorepo Structure**: Shared schema and types between client and server through a `/shared` directory, enabling type safety across the full stack.

**Path Aliasing**: Configured TypeScript path aliases (`@/`, `@shared/`, `@assets/`) for cleaner imports and better code organization.

**Build Strategy**: Separate build processes for client (Vite) and server (esbuild), with client assets output to `dist/public` and server bundle to `dist/index.js`.

**Responsive Design**: Mobile-first approach with custom hook (`useIsMobile`) for responsive behavior, complemented by Tailwind's responsive utilities.

**Component Organization**: Feature-based component structure with reusable UI components in `/components/ui` and page-specific components in feature directories.

## External Dependencies

### Core Framework Dependencies
- **React 18**: UI library with TypeScript support
- **Express**: Backend HTTP server framework
- **Vite**: Frontend build tool and development server
- **Wouter**: Lightweight client-side routing

### Database & ORM
- **Drizzle ORM**: Type-safe ORM for PostgreSQL
- **@neondatabase/serverless**: Neon serverless PostgreSQL driver
- **drizzle-zod**: Zod schema generation from Drizzle schemas
- **connect-pg-simple**: PostgreSQL session store for Express

### UI Component Library
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives (20+ components including Dialog, Dropdown, Select, Accordion, etc.)
- **shadcn/ui**: Pre-styled component patterns built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility

### State Management & Data Fetching
- **TanStack Query (React Query)**: Server state management and caching
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **Zod**: Runtime type validation

### Additional UI Libraries
- **Lucide React**: Icon library
- **react-icons**: Additional icon sets (Social media icons)
- **cmdk**: Command menu component
- **embla-carousel-react**: Carousel/slider component
- **date-fns**: Date manipulation and formatting
- **react-day-picker**: Date picker component
- **recharts**: Charting library (for potential price charts)

### Development Tools
- **TypeScript**: Static type checking
- **ESBuild**: Server-side bundling
- **PostCSS**: CSS processing with Autoprefixer
- **Replit-specific plugins**: Runtime error overlay, cartographer, dev banner (development only)

### Utility Libraries
- **nanoid**: Unique ID generation
- **clsx**: Conditional className utility
- **vaul**: Drawer component primitive
- **input-otp**: OTP input component