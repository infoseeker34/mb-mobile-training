# Quick Start Guide

Get the Magic Board Training mobile app running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd mb-mobile-training
npm install
```

## Step 2: Start the API Server

In a separate terminal:

```bash
cd ../mb-cloud-services
npm start
```

Verify API is running at: `http://localhost:3050`

## Step 3: Start the Mobile App

```bash
npm start
```

## Step 4: Open in iOS Simulator

Press `i` in the Expo terminal, or:

```bash
npx expo start --ios
```

## Step 5: Test Authentication

1. App opens to Login screen
2. Tap "Login with Magic Board"
3. Browser opens with Cognito login
4. Enter credentials (use existing Magic Board account)
5. Redirects back to app
6. First-time users: Fill out profile setup
7. Home screen appears!

## What You Should See

### Login Screen
- Magic Board logo
- Feature list
- "Login with Magic Board" button

### Profile Setup (First-Time Users)
- Display name input (required)
- Username input (optional, checks availability)
- Phone number input (optional)
- Email (read-only from Cognito)

### Home Screen
- Welcome message with your name
- Quick stats (Level, Streak)
- Quick action buttons
- Logout button

## Troubleshooting

### Can't connect to API
```bash
# Check API is running
curl http://localhost:3050/health

# If not running, start it
cd mb-cloud-services
npm start
```

### Simulator won't open
```bash
# Open Xcode and verify simulator is available
open -a Simulator

# Then try again
npm start
# Press 'i'
```

### OAuth redirect fails
- This is expected in simulator for some OAuth flows
- Try on physical device: `npx expo run:ios --device`
- Or continue development with mock auth (coming in next iteration)

## Next Steps

Once authentication works:

1. **Explore the code structure**
   - Check out `src/screens/auth/LoginScreen.js`
   - Review `src/contexts/AuthContext.js`
   - Look at `src/services/api/apiClient.js`

2. **Customize the design**
   - Edit `src/constants/Colors.js` for color palette
   - Modify `src/constants/Layout.js` for spacing

3. **Ready for Phase 2?**
   - We'll build Browse Training Plans next
   - Then Active Training Sessions
   - Then Progress Tracking

## Development Tips

- **Hot Reload:** Changes auto-reload in simulator
- **Console Logs:** Check terminal for debug output
- **React DevTools:** Press `m` in Expo terminal for menu
- **Shake Device:** Opens developer menu (physical device)

## Need Help?

Check the full README.md for detailed documentation and troubleshooting.

Happy coding! 🚀
