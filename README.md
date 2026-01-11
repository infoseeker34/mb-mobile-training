# Magic Board Training Mobile App

React Native mobile application for consuming training programs from the Magic Board cloud services API.

## Tech Stack

- **Expo SDK:** ~54.0.13 (with new architecture enabled)
- **React:** 19.1.0
- **React Native:** 0.81.4
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **HTTP Client:** Axios
- **Storage:** Expo SecureStore + AsyncStorage
- **Authentication:** OAuth 2.0 with AWS Cognito

## Features

### Phase 1 (Current - Authentication)
- ✅ OAuth login with Cognito hosted UI
- ✅ Secure token storage (Keychain on iOS)
- ✅ Automatic token refresh
- ✅ Profile setup for first-time users
- ✅ Basic navigation structure

### Coming Soon
- Browse and search training plans
- Start and complete training sessions
- Track XP, levels, and progress
- Earn achievements
- Build training streaks
- Weekly goal tracking
- Team management
- Invitation system

## Project Structure

```
mb-mobile-training/
├── App.js                          # Main app entry
├── src/
│   ├── screens/                    # Screen components
│   │   ├── auth/                   # Authentication screens
│   │   └── home/                   # Home dashboard
│   ├── components/                 # Reusable components
│   │   └── common/                 # Common UI components
│   ├── navigation/                 # Navigation configuration
│   ├── contexts/                   # React Context providers
│   ├── services/                   # API and business logic
│   │   ├── api/                    # API clients
│   │   ├── storage/                # Storage services
│   │   └── utils/                  # Utilities
│   └── constants/                  # App constants
│       ├── Colors.js               # Color palette (easy to modify)
│       ├── Config.js               # API & OAuth config
│       └── Layout.js               # Spacing & sizing
└── assets/                         # Images and icons
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Xcode (for iOS development)

## Installation

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start
```

## Running the App

### iOS Simulator (Recommended for Development)

```bash
# Press 'i' in Expo dev server
# OR
npx expo start --ios
```

### iOS Device (for OAuth testing)

```bash
npx expo run:ios --device
```

**Note:** OAuth redirect requires either:
- Physical device for production OAuth flow
- Simulator with proper URL scheme handling

## Configuration

### API Endpoint

Edit `src/constants/Config.js`:

```javascript
export const API_BASE_URL = 'http://localhost:3050';
```

For physical device testing, use your computer's IP:
```javascript
export const API_BASE_URL = 'http://192.168.1.XXX:3050';
```

### Color Palette

Edit `src/constants/Colors.js` to customize the app's color scheme:

```javascript
const palette = {
  primary: '#6366f1',      // Main brand color
  secondary: '#10b981',    // Success/achievements
  accent: '#f59e0b',       // Highlights/streaks
  // ... more colors
};
```

### OAuth Configuration

OAuth is pre-configured for Magic Board Cognito:
- Domain: `magic-board-dev-auth.auth.us-east-1.amazoncognito.com`
- Client ID: `45f6r47d2c6dkn0fnqks52iqat`
- Redirect URI: `mbtraining://auth`

## Authentication Flow

1. User taps "Login with Magic Board"
2. Opens Cognito hosted UI in browser
3. User authenticates with credentials
4. Redirects back to app with auth code
5. App exchanges code for tokens
6. Tokens stored securely in Keychain
7. First-time users see profile setup
8. Existing users go to home screen

## API Integration

### Token Management

- Access tokens stored in Keychain (iOS) / EncryptedSharedPreferences (Android)
- Automatic token refresh on 401 responses
- Token refresh handled by Axios interceptors

### API Client

All API calls use the centralized `apiClient`:

```javascript
import apiClient from './services/api/apiClient';

const response = await apiClient.get('/api/endpoint');
```

### Available API Services

- `authApi` - Authentication endpoints
- `userApi` - User profile management
- More services coming in Phase 2+

## Development Workflow

### Quick Iteration Cycle

1. Make code changes
2. Expo hot reloads automatically
3. Test in simulator
4. Commit working code

### Testing Authentication

1. Start local API server: `cd mb-cloud-services && npm start`
2. Start mobile app: `npm start`
3. Open in iOS simulator
4. Tap "Login with Magic Board"
5. Authenticate in browser
6. Verify redirect and token storage

## Troubleshooting

### "Unable to connect to API"

- Ensure mb-cloud-services is running on port 3050
- Check API_BASE_URL in Config.js
- For device testing, use computer's IP address

### OAuth redirect not working

- Verify URL scheme in app.json: `"scheme": "mbtraining"`
- Check Cognito callback URL includes: `mbtraining://auth`
- Try on physical device if simulator issues persist

### "No refresh token available"

- Tokens may have expired
- Logout and login again
- Check Cognito token expiration settings

## Next Steps

### Phase 2: Core Training Features (Week 2)
- Browse training plans screen
- Plan details screen
- Active training session screen
- Session timer and task tracking

### Phase 3: Gamification (Week 3)
- Progress tracking (XP, levels)
- Achievements system
- Streak tracking
- Weekly goals

## Contributing

This is an AI-accelerated development project. We iterate in 30-60 minute sprints:

1. Define feature requirements
2. Generate implementation
3. Review and test
4. Refine based on feedback
5. Commit and move to next feature

## License

Proprietary - Magic Board, Inc.
