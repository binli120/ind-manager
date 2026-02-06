// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import React from 'react'
import { render, screen } from '@testing-library/react'

const mockDispatch = jest.fn()
const mockSelector = jest.fn()

jest.mock('@/lib/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (fn: unknown) => mockSelector(fn),
}))

jest.mock('@/lib/supabase', () => ({
  createBrowserClient: () => ({
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/protected',
}))

jest.mock('@/lib/store/slices', () => ({
  getCurrentUser: () => ({ type: 'auth/getCurrentUser' }),
}))

import { AuthGuard } from '@/components/auth/auth-guard'

describe('AuthGuard', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    mockDispatch.mockClear()
    mockSelector.mockReset()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('shows loading UI when auth is loading', () => {
    mockSelector.mockReturnValue({ user: null, isLoading: true, isAuthenticated: false })
    render(
      <AuthGuard>
        <div>child</div>
      </AuthGuard>,
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
