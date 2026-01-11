# Magic Board Training Mobile App - Implementation Plan

**Project:** mb-mobile-training  
**Created:** January 10, 2025  
**Tech Stack:** React Native + Expo (matching mb-mobile)

---

## Tech Stack Analysis (from mb-mobile)

### Core Framework
- **Expo SDK:** ~54.0.13 (with new architecture enabled)
- **React:** 19.1.0
- **React Native:** 0.81.4

### Navigation
- **@react-navigation/native:** ^6.1.9
- **@react-navigation/native-stack:** ^6.9.17
- **@react-navigation/bottom-tabs:** ^6.6.1

### Additional Libraries
- **expo-status-bar:** ~3.0.8
- **react-native-safe-area-context:** ~5.6.0
- **react-native-screens:** ~4.16.0

### Architecture Patterns (from mb-mobile)
- **Context API** for state management (GameStateContext, BLEConnectionContext)
- **Service Layer** for business logic (BluetoothService)
- **Component-based UI** with functional components and hooks
- **Screen-based navigation** with stack and tab navigators

---

## Project Goals

### Primary Objective
Create a mobile training app that allows users to:
1. Browse and discover training plans
2. Start and complete training sessions
3. Track progress, XP, levels, and achievements
4. Manage streaks and weekly goals
5. View training history and statistics
6. Participate in gamification features

### Key Differentiators from mb-mobile
- **mb-mobile:** Bluetooth-focused, board control, real-time game interaction
- **mb-mobile-training:** API-focused, cloud-based training, gamification, progress tracking

---

## Architecture Design

### Folder Structure

```
mb-mobile-training/
├── App.js                          # Main app entry with navigation
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── index.js                        # Entry point
├── assets/                         # Images, icons, fonts
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
├── src/
│   ├── screens/                    # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   └── ProfileSetupScreen.js
│   │   ├── home/
│   │   │   ├── HomeScreen.js       # Dashboard with stats
│   │   │   └── NotificationsScreen.js
│   │   ├── training/
│   │   │   ├── BrowsePlansScreen.js
│   │   │   ├── PlanDetailsScreen.js
│   │   │   ├── ActiveSessionScreen.js
│   │   │   └── SessionHistoryScreen.js
│   │   ├── progress/
│   │   │   ├── ProgressScreen.js   # XP, levels, stats
│   │   │   ├── AchievementsScreen.js
│   │   │   ├── StreakScreen.js
│   │   │   └── WeeklyGoalScreen.js
│   │   └── profile/
│   │       ├── ProfileScreen.js
│   │       ├── SettingsScreen.js
│   │       └── TeamsScreen.js
│   ├── components/                 # Reusable components
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Input.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── ErrorMessage.js
│   │   ├── training/
│   │   │   ├── PlanCard.js
│   │   │   ├── SessionTimer.js
│   │   │   ├── TaskList.js
│   │   │   └── DifficultyBadge.js
│   │   ├── progress/
│   │   │   ├── XPBar.js
│   │   │   ├── LevelBadge.js
│   │   │   ├── StreakCounter.js
│   │   │   ├── AchievementCard.js
│   │   │   └── WeeklyGoalProgress.js
│   │   └── navigation/
│   │       └── TabBarIcon.js
│   ├── contexts/                   # React Context providers
│   │   ├── AuthContext.js          # Authentication state
│   │   ├── UserContext.js          # User profile data
│   │   ├── TrainingContext.js      # Active session state
│   │   └── ProgressContext.js      # Gamification data
│   ├── services/                   # API and business logic
│   │   ├── api/
│   │   │   ├── apiClient.js        # Axios instance with interceptors
│   │   │   ├── authApi.js          # Auth endpoints
│   │   │   ├── userApi.js          # User endpoints
│   │   │   ├── trainingApi.js      # Training plan endpoints
│   │   │   ├── sessionApi.js       # Session endpoints
│   │   │   ├── gamificationApi.js  # Progress/achievements
│   │   │   ├── teamApi.js          # Team endpoints
│   │   │   └── invitationApi.js    # Invitation endpoints
│   │   ├── storage/
│   │   │   ├── SecureStorage.js    # Token storage (Keychain/EncryptedSharedPrefs)
│   │   │   └── CacheStorage.js     # Offline data caching
│   │   └── utils/
│   │       ├── tokenManager.js     # Token refresh logic
│   │       ├── errorHandler.js     # Centralized error handling
│   │       └── validators.js       # Input validation
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.js              # Authentication hook
│   │   ├── useApi.js               # API call hook with loading/error
│   │   ├── useTraining.js          # Training session hook
│   │   ├── useProgress.js          # Progress tracking hook
│   │   └── useOffline.js           # Offline detection hook
│   ├── navigation/                 # Navigation configuration
│   │   ├── AppNavigator.js         # Root navigator
│   │   ├── AuthNavigator.js        # Auth flow stack
│   │   └── MainNavigator.js        # Main app tabs
│   ├── constants/                  # App constants
│   │   ├── Colors.js               # Color palette
│   │   ├── Fonts.js                # Typography
│   │   ├── Layout.js               # Spacing, sizes
│   │   └── Config.js               # API URLs, app config
│   └── utils/                      # Utility functions
│       ├── dateUtils.js            # Date formatting
│       ├── xpCalculator.js         # XP/level calculations
│       └── formatters.js           # Data formatters
└── __tests__/                      # Test files
    ├── components/
    ├── services/
    └── utils/
```

