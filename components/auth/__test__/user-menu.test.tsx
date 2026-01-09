import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockDispatch = jest.fn()
const mockSelector = jest.fn()
const refresh = jest.fn()

jest.mock('@/lib/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (fn: unknown) => mockSelector(fn),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

jest.mock('@/lib/store/slices/authSlice', () => ({
  logoutUser: () => ({ type: 'auth/logoutUser' }),
}))

import { UserMenu } from '@/components/auth/user-menu'

describe('UserMenu', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
    mockSelector.mockReset()
    refresh.mockReset()
  })

  it('renders nothing when no user', () => {
    mockSelector.mockReturnValue({ user: null, isLoading: false })
    const { container } = render(<UserMenu />)
    expect(container.firstChild).toBeNull()
  })

  it('dispatches logout and reloads', async () => {
    const user = userEvent.setup()
    mockSelector.mockReturnValue({ user: { email: 'test@example.com' }, isLoading: false })

    render(<UserMenu />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText(/log out/i))

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/logoutUser' })
    expect(refresh).toHaveBeenCalled()
  })
})
