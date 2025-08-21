# Overview

This is a modern MTG (Magic: The Gathering) deck builder application that allows users to create, manage, and organize their Magic card decks. The application features a mobile-first design with card search functionality, deck management, and integration with the Scryfall API for comprehensive Magic card data.

The application follows a full-stack architecture with a React frontend and Express backend, designed to provide an intuitive deck building experience for Magic: The Gathering players.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui for consistent, accessible design system
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **API Design**: RESTful API architecture with structured endpoints for decks and cards
- **Data Validation**: Zod schemas for request/response validation and type inference
- **Development**: Hot module replacement with Vite integration for seamless development

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Development Storage**: In-memory storage implementation for development/testing
- **Connection**: Neon Database serverless PostgreSQL for production deployment

## Database Schema
- **Decks Table**: Stores deck information including name, format, description, mainboard/sideboard cards, color identity, tags, and visibility settings
- **Card Data**: JSON storage for card information with support for complex MTG card data structures
- **Timestamps**: Automatic creation and update tracking for all deck records

## External Dependencies

### Third-Party APIs
- **Scryfall API**: Primary source for Magic: The Gathering card data, images, and metadata
- **Rate Limiting**: Built-in request throttling to respect Scryfall API limits (100ms between requests)

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library built on Radix UI with consistent styling
- **Lucide React**: Icon library for consistent iconography throughout the application

### Development and Build Tools
- **TypeScript**: Static type checking across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **PostCSS**: CSS processing with autoprefixer for browser compatibility
- **ESBuild**: Fast JavaScript bundler for production builds

### Database and ORM
- **Drizzle ORM**: Type-safe SQL toolkit and ORM for TypeScript
- **Neon Database**: Serverless PostgreSQL platform for cloud deployment
- **pg (node-postgres)**: PostgreSQL client for Node.js database connections

### Utility Libraries
- **date-fns**: Modern JavaScript date utility library for date formatting and manipulation
- **clsx & tailwind-merge**: Utility functions for conditional CSS class management
- **nanoid**: Secure, URL-safe, unique string ID generator