---

## Core Features & User Flows

### 1. Authentication Flow
**Screens:** LoginScreen → ProfileSetupScreen → HomeScreen

**User Journey:**
1. User opens app → LoginScreen
2. Tap "Login with Magic Board" → OAuth redirect to Cognito
3. Authenticate with Cognito hosted UI
4. Redirect back to app with auth code
5. Exchange code for tokens → Store securely
6. If first time: ProfileSetupScreen (create profile)
7. Navigate to HomeScreen

**API Endpoints:**
- `GET /oauth2/authorize` (Cognito)
- `POST /api/auth/validate`
- `POST /api/users/me` (create profile)
- `GET /api/users/me` (get profile)

### 2. Home Dashboard
**Screen:** HomeScreen

**Features:**
- Welcome message with user's display name
- Current level and XP progress bar
- Current streak counter (with fire emoji 🔥)
- Weekly goal progress
- Quick stats (sessions completed, total training time)
- Recent achievements (last 3)
- Quick action buttons (Start Training, Browse Plans)
- Notifications badge (pending invitations)

**API Endpoints:**
- `GET /api/gamification/progress`
- `GET /api/gamification/streak`
- `GET /api/gamification/weekly-goal`
- `GET /api/gamification/achievements/player?limit=3`
- `GET /api/invitations?status=pending`

### 3. Browse Training Plans
**Screen:** BrowsePlansScreen

**Features:**
- Search bar (text search)
- Filter chips (sport, difficulty, featured)
- Sort options (recent, popular, difficulty)
- Infinite scroll list of PlanCard components
- Pull-to-refresh
- Tap card → PlanDetailsScreen

**API Endpoints:**
- `GET /api/gamification/plans/library?sportCategory=X&difficulty=Y&limit=20&offset=0`

### 4. Plan Details
**Screen:** PlanDetailsScreen

**Features:**
- Plan name, description, sport badge
- Difficulty badge, estimated duration
- Rating stars, usage count
- Tags (chips)
- Task list preview
- "Start Training" button
- Save/unsave plan toggle

**API Endpoints:**
- `GET /api/gamification/plans/{programId}`
- `POST /api/gamification/plans/{programId}/save`
- `DELETE /api/gamification/plans/{programId}/unsave`

### 5. Active Training Session
**Screen:** ActiveSessionScreen

**Features:**
- Timer (counting up)
- Current task display
- Task completion checklist
- Pause/Resume buttons
- End session button (with confirmation)
- Progress indicator (X of Y tasks completed)

**State Management:**
- TrainingContext manages active session
- Local state for timer
- Periodic auto-save to backend

**API Endpoints:**
- `POST /api/gamification/sessions/start`
- `POST /api/gamification/sessions/{sessionId}/complete`
- `GET /api/gamification/sessions/active` (on app resume)

### 6. Progress Tracking
**Screen:** ProgressScreen

**Features:**
- Large XP display with level badge
- XP progress bar to next level
- Tier name (Beginner, Intermediate, etc.)
- Total training time (formatted: "10h 24m")
- Total sessions completed
- Level history timeline
- Stats cards (avg session time, favorite sport, etc.)

**API Endpoints:**
- `GET /api/gamification/progress`

### 7. Achievements
**Screen:** AchievementsScreen

**Features:**
- Tabs: Unlocked / Locked / All
- Achievement cards with icon, name, description
- XP reward badge
- Unlock date (for unlocked)
- Progress bar (for in-progress achievements)
- Secret achievements (hidden until unlocked)

**API Endpoints:**
- `GET /api/gamification/achievements/player`
- `GET /api/gamification/achievements/available`

### 8. Streak Tracking
**Screen:** StreakScreen

**Features:**
- Large current streak display (with 🔥)
- Longest streak badge
- Last training date
- Calendar view (7-day week with checkmarks)
- Streak freeze inventory
- "Use Streak Freeze" button
- Streak stats (total days trained, etc.)

