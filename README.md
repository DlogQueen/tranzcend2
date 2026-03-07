# Tranzcend

Welcome to Tranzcend, the premier sanctuary for the trans community and those who adore them. This is a social media platform designed for connection, sharing, and thriving in a safe and verified environment.

## Features

- **User Profiles:** Create a profile, add a bio, and link your social media accounts.
- **Discovery:** Find other users nearby or through the social feed.
- **Friend System:** Send and receive friend requests to connect with others.
- **Posts:** Share your thoughts and experiences with the community.
- **Creator Tools:** Verified creators can go live, post exclusive content, and more.
- **Admin Dashboard:** Admins can manage creator requests and view platform statistics.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Supabase (Authentication, Database, Storage)
- **Testing:** Vitest, React Testing Library

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up your environment variables:**

   Create a `.env` file in the root of the project and add your Supabase URL and anon key:

   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Run tests:**

   ```bash
   npm test
   ```

## Project Structure

- `src/components`: Reusable UI components.
- `src/context`: React context providers (e.g., `AuthProvider`).
- `src/hooks`: Custom React hooks for data fetching and other logic.
- `src/lib`: Supabase client configuration.
- `src/pages`: Application pages.
- `src/styles`: Global CSS styles.
- `src/test`: Test setup and configuration.
- `src/types`: TypeScript type definitions.
