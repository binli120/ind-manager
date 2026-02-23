// Author: Bin Lee
// Email: binlee120@gmail.com
'use client'

import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { useState } from 'react'
import { Label } from './label'
import { Switch } from './switch'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render() {
    const [checked, setChecked] = useState(false)

    return (
      <div className='flex items-center gap-3'>
        <Label htmlFor='auto-save'>Auto-save</Label>
        <Switch id='auto-save' checked={checked} onCheckedChange={setChecked} />
      </div>
    )
  },
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    checked: true,
  },
}
