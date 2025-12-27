# Vibe - Technical Documentation

This document provides a deep dive into the architecture, technology stack, and recommendation logic powering the Vibe application.

---

## 🏗️ System Architecture

Vibe is built as a **Full-Stack Next.js Application** utilizing a hybrid data model for high performance and personalized discovery.

### 1. The Technology Stack
-   **Core**: [Next.js 15+](https://nextjs.org/) with App Router (Server & Client Components).
-   **Database**: **PostgreSQL** for persistence, managed through **Prisma ORM**.
-   **Authentication**: **NextAuth.js** (v4/v5) implementing Google OAuth.
-   **Frontend State**: 
    -   `LocalStorage` for guest persistence and "Nope" lists.
    -   `React Hooks` for real-time swipe state management.
-   **UI & Animations**:
    -   **Tailwind CSS 4**: For high-performance, utility-first styling.
    -   **Framer Motion**: Powering the Tinder-style swipe physics and spring-based card interactions.
-   **APIs**:
    -   **RapidAPI (Real-time Amazon Data)**: The primary source for product discovery.

---

## 🧬 Recommendation Engine (The "Secret Sauce")

Vibe uses a **Weighted Content-Based Filtering** algorithm to personalize the gift feed without requiring millions of users.

### A. Preference Tracking
Every user interaction (Swipe) is treated as a training signal for the algorithm:
-   **Like (Swipe Right)**: Increases the weight for that product's category by `+1.0`.
-   **Nope (Swipe Left)**: Decreases the weight for that category by `-0.5` (clamped at a minimum of `0.1` to preserve variety).

These scores are saved in the `CategoryScore` table for authenticated users or in `localStorage` for guests.

### B. The Weighted Shuffle Algorithm
When a user requests products, the backend performs the following steps:
1.  **Hard Filters**: Products are strictly filtered based on:
    -   **Price**: User-defined `minPrice` to `maxPrice`.
    -   **Ratings**: Minimum star rating (e.g., 4.0+ stars).
    -   **Social Proof**: Minimum review count (e.g., 1,000+ reviews).
2.  **Scoring**: Each product is assigned a dynamic score using the formula:
    $$Score = (CategoryWeight) \times (RandomFactor + 0.5)$$
3.  **Shuffle**: The products are sorted by this score in descending order.
4.  **Spread Sort (Smart Interleaving)**: Finally, to prevent "clumping" (e.g., 5 tech items in a row), a greedy lookahead algorithm post-processes the list:
    -   It builds the final feed by continually picking the highest-scoring item from the candidate pool that is **different** from the previously picked category.
    -   This ensures variety is forced even if one category has overwhelmingly high personalization scores.

---

## ⚡ Data Management & Quota Optimization

To handle the strict 100-request/month limit on the Amazon API, Vibe implements a **Rolling Smart Cache**:

### 1. Multi-Category Refresh
The app maintains separate cache buckets for 6 distinct gift categories (Tech, Fashion, Wellness, etc.). Instead of refreshing everything at once, the API identifies **exactly one** stale category bucket (>24 hours old) per request and refreshes just that one.

### 2. Global deduplication
The app tracks `RejectedIds` (Nopes) and `WishlistIds` (Likes) to ensure that once a user has interacted with a product, it is filtered out of their feed permanently, preventing redundant "swipes."

### 3. Variability & Growth (The "Vibe Catalog")
To solve "Cache Amnesia" (Vercel resets) and "API Quota Limits," we migrated from a file-based cache to a **Persistent Database Catalog**.
-   **Permanent Library**: Products fetched from Amazon are saved to a PostgreSQL `Product` table. They persist indefinitely, building a massive library over time.
-   **Lazy Seeding**: The API only calls RapidAPI if a category in the DB is "empty" (count < 50). Once seeded, it serves millions of users with **zero API costs**.
-   **Global Interleaving**: Since the DB holds all categories permanently, the "Spread Sort" algorithm now has access to a much wider pool of candidates, ensuring robust interleaving even for new users.

---

## 🔄 Hybrid Data Sync Model

Vibe allows for an "instant-start" guest experience while providing robust account persistence:
-   **Guests**: Data lives in `localStorage`. 
-   **Sign-In**: Upon Google login, the `useUserData` hook merges existing local swipes into the database.
-   **Authored Requests**: Once logged in, the application prioritizes database records over local storage, allowing a seamless transition between mobile and desktop.

---

## 🔒 Security & Performance
-   **Edge Compatible**: API routes are designed to run on Vercel's Edge/Serverless runtime.
-   **Prisma Client Singleton**: Implemented to prevent "Too many connections" errors common in Serverless environments.
-   **Image Optimization**: Uses Next.js Image component with restrictive hostname white-listing for optimized CDN delivery of Amazon product photos.

---

## 📱 UI & Responsive Design Strategy

Vibe employs a custom "Mobile-First Rebalance" to maximize info-density and usability:

### 1. Vertical Space Optimization
On mobile devices (like iPhone 13/14/15 Pro), the app uses a **2:3 Card Aspect Ratio** and **Dynamic Viewport Height (`h-[100dvh]`)**. The main content is anchored using `justify-start` with a strictly defined top-padding (`pt-32`). This prevents mobile browser address bars from shifting the vertical center and pushing cards into the fixed header.

### 2. Dual-Focus Layout
Inside each card, the space is split **50/50** between the **Product Image** and the **Product Description**:
-   **Image (Top 50%)**: Uses `object-contain` on a clean white background to make the product "pop."
-   **Description (Bottom 50%)**: Features an overflow-aware typography system that scales font size based on title length, ensuring complex Amazon product names remain readable without being cut off.

### 3. Visual Feedback
Instead of text labels, high-visibility **Green Check** and **Red X** overlays provide instantaneous, non-linguistic feedback during gestures, improving the "game-like" feel of the discovery process.

