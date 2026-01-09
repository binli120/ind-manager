// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signInWithPassword = jest.fn()
const signUp = jest.fn()
const refresh = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword,
      signUp,
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

import { LoginDialog } from '@/components/auth/login-dialog'

describe('LoginDialog', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
    signUp.mockReset()
    refresh.mockReset()
  })

  it('logs in and reloads page', async () => {
    const user = userEvent.setup()
    signInWithPassword.mockResolvedValue({ error: null })

    render(<LoginDialog />)

    await user.click(screen.getByRole('button', { name: /login/i }))
    await user.type(screen.getByLabelText('Email', { selector: 'input#login-email' }), 'test@example.com')
    await user.type(screen.getByLabelText('Password', { selector: 'input#login-password' }), 'pw')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pw' })
    })
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled()
    })
  })

  it('shows mismatch error on sign up', async () => {
    const user = userEvent.setup()

    render(<LoginDialog />)

    await user.click(screen.getByRole('button', { name: /login/i }))
    await user.click(screen.getByRole('tab', { name: /sign up/i }))

    await user.type(screen.getByLabelText('Email', { selector: 'input#signup-email' }), 'test@example.com')
    await user.type(screen.getByLabelText('Password', { selector: 'input#signup-password' }), 'pw1')
    await user.type(screen.getByLabelText(/repeat password/i), 'pw2')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })
})