**API Endpoints:**
- `GET /api/gamification/streak`
- `GET /api/gamification/streak/stats`
- `POST /api/gamification/streak-freezes/use`

### 9. Weekly Goal
**Screen:** WeeklyGoalScreen

**Features:**
- Week date range display
- Target days selector (1-7)
- Completed days counter
- Progress ring/bar
- Day-by-day breakdown (M T W T F S S with checkmarks)
- Goal status badge (Active, Completed, Failed)
- Update target button

**API Endpoints:**
- `GET /api/gamification/weekly-goal`
- `PUT /api/gamification/weekly-goal/target`

### 10. Session History
**Screen:** SessionHistoryScreen

**Features:**
- Infinite scroll list of completed sessions
- Session cards showing:
  - Plan name
  - Date/time
  - Duration
  - XP awarded
  - Tasks completed
- Filter by date range
- Filter by sport
- Pull-to-refresh

**API Endpoints:**
- `GET /api/gamification/sessions/history?limit=20&offset=0`

### 11. Profile & Settings
**Screen:** ProfileScreen, SettingsScreen

**Features:**
- Display name, username, email, avatar
- Edit profile button
- Teams list (with badges: 🏆 club, 👤 personal)
- Pending invitations badge
- Settings: Notifications, Privacy, About
- Logout button

**API Endpoints:**
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/teams`
- `GET /api/invitations?status=pending`

---

## API Integration Strategy

### 1. API Client Setup (apiClient.js)

```javascript
import axios from 'axios';
import { getTokens, refreshAccessToken, clearTokens } from './tokenManager';
import { API_BASE_URL } from '../constants/Config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = await getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await clearTokens();
        // Navigate to login (via navigation ref or event emitter)
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Token Management (tokenManager.js)

```javascript
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/apiClient';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ID_TOKEN_KEY = 'id_token';

export const saveTokens = async (accessToken, refreshToken, idToken) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  if (idToken) {
    await SecureStore.setItemAsync(ID_TOKEN_KEY, idToken);
  }
};

export const getTokens = async () => {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  const idToken = await SecureStore.getItemAsync(ID_TOKEN_KEY);
  return { accessToken, refreshToken, idToken };
};

export const refreshAccessToken = async () => {
  const { refreshToken } = await getTokens();
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await apiClient.post('/api/auth/refresh', {
    refreshToken,
  });

  const { accessToken, idToken } = response.data.data;
  await saveTokens(accessToken, refreshToken, idToken);
  return accessToken;
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
};
```

### 3. Custom Hook Pattern (useApi.js)

```javascript
import { useState, useEffect } from 'react';

export const useApi = (apiFunc, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = async (...params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...params);
      setData(result.data);
      return result.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { data, loading, error, execute, refetch: execute };
};
```

### 4. Offline Support Strategy

**Caching Approach:**
- Use AsyncStorage for non-sensitive cached data
- Cache key data on successful API responses
- Check cache first, show cached data while fetching fresh
- Sync on reconnection

**Cached Data:**
- User profile (`users/me`)
- Training plans library (with timestamp)
- Player progress
- Achievements
- Active session (critical for offline training)

