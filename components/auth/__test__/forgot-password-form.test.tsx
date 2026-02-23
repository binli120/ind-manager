// Author: Bin Lee
// Email: binlee120@gmail.com
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockResetPassword = jest.fn()

jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ resetPassword: mockResetPassword }),
}))

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    mockResetPassword.mockReset()
  })

  it('submits email and shows success message', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ error: null })

    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })

  it('shows error from resetPassword', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ error: { message: 'Bad email' } })

    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'bad@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('Bad email')).toBeInTheDocument()
  })
})

