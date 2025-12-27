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

## 💰 Revenue & Monetization Options

### 1. Affiliate Marketing (Primary)
- Integrate **Amazon Associates** or other affiliate networks.
- Earn a commission on every successful purchase made through the "View on Amazon" links.

### 2. Sponsored "First Card" Placements
- Allow brands to pay for "Boosted" visibility.
- Their product appears as the guaranteed 1st or 2nd card in a user's session for specific categories.

### 3. Vibe Premium (Subscription)
- Unlimited wishlists and custom list folders.
- Advanced AI Gift Assistant: A chatbot that sifts through the data and suggests a "Vibe Match" based on a recipient's social profile.
- Ad-free browsing experience.

### 4. Data Insights for Brands
- Provide anonymized data to retailers about which products are being "Liked" vs. "Noped" in high volume.
- Help brands understand current gifting trends before they hit the mainstream.

### 5. "Group Gift" Surcharge
- Integrate a checkout system where friends can split the cost of a gift directly in the app.
- Take a small transaction fee (1-2%) for the convenience of group coordination.

---

## 🛠 Technical Considerations
- **Database Migration**: Move away from `localStorage` to a persistent database (PostgreSQL/Supabase) to support multi-user features.
- **Real-time**: Implement WebSockets or Supabase Realtime for instant "Double Match" notifications.
- **Analytics**: implement tracking for swipes to power the "Trending" algorithm.