**Implementation:**
```javascript
// CacheStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const cacheData = async (key, data) => {
  const cacheItem = {
    data,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(
    `${CACHE_PREFIX}${key}`,
    JSON.stringify(cacheItem)
  );
};

export const getCachedData = async (key) => {
  const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_EXPIRY) {
    return null; // Expired
  }
  return data;
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal:** Project setup, authentication, basic navigation

**Tasks:**
1. ✅ Initialize Expo project with matching dependencies
2. ✅ Set up folder structure
3. ✅ Configure app.json (bundle IDs, permissions)
4. ✅ Install additional dependencies (axios, secure-store, async-storage)
5. ✅ Create API client with interceptors
6. ✅ Implement token management
7. ✅ Create AuthContext and navigation guards
8. ✅ Build LoginScreen with OAuth flow
9. ✅ Build ProfileSetupScreen
10. ✅ Create basic navigation structure (Auth + Main tabs)

**Deliverable:** User can login and see empty home screen

### Phase 2: Core Training Features (Week 2)
**Goal:** Browse plans, start sessions, basic tracking

**Tasks:**
1. ✅ Create training API service layer
2. ✅ Build BrowsePlansScreen with filters
3. ✅ Build PlanDetailsScreen
4. ✅ Create TrainingContext for session management
5. ✅ Build ActiveSessionScreen with timer
6. ✅ Implement session start/complete flow
7. ✅ Create reusable components (PlanCard, SessionTimer, etc.)
8. ✅ Add pull-to-refresh and infinite scroll

**Deliverable:** User can browse plans and complete training sessions

### Phase 3: Gamification & Progress (Week 3)
**Goal:** XP, levels, achievements, streaks

**Tasks:**
1. ✅ Create gamification API service layer
2. ✅ Build ProgressScreen with XP/level display
3. ✅ Build AchievementsScreen
4. ✅ Build StreakScreen with calendar view
5. ✅ Build WeeklyGoalScreen
6. ✅ Create ProgressContext for gamification state
7. ✅ Implement XP bar and level badge components
8. ✅ Add achievement unlock animations

**Deliverable:** Full gamification system functional

### Phase 4: History & Profile (Week 4)
**Goal:** Session history, profile management, teams

**Tasks:**
1. ✅ Build SessionHistoryScreen with filters
2. ✅ Build ProfileScreen
3. ✅ Build SettingsScreen
4. ✅ Build TeamsScreen
5. ✅ Implement profile editing
6. ✅ Add invitation acceptance flow
7. ✅ Create NotificationsScreen for invitations

**Deliverable:** Complete user profile and history features

### Phase 5: Polish & Optimization (Week 5)
**Goal:** Offline support, error handling, UX improvements

**Tasks:**
1. ✅ Implement offline caching strategy
2. ✅ Add comprehensive error handling
3. ✅ Implement retry logic for failed requests
4. ✅ Add loading states and skeletons
5. ✅ Optimize performance (memoization, lazy loading)
6. ✅ Add animations and transitions
7. ✅ Implement deep linking for invitations
8. ✅ Add analytics tracking

**Deliverable:** Production-ready app with offline support

### Phase 6: Testing & Launch Prep (Week 6)
**Goal:** Testing, bug fixes, app store preparation

**Tasks:**
1. ✅ Write unit tests for utilities and services
2. ✅ Write integration tests for API calls
3. ✅ Manual testing on iOS and Android
4. ✅ Fix bugs and edge cases
5. ✅ Prepare app store assets (screenshots, descriptions)
6. ✅ Set up crash reporting (Sentry)
7. ✅ Create user documentation
8. ✅ Submit to TestFlight/Google Play Beta

**Deliverable:** App in beta testing

---

## Dependencies to Add

### Core
```json
{
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "expo-secure-store": "~13.0.0",
  "expo-web-browser": "~13.0.0",
  "expo-auth-session": "~5.5.0"
}
```

### UI/UX
```json
{
  "react-native-reanimated": "~3.10.0",
  "react-native-gesture-handler": "~2.16.0",
  "react-native-svg": "~15.2.0",
  "@expo/vector-icons": "^14.0.0"
}
```

### Optional (Phase 5+)
```json
{
  "date-fns": "^3.0.0",
  "@sentry/react-native": "^5.15.0",
  "react-native-dotenv": "^3.4.0"
}
```

---

## AI-Accelerated Development Strategy

### Iteration Cycle (30-60 min sprints)

**Sprint Structure:**
1. **Define:** Pick 1-2 tasks from roadmap
2. **Design:** Sketch component/screen structure
3. **Build:** AI generates initial implementation
4. **Review:** Human reviews, provides feedback
5. **Refine:** AI iterates based on feedback
6. **Test:** Quick manual test
7. **Commit:** Commit working code

### Communication Protocol

**You provide:**
- Feature requirements
- UI/UX preferences
- API endpoint selections
- Feedback on generated code

**I provide:**
- Complete, runnable code
- File structure
- Implementation notes
- Testing suggestions

### Quick Wins First
- Start with screens that have clear API mappings
- Build reusable components early
- Establish patterns, then replicate
- Test on device frequently

---

## Next Steps

### Immediate Actions
1. **Initialize Project:** Create Expo app in mb-mobile-training
2. **Set Up Dependencies:** Install core packages
3. **Configure API:** Set up API client and token management
4. **Build Auth Flow:** OAuth login with Cognito
5. **Create First Screen:** HomeScreen with mock data

### First Sprint Suggestion
**Goal:** Get authentication working end-to-end

**Tasks:**
1. Initialize Expo project
2. Install dependencies
3. Create API client with interceptors
4. Implement token management
5. Build LoginScreen with OAuth
6. Test login flow on device

**Estimated Time:** 2-3 hours with AI acceleration

---

## Questions for You

Before we start building, I'd like to clarify:

1. **Development Environment:** Are you set up for iOS, Android, or both?
2. **API Environment:** Should we point to localhost:3050 or a deployed API?
3. **Design Preferences:** Do you have a design system/color palette in mind, or should I create one?
4. **First Feature:** Which feature should we build first? (I recommend: Auth → Home → Browse Plans)
5. **Testing Device:** Do you have a physical device for testing, or should we optimize for simulator?

---

**Ready to start building?** Let's bootstrap this app and iterate quickly! 🚀
