// Author: Bin Lee
// Email: binlee120@gmail.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue='overview' className='w-[520px]'>
      <TabsList>
        <TabsTrigger value='overview'>Overview</TabsTrigger>
        <TabsTrigger value='team'>Team</TabsTrigger>
        <TabsTrigger value='timeline'>Timeline</TabsTrigger>
      </TabsList>
      <TabsContent value='overview' className='rounded-md border p-4 text-sm'>
        High-level project metrics and status indicators.
      </TabsContent>
      <TabsContent value='team' className='rounded-md border p-4 text-sm'>
        Owner, CMC lead, clinical lead, and regulatory owner assignments.
      </TabsContent>
      <TabsContent value='timeline' className='rounded-md border p-4 text-sm'>
        Milestones: pre-IND meeting, submission target, and review checkpoints.
      </TabsContent>
    </Tabs>
  ),
}

export const Compact: Story = {
  render: () => (
    <Tabs defaultValue='notes' className='w-[360px]'>
      <TabsList>
        <TabsTrigger value='notes'>Notes</TabsTrigger>
        <TabsTrigger value='tasks'>Tasks</TabsTrigger>
      </TabsList>
      <TabsContent value='notes' className='rounded-md border p-3 text-sm'>
        Notes content
      </TabsContent>
      <TabsContent value='tasks' className='rounded-md border p-3 text-sm'>
        Tasks content
      </TabsContent>
    </Tabs>
  ),
}
