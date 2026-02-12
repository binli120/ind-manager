// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { Label } from './label'
import { Textarea } from './textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
    },
    placeholder: {
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Add project notes...',
    className: 'w-[420px] min-h-28',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className='grid w-[420px] gap-2'>
      <Label htmlFor='summary'>Clinical Summary</Label>
      <Textarea id='summary' placeholder='Brief summary of current status...' className='min-h-32' />
    </div>
  ),
}

export const ReadOnlyContent: Story = {
  render: () => (
    <Textarea
      readOnly
      className='w-[420px] min-h-32'
      defaultValue='Module 2 updates complete. Waiting for CMC review sign-off.'
    />
  ),
}
