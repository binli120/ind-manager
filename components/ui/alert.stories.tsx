// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { CircleAlert, Info, Terminal } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './alert'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert className='w-[420px]'>
      <Info className='h-4 w-4' />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>
        A newer version is available. Refresh to pick up recent fixes.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant='destructive' className='w-[420px]'>
      <CircleAlert className='h-4 w-4' />
      <AlertTitle>Submission blocked</AlertTitle>
      <AlertDescription>
        Missing required fields in Module 3. Resolve issues before submission.
      </AlertDescription>
    </Alert>
  ),
}

export const TerminalStyle: Story = {
  render: () => (
    <Alert className='w-[420px]'>
      <Terminal className='h-4 w-4' />
      <AlertTitle>Background sync</AlertTitle>
      <AlertDescription>
        Project documents are syncing in the background.
      </AlertDescription>
    </Alert>
  ),
}
