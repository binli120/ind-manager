import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "./checkbox"
import { Label } from "./label"

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: { type: "boolean" },
    },
    checked: {
      control: { type: "boolean" },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </Label>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="newsletter" />
        <Label htmlFor="newsletter">Subscribe to newsletter</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="marketing" />
        <Label htmlFor="marketing">Receive marketing emails</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="updates" defaultChecked />
        <Label htmlFor="updates">Get product updates</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="required" disabled checked />
        <Label htmlFor="required">Required (cannot be changed)</Label>
      </div>
    </form>
  ),
}

export const CheckboxList: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="font-medium">Select your interests:</div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="tech" />
          <Label htmlFor="tech">Technology</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="design" />
          <Label htmlFor="design">Design</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="business" />
          <Label htmlFor="business">Business</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="science" />
          <Label htmlFor="science">Science</Label>
        </div>
      </div>
    </div>
  ),
}

export const Invalid: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="invalid" aria-invalid="true" />
        <Label htmlFor="invalid">I agree to the terms (required)</Label>
      </div>
      <p className="text-sm text-destructive">You must accept the terms to continue.</p>
    </div>
  ),
}
