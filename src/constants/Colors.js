/**
 * Color Palette for Magic Board Training App
 * 
 * Easy to modify - just update the values in the palette object.
 * All components reference these constants for consistency.
 */

const palette = {
  // Primary Brand Colors
  primary: '#6366f1',      // Indigo - main brand color
  primaryDark: '#4f46e5',  // Darker indigo for pressed states
  primaryLight: '#818cf8', // Lighter indigo for backgrounds
  
  // Secondary Colors
  secondary: '#10b981',    // Green - success, achievements
  secondaryDark: '#059669',
  secondaryLight: '#34d399',
  
  // Accent Colors
  accent: '#f59e0b',       // Amber - highlights, streaks
  accentDark: '#d97706',
  accentLight: '#fbbf24',
  
  // Semantic Colors
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  error: '#ef4444',        // Red
  info: '#3b82f6',         // Blue
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // XP/Level Colors (gradient)
  xpStart: '#6366f1',      // Indigo
  xpEnd: '#8b5cf6',        // Purple
  
  // Streak Fire Colors
  streakOrange: '#f97316',
  streakYellow: '#fbbf24',
};

// Export organized color groups
export default {
  // Brand
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primaryLight: palette.primaryLight,
  secondary: palette.secondary,
  accent: palette.accent,
  
  // UI Elements
  background: palette.white,
  surface: palette.gray50,
  card: palette.white,
  border: palette.gray200,
  divider: palette.gray200,
  
  // Text
  text: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  
  // Status
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  
  // Interactive States
  buttonPrimary: palette.primary,
  buttonPrimaryPressed: palette.primaryDark,
  buttonSecondary: palette.gray100,
  buttonSecondaryPressed: palette.gray200,
  buttonDisabled: palette.gray300,
  
  // Special Features
  xpGradientStart: palette.xpStart,
  xpGradientEnd: palette.xpEnd,
  streakFire: palette.streakOrange,
  achievementGold: palette.accent,
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Shadows (iOS style)
  shadow: palette.gray900,
  
  // Raw palette for custom use
  palette,
};
