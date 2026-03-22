# HabitFlow 🚀

HabitFlow is a robust, full-stack Goal and Habit Tracking application designed for real-time progress monitoring, check-ins, streaks calculation, and detailed visual analytics. It runs on a powerful monorepo architecture leveraging Turborepo, Next.js, tRPC, Prisma, and Better Auth.

## Features ✨

- **Goal & Habit Tracker**: Easily define daily, weekly, or monthly tracking targets.
- **Interactive Check-off Calendar**: Rapidly verify tasks in a sleek visual calendar with optimistic UI updates.
- **Dynamic Streak System**: Instantly calculate and display your current and longest streaks.
- **Visual Analytics Dashboard**: View completion trends and historical data via intuitive charts (using Recharts).
- **Secure Authentication**: Built with Better Auth for robust user, session, and credential management.
- **Optimized UI/UX**: Crafted with Shadcn UI, Tailwind CSS, and Framer Motion micro-animations.

## Tech Stack 🛠️

- **Framework**: Next.js 15 (App Router)
- **Architecture**: Turborepo Monorepo
- **API**: tRPC (Type-safe Client & Server)
- **Database**: Prisma ORM, SQLite (local.db)
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui (Radix Primitives), Lucide React
- **Validation**: Zod & React Hook Form
- **Data Visualization**: Recharts
- **Date Utilities**: date-fns

## Getting Started 🚀

### 1. Setup Instructions

Clone the repository and install dependencies:

`ash
npm install
`

Configure your environment variables by copying the example file:

`ash
cp .env.example .env
`

Initialize your database schema by pushing the Prisma schema:

`ash
npm run db:push
`

### 2. Development Server

Start the application locally:

`ash
npm run dev
`

Visit http://localhost:3000 to interact with your local instance of HabitFlow!

## Project Structure 📁

- pps/web/: The frontend application built with Next.js 15 App router.
- packages/api/: tRPC setup and all query/mutation routers.
- packages/db/: Prisma schemas (schema.prisma, uth.prisma, goals.prisma).
- packages/auth/: Better Auth integration code.
- packages/env/: Shared types and environment definitions.
