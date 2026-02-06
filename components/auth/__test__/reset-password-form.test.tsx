// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUpdatePassword = jest.fn()

jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ updatePassword: mockUpdatePassword }),
}))

const mockValidatePassword = jest.fn()
jest.mock('@/utils/validatePassword', () => ({
  validatePassword: (...args: unknown[]) => mockValidatePassword(...args),
}))

import { ResetPasswordForm } from '@/components/auth/reset-password-form'

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockUpdatePassword.mockReset()
    mockValidatePassword.mockReset()
  })

  it('validates password and calls updatePassword', async () => {
    const user = userEvent.setup()
    mockValidatePassword.mockReturnValue(null)
    mockUpdatePassword.mockResolvedValue({ error: null })

    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm New Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(mockValidatePassword).toHaveBeenCalled()
    expect(mockUpdatePassword).toHaveBeenCalledWith('Password123!')
    expect(await screen.findByText(/password updated successfully/i)).toBeInTheDocument()
  })

  it('shows validation error and does not submit', async () => {
    const user = userEvent.setup()
    mockValidatePassword.mockReturnValue('Too weak')

    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'a')
    await user.type(screen.getByLabelText('Confirm New Password'), 'a')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByText('Too weak')).toBeInTheDocument()
    expect(mockUpdatePassword).not.toHaveBeenCalled()
  })
})
