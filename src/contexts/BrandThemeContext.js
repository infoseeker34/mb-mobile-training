/**
 * Brand Theme Context (ORG-3a)
 *
 * Single source of truth for the app's live brand colors. Exposes `primary`
 * and `accent`, defaulting to the static `constants/Colors.js` palette so an
 * unbranded / personal / signed-out context is pixel-for-pixel identical to
 * before this slice existed.
 *
 * On sign-in (and whenever the active org changes via `refreshBrand`), it
 * fetches GET /api/users/me/organizations, finds the *active* org
 * (`isActive === true`, camelCase contract), and — only when that org is an
 * enterprise org carrying valid hex branding — themes primary/accent from it.
 * Any other case resets cleanly to the defaults. All resolution runs through
 * the pure `resolveActiveBrandColors` helper in services/utils/orgBranding.js.
 *
 * Chrome that should follow the brand consumes `useBrandColors()`; everything
 * neutral/secondary/status keeps importing `constants/Colors.js` directly.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Colors from '../constants/Colors';
import userApi from '../services/api/userApi';
import { resolveActiveBrandColors } from '../services/utils/orgBranding';
import { useAuth } from './AuthContext';

const DEFAULT_BRAND = { primary: Colors.primary, accent: Colors.accent };

const BrandThemeContext = createContext({ ...DEFAULT_BRAND, refreshBrand: async () => {} });

export const useBrandColors = () => useContext(BrandThemeContext);

export const BrandThemeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  // Re-fetch the user's orgs and re-resolve the active-org theme. Exposed so
  // callers that change the active context (e.g. the profile org switcher) can
  // repaint the chrome immediately instead of waiting for a remount.
  const refreshBrand = useCallback(async () => {
    try {
      const result = await userApi.getUserOrganizations();
      const orgs = (result && result.data && result.data.organizations) || [];
      setBrand(resolveActiveBrandColors(orgs, DEFAULT_BRAND));
    } catch (error) {
      // Non-fatal — an unreachable branding fetch just keeps the defaults.
      setBrand(DEFAULT_BRAND);
    }
  }, []);

  // Load on auth transitions: reset to defaults when signed out, resolve the
  // active org's brand when signed in.
  useEffect(() => {
    if (!isAuthenticated) {
      setBrand(DEFAULT_BRAND);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const result = await userApi.getUserOrganizations();
        if (!mounted) return;
        const orgs = (result && result.data && result.data.organizations) || [];
        setBrand(resolveActiveBrandColors(orgs, DEFAULT_BRAND));
      } catch (error) {
        if (mounted) setBrand(DEFAULT_BRAND);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const value = {
    primary: brand.primary,
    accent: brand.accent,
    refreshBrand,
  };

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
};

export default BrandThemeContext;
