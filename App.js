/**
 * Main App Component
 * 
 * Entry point with providers and navigation.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { BrandThemeProvider } from './src/contexts/BrandThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <BrandThemeProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </BrandThemeProvider>
    </AuthProvider>
  );
}
