import React from 'react'
import { act, render, screen } from '@testing-library/react'

const mockDispatch = jest.fn()

jest.mock('@/lib/store/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/app/api/auth/auth-services', () => ({
  authServices: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    getUser: jest.fn(),
  },
}))

import { AuthProvider, useAuth } from '@/components/auth/auth-provider'
import { authServices } from '@/app/api/auth/auth-services'

function Consumer() {
  const { loading, signIn } = useAuth()
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <button onClick={() => void signIn('a@b.com', 'pw')}>signIn</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
    ;(Object.values(authServices) as unknown[]).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReset' in fn) (fn as jest.Mock).mockReset()
    })
  })

  it('throws if useAuth is used without a provider', () => {
    function BadConsumer() {
      useAuth()
      return null
    }

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within an AuthProvider')
    consoleErrorSpy.mockRestore()
  })

  it('loads initial session and exposes actions', async () => {
    ;(authServices.getSession as jest.Mock).mockResolvedValue({ session: null })
    ;(authServices.onAuthStateChange as jest.Mock).mockReturnValue({
      unsubscribe: jest.fn(),
    })

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await act(async () => {
      await Promise.resolve()
    })

    expect(authServices.getSession).toHaveBeenCalled()
    expect(screen.getByTestId('loading').textContent).toBe('false')

    ;(authServices.signIn as jest.Mock).mockResolvedValue({ error: null })

    await act(async () => {
      screen.getByText('signIn').click()
    })

    expect(authServices.signIn).toHaveBeenCalledWith('a@b.com', 'pw')
    expect(mockDispatch).toHaveBeenCalled()
  })
})
