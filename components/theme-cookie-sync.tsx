// Author: Bin Lee
// Email: binlee120@gmail.com

'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME,
} from '@/lib/common/theme'

export function ThemeCookieSync() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const value = theme === 'system' ? (resolvedTheme ?? 'light') : theme
    if (!value) return

    document.cookie = `${THEME_COOKIE_NAME}=${value}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
    document.documentElement.style.colorScheme = value
  }, [theme, resolvedTheme])

  return null
}
