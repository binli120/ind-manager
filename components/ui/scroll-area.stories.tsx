// Author: Bin Lee
// Email: binlee120@gmail.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { ScrollArea } from './scroll-area'

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const items = Array.from({ length: 24 }, (_, idx) => `Module section ${idx + 1}`)

export const VerticalList: Story = {
  render: () => (
    <ScrollArea className='h-72 w-72 rounded-md border p-3'>
      <div className='space-y-2'>
        {items.map((item) => (
          <div key={item} className='rounded bg-muted/40 px-2 py-1 text-sm'>
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const WideContent: Story = {
  render: () => (
    <ScrollArea className='h-40 w-[420px] rounded-md border'>
      <div className='w-[900px] p-4 text-sm'>
        This area demonstrates horizontal scrolling behavior for wide table-like content in regulatory views.
      </div>
    </ScrollArea>
  ),
}
