# BidStorm — Real-Time Auction Platform with Intelligent Recommendations

## Overview

BidStorm is a real-time auction platform where users can list items, bid in live auctions with sub-second updates, and receive personalized auction recommendations. The core engineering challenge is solving concurrency (simultaneous bids), real-time state synchronization, and building a hybrid recommendation engine that works with small datasets.

---

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- Zustand for global state (auth, socket, notifications)
- React Query (TanStack Query) for server state + caching
- Socket.io-client for real-time bidding
- Recharts for analytics dashboards
- React Router v6 for routing
- React Hook Form + Zod for form validation

### Backend
- Node.js + Express + TypeScript
- Socket.io for WebSocket layer
- MySQL2 (promise-based) for database
- JSON Web Tokens — access token (15min) + refresh token (7 days, httpOnly cookie, rotation on use)
- Multer + Sharp for image upload + resize
- node-cron for scheduled jobs (auction lifecycle)
- express-validator for input validation
- bcrypt for password hashing
- nodemailer for email notifications
- helmet + cors + express-rate-limit for security

### Database
- MySQL 8.0
- InnoDB engine (required for transactions + row-level locking)
- Full-text indexes for search
- Composite indexes for query performance
- Optimistic locking via version columns

---

## Project Structure

```
bidstorm/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI primitives (Button, Input, Modal, Toast, Badge)
│   │   │   ├── layout/          # Navbar, Sidebar, Footer, ProtectedRoute
│   │   │   ├── auction/         # AuctionCard, AuctionGrid, BidFeed, CountdownTimer, ImageCarousel
│   │   │   ├── recommendation/  # RecommendedCarousel, TrendingSection, SimilarAuctions
│   │   │   └── dashboard/       # Charts, StatsCards, ActivityTable
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── AuctionList.tsx
│   │   │   ├── AuctionDetail.tsx
│   │   │   ├── CreateAuction.tsx
│   │   │   ├── SellerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── Profile.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── useCountdown.ts
│   │   │   ├── useServerTime.ts
│   │   │   └── useDebounce.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── socketStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── services/
│   │   │   ├── api.ts            # Axios instance with interceptors for token refresh
│   │   │   ├── authService.ts
│   │   │   ├── auctionService.ts
│   │   │   ├── bidService.ts
│   │   │   └── recommendationService.ts
│   │   ├── types/
│   │   │   ├── auction.ts
│   │   │   ├── bid.ts
│   │   │   ├── user.ts
│   │   │   └── recommendation.ts
│   │   ├── utils/
│   │   │   ├── formatCurrency.ts
│   │   │   ├── formatTime.ts
│   │   │   └── cn.ts             # Tailwind class merge utility
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── auctionController.ts
│   │   │   ├── bidController.ts
│   │   │   ├── categoryController.ts
│   │   │   ├── recommendationController.ts
│   │   │   ├── watchlistController.ts
│   │   │   ├── reviewController.ts
│   │   │   └── adminController.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── auctionRoutes.ts
│   │   │   ├── bidRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── recommendationRoutes.ts
│   │   │   ├── watchlistRoutes.ts
│   │   │   ├── reviewRoutes.ts
│   │   │   └── adminRoutes.ts
│   │   ├── models/
│   │   │   ├── db.ts              # MySQL2 connection pool
│   │   │   ├── userModel.ts
│   │   │   ├── auctionModel.ts
│   │   │   ├── bidModel.ts
│   │   │   ├── categoryModel.ts
│   │   │   ├── interactionModel.ts
│   │   │   └── similarityModel.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts       # JWT verification, attaches req.user
│   │   │   ├── roleMiddleware.ts       # Role-based access (buyer, seller, admin)
│   │   │   ├── validationMiddleware.ts # express-validator chains
│   │   │   ├── uploadMiddleware.ts     # Multer config
│   │   │   ├── rateLimitMiddleware.ts
│   │   │   └── errorMiddleware.ts      # Centralized async error handler
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── biddingService.ts       # Core bidding logic with optimistic locking
│   │   │   ├── auctionLifecycleService.ts  # State machine transitions
│   │   │   ├── recommendationService.ts    # Hybrid recommendation engine
│   │   │   ├── fraudDetectionService.ts
│   │   │   ├── notificationService.ts
│   │   │   └── imageService.ts         # Sharp resize pipeline
│   │   ├── socket/
│   │   │   ├── socketManager.ts        # Socket.io server setup + auth
│   │   │   ├── auctionRoom.ts          # Room join/leave, bid broadcast, presence
│   │   │   └── events.ts              # Event name constants
│   │   ├── jobs/
│   │   │   ├── jobScheduler.ts         # Registers/re-registers cron jobs
│   │   │   ├── auctionStartJob.ts      # SCHEDULED → LIVE
│   │   │   ├── auctionEndJob.ts        # LIVE/EXTENDING → ENDED
│   │   │   ├── settlementCheckJob.ts   # Stale settlement detection
│   │   │   ├── similarityComputeJob.ts # Nightly recommendation matrix
│   │   │   └── trendingComputeJob.ts   # Every 15min trending score
│   │   ├── utils/
│   │   │   ├── AppError.ts            # Custom error class with statusCode
│   │   │   ├── catchAsync.ts          # Wraps async route handlers
│   │   │   ├── withOptimisticLock.ts   # Generic retry-on-version-conflict utility
│   │   │   ├── cosineSimilarity.ts
│   │   │   └── timeDecayScore.ts
│   │   ├── types/
│   │   │   ├── express.d.ts           # Extend Express Request with user
│   │   │   └── index.ts
│   │   ├── app.ts                     # Express app setup
│   │   └── server.ts                  # HTTP + Socket.io server start
│   ├── tsconfig.json
│   └── package.json
├── database/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_categories.sql
│   │   ├── 003_create_auctions.sql
│   │   ├── 004_create_auction_images.sql
│   │   ├── 005_create_bids.sql
│   │   ├── 006_create_watchlist.sql
│   │   ├── 007_create_user_category_preferences.sql
│   │   ├── 008_create_user_item_interactions.sql
│   │   ├── 009_create_item_similarity_cache.sql
│   │   ├── 010_create_notifications.sql
│   │   ├── 011_create_auction_comments.sql
│   │   ├── 012_create_seller_reviews.sql
│   │   ├── 013_create_fraud_signals.sql
│   │   ├── 014_create_bid_retractions.sql
│   │   ├── 015_create_auction_state_log.sql
│   │   ├── 016_create_refresh_tokens.sql
│   │   └── 017_create_payment_escrow.sql
│   ├── seeds/
│   │   ├── 01_categories.sql
│   │   ├── 02_users.sql
│   │   ├── 03_auctions.sql
│   │   └── 04_bids.sql
│   └── run_migrations.sh
├── uploads/                  # Gitignored, stores uploaded auction images
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## Database Schema

### users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reputation_score DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);
```

