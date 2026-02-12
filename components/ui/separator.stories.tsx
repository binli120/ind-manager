// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className='w-[420px] space-y-3'>
      <p className='text-sm'>Regulatory Summary</p>
      <Separator />
      <p className='text-sm text-muted-foreground'>Last updated 2 hours ago</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className='flex h-16 items-center gap-4'>
      <span className='text-sm'>Overview</span>
      <Separator orientation='vertical' />
      <span className='text-sm'>Timeline</span>
      <Separator orientation='vertical' />
      <span className='text-sm'>Team</span>
    </div>
  ),
}
