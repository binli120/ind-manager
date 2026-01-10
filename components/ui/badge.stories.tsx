import type { Meta, StoryObj } from "@storybook/react-webpack5"
import { Badge } from "./badge"
import { Check, X, AlertTriangle } from "lucide-react"

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "secondary", "destructive", "outline"],
    },
    asChild: {
      control: { type: "boolean" },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: "Badge",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Check className="w-3 h-3" />
        Success
      </>
    ),
  },
}

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">
        <Check className="w-3 h-3" />
        Complete
      </Badge>
      <Badge variant="secondary">
        <AlertTriangle className="w-3 h-3" />
        Warning
      </Badge>
      <Badge variant="destructive">
        <X className="w-3 h-3" />
        Error
      </Badge>
      <Badge variant="outline">Pending</Badge>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const Numbers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>1</Badge>
      <Badge variant="secondary">99+</Badge>
      <Badge variant="outline">New</Badge>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge asChild>
        <a href="#" className="cursor-pointer">
          Clickable Badge
        </a>
      </Badge>
      <Badge asChild>
        <button className="cursor-pointer">Button Badge</button>
      </Badge>
    </div>
  ),
}
