// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Project Name',
    htmlFor: 'project-name',
  },
}

export const WithInput: Story = {
  render: () => (
    <div className='grid w-[360px] gap-2'>
      <Label htmlFor='email'>Contact Email</Label>
      <Input id='email' placeholder='team@company.com' type='email' />
    </div>
  ),
}

export const DisabledField: Story = {
  render: () => (
    <div className='grid w-[360px] gap-2'>
      <Label htmlFor='readonly-field'>IND Number</Label>
      <Input id='readonly-field' defaultValue='IND-2026-001' disabled />
    </div>
  ),
}
