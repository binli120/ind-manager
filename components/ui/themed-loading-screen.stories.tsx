// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { ThemedLoadingScreen } from './themed-loading-screen'

const meta: Meta<typeof ThemedLoadingScreen> = {
  title: 'UI/ThemedLoadingScreen',
  component: ThemedLoadingScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const FullScreen: Story = {
  args: {
    message: 'Loading workspace...',
    detail: 'Fetching IND projects, modules, and team assignments.',
    fullScreen: true,
  },
}

export const PanelMode: Story = {
  args: {
    message: 'Syncing project data',
    detail: 'Rebuilding local view model and validating permissions.',
    fullScreen: false,
    className: 'rounded-xl',
  },
}
