// Author: Bin Lee
// Email: binlee120@gmail.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { AddTenantDialog } from './add_tenant-dialog'

const meta: Meta<typeof AddTenantDialog> = {
  title: 'UI/Tenants/AddTenantDialog',
  component: AddTenantDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: () => undefined,
    onAdd: () => undefined,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
