#!/bin/bash

echo "🔧 Updating Cognito User Pool Client with mobile callback URLs..."
echo ""

USER_POOL_ID="us-east-1_4CSKmyoGw"
CLIENT_ID="738um5t7qmnne5p6gumi6149ua"

# First, get the current client configuration to preserve all settings
echo "Fetching current client configuration..."
CURRENT_CONFIG=$(aws cognito-idp describe-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --region us-east-1 \
  --output json)

if [ $? -ne 0 ]; then
  echo "❌ Failed to fetch current configuration"
  exit 1
fi

# Update with both web and mobile callback URLs
echo "Updating callback URLs..."
aws cognito-idp update-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --callback-urls '["http://localhost:3001/auth/callback","mbtraining://auth"]' \
  --logout-urls '["http://localhost:3001","mbtraining://"]' \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers "COGNITO" \
  --region us-east-1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Cognito User Pool Client updated successfully!"
  echo ""
  echo "Callback URLs now include:"
  echo "  - http://localhost:3001/auth/callback (web)"
  echo "  - mbtraining://auth (mobile)"
  echo ""
  echo "Logout URLs now include:"
  echo "  - http://localhost:3001 (web)"
  echo "  - mbtraining:// (mobile)"
  echo ""
  echo "🚀 You can now test the mobile app OAuth flow!"
  echo "   Just tap 'Login with Magic Board' in the simulator"
else
  echo ""
  echo "❌ Failed to update Cognito User Pool Client"
  echo ""
  echo "Please update manually in AWS Console:"
  echo "1. Go to Cognito → User pools → magic-board-dev"
  echo "2. Click 'App clients' in left sidebar"
  echo "3. Click your app client"
  echo "4. Scroll to 'Hosted UI' section and click 'Edit'"
  echo "5. Add 'mbtraining://auth' to Allowed callback URLs"
  echo "6. Add 'mbtraining://' to Allowed sign-out URLs"
  echo "7. Save changes"
fi