### categories
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug)
);
```

### auctions
```sql
CREATE TABLE auctions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  starting_price DECIMAL(12,2) NOT NULL,
  reserve_price DECIMAL(12,2),
  current_bid DECIMAL(12,2) DEFAULT 0.00,
  min_bid_increment DECIMAL(10,2) DEFAULT 1.00,
  bid_count INT DEFAULT 0,
  state ENUM('DRAFT','SCHEDULED','LIVE','EXTENDING','ENDED','SETTLING','COMPLETED') DEFAULT 'DRAFT',
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  original_end_time DATETIME NOT NULL,
  anti_snipe_seconds INT DEFAULT 30,
  extension_seconds INT DEFAULT 120,
  winner_id INT,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_state (state),
  INDEX idx_seller (seller_id),
  INDEX idx_category (category_id),
  INDEX idx_end_time (end_time),
  INDEX idx_state_end (state, end_time),
  FULLTEXT INDEX ft_search (title, description)
);
```

### auction_images
```sql
CREATE TABLE auction_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  INDEX idx_auction (auction_id)
);
```

### bids
```sql
CREATE TABLE bids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  bidder_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  bid_version INT NOT NULL,
  ip_address VARCHAR(45),
  is_winning BOOLEAN DEFAULT FALSE,
  is_retracted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auction_amount (auction_id, amount DESC),
  INDEX idx_bidder (bidder_id),
  INDEX idx_auction_created (auction_id, created_at DESC)
);
```

### watchlist
```sql
CREATE TABLE watchlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  auction_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_auction (user_id, auction_id)
);
```

### user_category_preferences
```sql
CREATE TABLE user_category_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  preference_score DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_category (user_id, category_id)
);
```

### user_item_interactions
```sql
CREATE TABLE user_item_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  auction_id INT NOT NULL,
  interaction_type ENUM('view', 'watchlist', 'bid', 'won') NOT NULL,
  weight DECIMAL(3,1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_auction (auction_id),
  INDEX idx_type (interaction_type)
);
-- Interaction weights: view=1.0, watchlist=3.0, bid=5.0, won=8.0
```

### item_similarity_cache
```sql
CREATE TABLE item_similarity_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id_a INT NOT NULL,
  auction_id_b INT NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id_a) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id_b) REFERENCES auctions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_pair (auction_id_a, auction_id_b),
  INDEX idx_auction_a_score (auction_id_a, similarity_score DESC)
);
-- Only store top 20 similar items per auction. Recomputed nightly.
```

### notifications
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('outbid', 'auction_won', 'auction_ending', 'auction_started', 'payment_reminder', 'fraud_alert') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  reference_id INT,
  reference_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at DESC)
);
```

