# Vibe 🎁

**Vibe** is a Tinder-style gift discovery application that makes finding the perfect gift addictive and effortless. Browse through curated products, swipe right to save them to your wishlist, and let the recommendation engine learn your "vibe" over time.

## ✨ Features

-   **Tinder-style Swiping**: Use smooth, fluid gestures (Framer Motion) with visual "Like/Nope" feedback to discover interesting products.
-   **Expert Discovery Filters**: Sort and filter by **Price**, **Star Rating** (4.0+, 4.5+), and **Review Count** (100+, 1k+, 5k+) to find only the best products.
-   **Smart Content-Based Filtering**: The more you swipe, the better it gets. The app tracks your category preferences and weights your product feed accordingly.
-   **Multi-Category Discovery**: Fetches real-time data across Tech, Home, Fashion, Wellness, Hobbies, and Workspace.
-   **Unified Account Management**: A single profile header to manage your Google session and access your persistent wishlist.
-   **Persistent Backend**: Powered by PostgreSQL and Prisma for fast, reliable data storage.
-   **Real-Time Data**: Integrates with the Amazon Real-Time Data API for up-to-date pricing and ratings.

## 🛠️ Technical Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Database**: PostgreSQL
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google Provider)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### 1. Prerequisites

-   Node.js 18.x or later
-   A PostgreSQL database (Supabase, Neon, or Vercel Postgres)
-   A RapidAPI Key for [Real-Time Amazon Data](https://rapidapi.com/rockosrockos/api/real-time-amazon-data)
-   Google OAuth Credentials (from Google Cloud Console)

### 2. Environment Variables

Create a `.env` file in the root directory and add the following:

```bash
# Database connection string
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth configuration
NEXTAUTH_SECRET="your_secret_generated_via_openssl"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"

# Amazon API
RAPIDAPI_KEY="your_rapid_api_key"
```

### 3. Setup

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start swiping!

## 📜 Future Roadmap

Check out our [IDEAS.md](./IDEAS.md) for planned features including group gift splitting, popularity-based frequency, and social integration.
