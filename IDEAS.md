# Vibe - Notes & Ideas

This document tracks upcoming features and brainstormed ideas for the Vibe gift discovery platform.

## 🚀 Future Roadmap

### 1. Multiple Wishlists
- Allow users to create and name different wishlists (e.g., "Birthday Ideas for Mom", "Office Secret Santa", "Personal Tech").
- Ability to move items between different lists.

### 2. Popularity-Based Frequency
- Track product "likes" across all users (requires a backend database like Supabase or MongoDB).
- Items with higher like counts should surface more frequently in the swipe deck to create a "trending" effect.

### 3. Social Integration & Match Notifications
- **Friends System**: Connect with friends on Vibe.
- **Double Match**: If you and a friend both swipe right (Like) on the same product, trigger a real-time notification.
- "X and Y liked this" badges on popular items.

---

## 🛠 Technical Considerations
- **Database Migration**: Move away from `localStorage` to a persistent database (PostgreSQL/Supabase) to support multi-user features.
- **Real-time**: Implement WebSockets or Supabase Realtime for instant "Double Match" notifications.
- **Analytics**: implement tracking for swipes to power the "Trending" algorithm.
