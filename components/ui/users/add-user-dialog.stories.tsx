// Author: Bin Lee
// Email: binlee120@gmail.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { AddUserDialog } from './add-user-dialog'

const meta: Meta<typeof AddUserDialog> = {
  title: 'UI/Users/AddUserDialog',
  component: AddUserDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: () => undefined,
    onAdd: () => undefined,
    companies: ['FilynAI', 'Novagen', 'Rivus Bio'],
    currentUserPrivilege: 'system_admin',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const SystemAdmin: Story = {}

export const UserManager: Story = {
  args: {
    currentUserPrivilege: 'user_manager',
  },
}
