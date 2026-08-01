/**
 * Button Component
 * 
 * Reusable button with different variants and sizes.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { useBrandColors } from '../../contexts/BrandThemeContext';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  // Primary CTAs follow the active org's brand primary (defaults to
  // Colors.primary when unbranded). Only the brand-carrying pieces are
  // overridden; disabled/secondary keep their static neutral styling.
  const { primary } = useBrandColors();

  const brandOverride =
    !disabled && variant === 'primary'
      ? { backgroundColor: primary }
      : !disabled && variant === 'outline'
      ? { borderColor: primary }
      : null;

  const brandTextOverride =
    !disabled && variant === 'outline' ? { color: primary } : null;

  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    brandOverride,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.text_disabled,
    brandTextOverride,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textInverse : primary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  button_primary: {
    backgroundColor: Colors.buttonPrimary,
  },
  button_secondary: {
    backgroundColor: Colors.buttonSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  button_disabled: {
    backgroundColor: Colors.buttonDisabled,
    borderColor: Colors.buttonDisabled,
  },
  
  // Sizes
  button_sm: {
    height: Layout.buttonHeight.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  button_md: {
    height: Layout.buttonHeight.md,
    paddingHorizontal: Layout.spacing.lg,
  },
  button_lg: {
    height: Layout.buttonHeight.lg,
    paddingHorizontal: Layout.spacing.xl,
  },
  
  // Text
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: Colors.textInverse,
  },
  text_secondary: {
    color: Colors.text,
  },
  text_outline: {
    color: Colors.primary,
  },
  text_disabled: {
    color: Colors.textTertiary,
  },
  text_sm: {
    fontSize: Layout.fontSize.sm,
  },
  text_md: {
    fontSize: Layout.fontSize.md,
  },
  text_lg: {
    fontSize: Layout.fontSize.lg,
  },
});

export default Button;
