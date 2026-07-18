/**
 * Direct calls to Cognito's public Identity Provider API (SignUp,
 * ConfirmSignUp, ResendConfirmationCode). These are unauthenticated actions
 * scoped to a single app client - no AWS credentials or SDK needed, just the
 * client ID, so a plain fetch against the regional endpoint is enough.
 *
 * Username is always set to the user's email. The pool's UsernameAttributes
 * is empty (login by username, not email-as-alias), so without this the
 * hosted-UI sign-up form would ask for a separate, user-chosen username -
 * this keeps that identifier hidden and derived instead.
 */

import { COGNITO_CONFIG } from '../../constants/Config';

const region = COGNITO_CONFIG.userPoolId.split('_')[0];
const ENDPOINT = `https://cognito-idp.${region}.amazonaws.com/`;

async function cognitoRequest(target, body) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || data.__type || 'Request failed');
    error.code = (data.__type || '').split('#').pop();
    throw error;
  }
  return data;
}

export async function signUp(email, password) {
  return cognitoRequest('SignUp', {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function confirmSignUp(email, code) {
  return cognitoRequest('ConfirmSignUp', {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmationCode(email) {
  return cognitoRequest('ResendConfirmationCode', {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
  });
}

/** Maps Cognito's exception __type to a user-facing message. */
export function describeCognitoError(error) {
  switch (error.code) {
    case 'UsernameExistsException':
      return 'An account with this email already exists.';
    case 'InvalidPasswordException':
      return 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and symbol.';
    case 'InvalidParameterException':
      return 'Please enter a valid email address.';
    case 'CodeMismatchException':
      return 'That code is incorrect. Please try again.';
    case 'ExpiredCodeException':
      return 'That code has expired. Request a new one below.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}
