// Author: Bin Lee
// Email: binlee120@gmail.com
import type { Meta, StoryObj } from "@storybook/react-webpack5"

import { DataTable } from "./data-table"

const meta: Meta<typeof DataTable> = {
  title: "Components/DataTable",
  component: DataTable,
  parameters: {
    layout: "centered",
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