### auction_comments
```sql
CREATE TABLE auction_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_question BOOLEAN DEFAULT FALSE,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES auction_comments(id) ON DELETE CASCADE,
  INDEX idx_auction (auction_id)
);
```

### seller_reviews
```sql
CREATE TABLE seller_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  auction_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (reviewer_id, auction_id)
);
```

### fraud_signals
```sql
CREATE TABLE fraud_signals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  signal_type ENUM('same_ip', 'min_increment_pattern', 'bid_retract_pattern', 'new_account_high_value', 'velocity_spike') NOT NULL,
  description TEXT NOT NULL,
  risk_score DECIMAL(3,2) NOT NULL,
  flagged_user_id INT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (flagged_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_auction_risk (auction_id, risk_score DESC),
  INDEX idx_unresolved (is_resolved, risk_score DESC)
);
```

### bid_retractions
```sql
CREATE TABLE bid_retractions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bid_id INT NOT NULL,
  auction_id INT NOT NULL,
  user_id INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auction_user (auction_id, user_id)
);
```

### auction_state_log
```sql
CREATE TABLE auction_state_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  from_state VARCHAR(20),
  to_state VARCHAR(20) NOT NULL,
  triggered_by ENUM('system', 'seller', 'admin', 'anti_snipe') NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  INDEX idx_auction (auction_id)
);
```

### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_user (user_id)
);
```

### payment_escrow
```sql
CREATE TABLE payment_escrow (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_gateway_id VARCHAR(255),
  status ENUM('pending', 'paid', 'released', 'refunded', 'disputed') DEFAULT 'pending',
  paid_at DATETIME,
  released_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_auction (auction_id)
);
```

---

## API Routes

### Auth — `/api/auth`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/register` | Register with email, password, username, full_name | No |
| POST | `/login` | Returns access token + sets refresh token cookie | No |
| POST | `/refresh` | Rotate refresh token, return new access token | Cookie |
| POST | `/logout` | Revoke refresh token | Yes |
| GET | `/me` | Get current user profile | Yes |
| PATCH | `/me` | Update profile (username, full_name, avatar) | Yes |
| POST | `/verify/:token` | Verify email address | No |

### Auctions — `/api/auctions`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | List auctions with filters, search, cursor pagination | No |
| GET | `/:id` | Get auction detail with images, bid count, current price | No |
| POST | `/` | Create auction (seller only) | Seller |
| PATCH | `/:id` | Update auction (only in DRAFT state) | Seller+Owner |
| DELETE | `/:id` | Delete auction (only in DRAFT state) | Seller+Owner |
| POST | `/:id/images` | Upload images (max 5, multipart) | Seller+Owner |
| DELETE | `/:id/images/:imageId` | Remove an image | Seller+Owner |
| GET | `/:id/comments` | Get auction comments/questions | No |
| POST | `/:id/comments` | Add comment or question | Yes |

### Bids — `/api/bids`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/auctions/:id/bid` | Place bid (optimistic lock + transaction) | Yes |
| GET | `/auctions/:id/bids` | Get bid history for auction | No |
| POST | `/bids/:id/retract` | Retract bid (with reason, limited window) | Yes+Owner |
| GET | `/my-bids` | Get all bids by current user | Yes |

### Watchlist — `/api/watchlist`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | Get user's watchlist | Yes |
| POST | `/:auctionId` | Add to watchlist | Yes |
| DELETE | `/:auctionId` | Remove from watchlist | Yes |

