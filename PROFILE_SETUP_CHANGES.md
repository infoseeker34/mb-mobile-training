# Profile Setup Changes

## Overview
Simplified profile setup to avoid redundancy with Cognito authentication and focus on collecting essential user information.

## Changes Made

### Mobile App (`ProfileSetupScreen.js`)

**Removed Fields:**
- ❌ Email (already in Cognito)
- ❌ Username input (uses Cognito username automatically)
- ❌ Display Name as standalone field

**New Required Fields:**
- ✅ First Name
- ✅ Last Name
- ✅ Date of Birth (MM/DD/YYYY format with auto-formatting)
- ✅ Gender (Male/Female/Other - button selector)

**Optional Fields:**
- ✅ Phone Number

**Auto-Generated:**
- Display Name: Automatically set as `${firstName} ${lastName}`
- Username: Pulled from Cognito token (single source of truth)
- Email: Pulled from Cognito token

### Backend (`user-service/controller.ts`)

**Updated `createProfile` endpoint:**
- Now requires: `firstName`, `lastName`, `dateOfBirth`, `gender`
- Validates date of birth is not in the future
- Always creates `user_profile_extensions` record (no longer optional)
- Auto-generates `displayName` from first/last name
- Uses Cognito username from token

**Request Body:**
```json
{
  "username": "from_cognito_token",
  "email": "from_cognito_token",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "phoneNumber": "+1 (555) 123-4567"
}
```

**Response:**
- Returns complete profile with extensions
- Includes `firstName`, `lastName`, `dateOfBirth`, `gender`, `phoneNumber`

## Benefits

1. **No Duplicate Data**: Email and username come from Cognito (single source of truth)
2. **Cleaner UX**: Users only enter information not already provided
3. **Better Data Quality**: Required fields ensure we have essential information
4. **Consistent Identity**: Username is the same across web portal and mobile app
5. **Simpler Validation**: No need to check username availability (Cognito handles it)

## Database Schema

**user_profiles table:**
- `cognito_user_id` (from Cognito)
- `email` (from Cognito)
- `username` (from Cognito)
- `display_name` (auto-generated from first/last name)

**user_profile_extensions table:**
- `first_name` (required)
- `last_name` (required)
- `date_of_birth` (required)
- `gender` (required)
- `phone_number` (optional)

## Testing

To test the complete flow:

1. Start the app: `./start-simulator.sh`
2. Tap "Login with Magic Board"
3. Complete Cognito OAuth flow
4. Fill in profile setup:
   - First Name: John
   - Last Name: Doe
   - Date of Birth: 05/15/1990
   - Gender: Male
   - Phone: (optional)
5. Tap "Complete Setup"
6. Should navigate to Home screen with profile loaded

## API Endpoints

**POST /api/users/me** (Create Profile)
- Requires: firstName, lastName, dateOfBirth, gender
- Optional: phoneNumber
- Auto-fills: username, email from Cognito token

**PUT /api/users/me** (Update Profile)
- All fields optional (updates only provided fields)
- Uses COALESCE to preserve existing values

**GET /api/users/me** (Get Profile)
- Returns profile with extensions
- Includes all personal information
