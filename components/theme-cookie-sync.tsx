// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const THEME_COOKIE = 'theme'

export function ThemeCookieSync() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const value = theme === 'system' ? (resolvedTheme ?? 'light') : theme
    if (!value) return

    document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.style.colorScheme = value
  }, [theme, resolvedTheme])

  return null
}
