# Overview

This is a comprehensive leave management system for educational institutions, built as a full-stack web application. The system allows students to submit leave requests, teachers and heads of department (HODs) to review and approve/reject requests, and administrators to manage users and department assignments. The application features role-based access control with four distinct user types: students, teachers, HODs, and administrators.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based authentication with protected routes

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Management**: Express sessions with PostgreSQL store
- **Password Security**: Built-in crypto module with scrypt hashing
- **API Design**: RESTful endpoints with role-based authorization middleware
- **Error Handling**: Centralized error handling with custom error responses

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Structure**: 
  - Users table with role-based access (student, teacher, hod, admin)
  - Leave requests with status tracking and approval workflow
  - Department assignments linking users to departments and years
- **Data Validation**: Zod schemas for type-safe data validation
- **Migration Management**: Drizzle Kit for database migrations

## Authentication & Authorization
- **Session-based Authentication**: Uses Express sessions with PostgreSQL backing
- **Role-based Access Control**: Four user roles with different permissions
- **Password Security**: Scrypt-based password hashing with salt
- **Protected Routes**: Frontend route protection based on authentication status
- **API Authorization**: Middleware-based role checking for API endpoints

## Code Organization
- **Monorepo Structure**: Shared TypeScript schemas between client and server
- **Client Directory**: Contains React frontend with components, pages, and utilities
- **Server Directory**: Express backend with routes, authentication, and database logic
- **Shared Directory**: Common TypeScript types and Zod schemas
- **Component Structure**: Organized UI components with shadcn/ui integration

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Connection**: Uses WebSocket constructor for serverless compatibility

## UI Components
- **Radix UI**: Comprehensive set of unstyled, accessible React components
- **shadcn/ui**: Pre-styled components built on Radix UI with Tailwind CSS
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool with HMR and development server
- **TypeScript**: Static type checking with strict configuration
- **ESBuild**: Production bundling for server-side code
- **Replit Integration**: Development environment with runtime error handling

## Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Crypto Module**: Node.js built-in cryptography for password hashing

## Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **date-fns**: Date manipulation and formatting utilities
- **React Hook Form**: Form state management with validation integration