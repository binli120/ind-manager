"use client"

import type { Meta, StoryObj } from "@storybook/react-webpack5"
import { Input } from "./input"
import { Label } from "./label"
import { Search, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    disabled: {
      control: { type: "boolean" },
    },
    placeholder: {
      control: { type: "text" },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
}

export const Password: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Enter your password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    )
  },
}

export const WithIcon: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="search">Search</Label>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input id="search" placeholder="Search..." className="pl-8" />
      </div>
    </div>
  ),
}

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter your email",
  },
}

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter a number",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
  },
}

export const Invalid: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="invalid">Email</Label>
      <Input
        type="email"
        id="invalid"
        placeholder="Enter your email"
        aria-invalid="true"
        defaultValue="invalid-email"
      />
      <p className="text-sm text-destructive">Please enter a valid email address.</p>
    </div>
  ),
}

export const File: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <form className="w-full max-w-sm space-y-4">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="email-form">Email</Label>
        <Input type="email" id="email-form" placeholder="john@example.com" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input type="tel" id="phone" placeholder="+1 (555) 000-0000" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="website">Website</Label>
        <Input type="url" id="website" placeholder="https://example.com" />
      </div>
    </form>
  ),
}