### Categories — `/api/categories`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | List all categories | No |
| POST | `/preferences` | Set user category preferences (onboarding) | Yes |
| GET | `/preferences` | Get user's category preferences | Yes |

### Recommendations — `/api/recommendations`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/for-you` | Personalized recommendations (hybrid engine) | Yes |
| GET | `/trending` | Trending auctions by time-decay score | No |
| GET | `/similar/:auctionId` | Similar auctions from similarity cache | No |

### Reviews — `/api/reviews`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/sellers/:sellerId` | Leave review (only if won auction from seller) | Yes |
| GET | `/sellers/:sellerId` | Get seller's reviews | No |

### Admin — `/api/admin`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/fraud-signals` | List flagged auctions by risk score | Admin |
| PATCH | `/fraud-signals/:id/resolve` | Mark signal as resolved | Admin |
| POST | `/auctions/:id/suspend` | Suspend an auction | Admin |
| POST | `/users/:id/suspend` | Suspend a user | Admin |
| GET | `/analytics/overview` | Platform-wide analytics | Admin |

---

## WebSocket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_auction` | `{ auctionId }` | Join auction room |
| `leave_auction` | `{ auctionId }` | Leave auction room |
| `request_time_sync` | `{}` | Request server timestamp |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_bid` | `{ bidId, amount, bidderUsername, bidCount, timestamp }` | Broadcast to room on new bid |
| `bid_retracted` | `{ bidId, newCurrentBid }` | Broadcast on bid retraction |
| `auction_state_change` | `{ auctionId, newState, endTime? }` | State transition broadcast |
| `timer_sync` | `{ serverTime, endTime }` | Periodic time sync (every 30s) |
| `watcher_update` | `{ auctionId, watcherCount }` | Updated presence count |
| `outbid_alert` | `{ auctionId, auctionTitle, newAmount }` | Sent only to the outbid user |
| `anti_snipe_extension` | `{ auctionId, newEndTime, extensionSeconds }` | Auction time extended |
| `auction_ended` | `{ auctionId, winnerId, winningBid }` | Auction has concluded |

---

## Recommendation Algorithm Detail

### Interaction Weights
```
VIEW        = 1.0
WATCHLIST   = 3.0
BID         = 5.0
WON         = 8.0
```

### Cold Start (< 5 interactions)
1. Use user's `user_category_preferences` from onboarding
2. Query: LIVE auctions in preferred categories, ORDER BY (end_time ASC, bid_count DESC)
3. Boost auctions ending within 2 hours (urgency signal)

### Collaborative Filtering (≥ 5 interactions)
1. Build user-item interaction vectors from `user_item_interactions`
2. For each pair of auctions (A, B), compute cosine similarity:
   ```
   similarity(A, B) = Σ(w_user_A * w_user_B) / (√Σ(w_user_A²) * √Σ(w_user_B²))
   ```
   where w = interaction weight for each user who interacted with both items
3. Store top 20 most similar items per auction in `item_similarity_cache`
4. Recompute nightly via `similarityComputeJob`

### Recommendation Generation
1. Get all auctions the user has interacted with
2. For each, look up similar auctions from `item_similarity_cache`
3. Filter out: auctions user already interacted with, ended auctions, user's own auctions
4. Rank by: `similarity_score * interaction_weight_of_source_item`
5. Deduplicate and return top 20

### Trending Score
```
score = bid_count * e^(-0.1 * hours_since_last_bid)
```
Recomputed every 15 minutes. Stored as a computed column or in a trending cache table.

---

## Core Engineering Patterns

### Optimistic Locking (Bidding)
```typescript
// Pseudocode for the bid flow
async function placeBid(auctionId: number, bidderId: number, amount: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Read current state with lock
    const [auction] = await connection.query(
      'SELECT id, current_bid, min_bid_increment, state, seller_id, end_time, version FROM auctions WHERE id = ? FOR UPDATE',
      [auctionId]
    );

    // 2. Validate
    if (auction.state !== 'LIVE' && auction.state !== 'EXTENDING') throw new AppError('Auction not active', 400);
    if (auction.seller_id === bidderId) throw new AppError('Cannot bid on own auction', 403);
    if (amount < auction.current_bid + auction.min_bid_increment) throw new AppError('Bid too low', 400);

    // 3. Update with version check
    const [result] = await connection.query(
      'UPDATE auctions SET current_bid = ?, bid_count = bid_count + 1, version = version + 1 WHERE id = ? AND version = ?',
      [amount, auctionId, auction.version]
    );
    if (result.affectedRows === 0) throw new AppError('Concurrent bid conflict, retry', 409);

    // 4. Insert bid record
    await connection.query(
      'INSERT INTO bids (auction_id, bidder_id, amount, bid_version, ip_address) VALUES (?, ?, ?, ?, ?)',
      [auctionId, bidderId, amount, auction.version + 1, ipAddress]
    );

    // 5. Anti-snipe check
    const secondsRemaining = (new Date(auction.end_time).getTime() - Date.now()) / 1000;
    if (secondsRemaining <= auction.anti_snipe_seconds) {
      const newEndTime = new Date(Date.now() + auction.extension_seconds * 1000);
      await connection.query('UPDATE auctions SET end_time = ?, state = "EXTENDING" WHERE id = ?', [newEndTime, auctionId]);
      // Reschedule end job
      // Broadcast anti_snipe_extension event
    }

    await connection.commit();

    // 6. Broadcast via Socket.io (after commit)
    // 7. Send outbid notification to previous high bidder
    // 8. Record interaction for recommendations

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
```

### Auction State Machine Transitions
```
DRAFT       → SCHEDULED    (seller publishes, start_time in future)
SCHEDULED   → LIVE         (system job, start_time reached)
LIVE        → EXTENDING    (anti-snipe triggered)
EXTENDING   → LIVE         (extension period elapsed without new bid — conceptually stays EXTENDING until end)
EXTENDING   → ENDED        (extension period elapsed)
LIVE        → ENDED        (end_time reached, no anti-snipe)
ENDED       → SETTLING     (winner determined, payment pending)
SETTLING    → COMPLETED    (payment received)
SETTLING    → ENDED        (payment timeout, offer to next bidder)
Any         → DRAFT        (admin suspends, only from SCHEDULED)
```

### Anti-Snipe Logic
```
IF (bid placed) AND (end_time - now < anti_snipe_seconds):
  new_end_time = now + extension_seconds
  state = EXTENDING
  reschedule auction end job to new_end_time
  broadcast anti_snipe_extension to room
```

---

## Conventions

- Use async/await everywhere, no raw callbacks
- All DB queries use parameterized prepared statements (SQL injection prevention)
- Every API route has input validation middleware (express-validator)
- Error handling via centralized error middleware — controllers never have try-catch
- Use the `catchAsync` wrapper for all async route handlers
- Use `AppError` class for all operational errors (includes statusCode)
- TypeScript strict mode in both client and server
- Environment variables via dotenv, never hardcode secrets
- Use MySQL transactions for any multi-table writes
- Optimistic locking on auctions table using `version` column
- All socket events are authenticated (verify JWT on connection)
- Images are stored in `/uploads/auctions/:auctionId/` with UUID filenames
- All monetary values use DECIMAL(12,2), never float
- Timestamps: MySQL DATETIME for business times, TIMESTAMP for audit fields
- API responses follow consistent shape: `{ success: boolean, data?: T, error?: string, message?: string }`

---

## Environment Variables (.env)

```
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=bidstorm_user
DB_PASSWORD=
DB_NAME=bidstorm

# Auth
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
MAX_FILES_PER_AUCTION=5

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@bidstorm.com

# Client
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Seed Data Categories

1. Electronics & Gadgets
2. Collectibles & Art
3. Fashion & Accessories
4. Home & Garden
5. Sports & Outdoors
6. Books & Media
7. Vehicles & Parts
8. Jewelry & Watches
9. Antiques & Vintage
10. Gaming & Consoles

---

## Build Phases & Acceptance Criteria

### Phase 1 — Scaffolding + Schema
**Prompt:** Initialize the monorepo with client and server directories. Set up all configs. Create all 17 migration files and seed files. Write `run_migrations.sh` that executes them in order.

**Done when:**
- `npm run dev` works in both client and server
- All 17 tables exist in MySQL with correct indexes and foreign keys
- Seed data is loadable
- TypeScript compiles with zero errors

### Phase 2 — Authentication System
**Prompt:** Build the complete auth system per the API routes table. Include JWT access + refresh rotation, role middleware, email verification (token stored in DB, verified via GET), and the React frontend pages (Login, Register) with form validation (React Hook Form + Zod). Axios interceptor should auto-refresh on 401.

**Done when:**
- Can register, verify email, login, and receive tokens
- Refresh token rotation works (old token invalidated on use)
- Protected routes reject unauthenticated requests with 401
- Role middleware correctly restricts by role
- Frontend stores auth state in Zustand, persists across refresh via token refresh

### Phase 3 — Auction CRUD + Images
**Prompt:** Build auction creation, listing, detail, update, delete per API routes. Image upload with Multer (max 5 per auction) + Sharp (resize to 800x600 thumbnail + 1200px full). Listing page with category filter, price range filter, status filter, full-text search, cursor-based pagination (20 per page). Seller dashboard page showing their auctions grouped by state.

**Done when:**
- Seller can create auction with images in DRAFT state
- Can update/delete only own DRAFT auctions
- Listing page loads with all filters working
- Full-text search returns relevant results
- Pagination cursor works correctly (no duplicate/missing items)
- Images are resized and served correctly

### Phase 4 — Real-Time Bidding Engine
**Prompt:** Build the bidding system with optimistic locking per the engineering pattern documented above. Set up Socket.io with JWT auth on connection. Implement auction rooms with all events documented in the WebSocket Events table. Build the anti-snipe extension logic. Frontend: live bid feed, bid input with validation, countdown timer synced with server time, outbid toast notifications, watcher count badge.

**Done when:**
- Two users bidding simultaneously: only valid bids succeed, stale version gets 409
- All connected clients see new bids in under 1 second
- Anti-snipe correctly extends auction when bid arrives in last 30 seconds
- Countdown timer stays in sync (max 1s drift)
- Outbid user receives notification even when viewing a different page
- Watcher count updates on join/leave

### Phase 5 — Scheduled Jobs + Lifecycle
**Prompt:** Build the job scheduler using node-cron. Implement SCHEDULED→LIVE and LIVE/EXTENDING→ENDED transitions triggered by time. On ENDED: determine winner (highest bid ≥ reserve_price), create payment_escrow record, send notifications. Build settlement timeout check (48h). All jobs must be idempotent. On server restart, re-register jobs for all active auctions by querying DB.

**Done when:**
- Auctions automatically go LIVE at start_time
- Auctions automatically END at end_time
- Winner is correctly determined and notified
- Server restart doesn't lose scheduled jobs
- State transitions are logged in auction_state_log
- Re-running a job doesn't corrupt data (idempotent)

### Phase 6 — Recommendation Engine
**Prompt:** Build the hybrid recommendation system per the algorithm detail above. Track all interactions (view, watchlist, bid, won) from relevant endpoints. Implement content-based cold start from category preferences. Build the nightly similarity computation job. Create the /recommendations API routes. Frontend: "Recommended For You" carousel on home, "Trending Now" section, "Similar Auctions" on detail page.

**Done when:**
- New users (< 5 interactions) see category-based recommendations
- Users with 5+ interactions see collaborative filtering results
- Similarity cache is populated by nightly job
- Trending scores update every 15 minutes
- Similar auctions show on auction detail page
- Empty states handled gracefully (not enough data yet)

### Phase 7 — Fraud Detection + Analytics + Polish
**Prompt:** Build fraud signal detection (same IP, min increment patterns, bid-retract patterns, new account high value). Build admin dashboard with flagged auctions and user suspension. Build seller analytics dashboard with Recharts (revenue line chart, bid activity by hour, category breakdown). Add rate limiting on bid endpoint (max 5 bids/minute/user). Add helmet, CORS config, input sanitization. Add error boundaries in React.

**Done when:**
- Shill bidding patterns are flagged with risk scores
- Admin can view flags, resolve them, suspend users/auctions
- Seller sees meaningful analytics charts
- Rate limiting prevents bid spam
- Security headers are set
- App handles errors gracefully in both frontend and backend

---

## Current Phase

Phase 1 — Project scaffolding and database schema

---

## Working Agreements

- After building or scaffolding any web app or game, always output the exact command to run it and the local URL to open (e.g., 'Run `npm run dev`, then open http://localhost:5173').
- When verifying game or UI fixes, use Playwright A/B tests to confirm the behavior before reporting done.
- Preferred stack for new projects: React + Vite + Tailwind (frontend), Node.js (backend); use Three.js for 3D games.
