// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import type { Meta, StoryObj } from "@storybook/react-webpack5"

import { CalendarView } from "./calendar-view"

const meta: Meta<typeof CalendarView> = {
  title: "Components/CalendarView",
  component: CalendarView,
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
