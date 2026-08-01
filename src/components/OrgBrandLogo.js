/**
 * Org Brand Logo (ORG-3a)
 *
 * Presentational logo tile for an enterprise org's branding. Shows the org's
 * `logoUrl` via <Image>; if the URL is absent or fails to load, it degrades
 * gracefully to a colored initial badge (using the org's accent color, falling
 * back to the app primary). Purely display — owns only its own image-error
 * state and never touches the global theme.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

const OrgBrandLogo = ({ logoUrl, name, accentColor, size = 40, style }) => {
  const [failed, setFailed] = useState(false);

  // A new logoUrl should get a fresh chance to load.
  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  const dimension = { width: size, height: size, borderRadius: Math.round(size / 6) };
  const showImage = !!logoUrl && !failed;

  if (showImage) {
    return (
      <Image
        source={{ uri: logoUrl }}
        onError={() => setFailed(true)}
        resizeMode="contain"
        accessibilityLabel={name ? `${name} logo` : 'Organization logo'}
        style={[styles.logo, dimension, style]}
      />
    );
  }

  const initial = (typeof name === 'string' && name.trim().charAt(0).toUpperCase()) || '?';
  return (
    <View
      style={[
        styles.fallback,
        dimension,
        { backgroundColor: accentColor || Colors.primary },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size / 2) }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    backgroundColor: Colors.surface,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
});

export default OrgBrandLogo;
