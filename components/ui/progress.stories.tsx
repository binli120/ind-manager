// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import type { Meta, StoryObj } from "@storybook/react-webpack5"
import { Progress } from "./progress"
import { useEffect, useState } from "react"

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 33,
    className: "w-[60%]",
  },
}

export const Empty: Story = {
  args: {
    value: 0,
    className: "w-[60%]",
  },
}

export const Half: Story = {
  args: {
    value: 50,
    className: "w-[60%]",
  },
}

export const Complete: Story = {
  args: {
    value: 100,
    className: "w-[60%]",
  },
}

export const Animated: Story = {
  render: function Render() {
    const [progress, setProgress] = useState(13)

    useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500)
      return () => clearTimeout(timer)
    }, [])

    return <Progress value={progress} className="w-[60%]" />
  },
}

export const LoadingSimulation: Story = {
  render: function Render() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0 // Reset to 0 when complete
          }
          return prev + 1
        })
      }, 100)

      return () => clearInterval(interval)
    }, [])

    return (
      <div className="w-[60%] space-y-2">
        <div className="flex justify-between text-sm">
          <span>Loading...</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    )
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="w-[60%] space-y-4">
      <div className="space-y-1">
        <p className="text-sm">Small (h-1)</p>
        <Progress value={75} className="h-1" />
      </div>

      <div className="space-y-1">
        <p className="text-sm">Default (h-2)</p>
        <Progress value={75} />
      </div>

      <div className="space-y-1">
        <p className="text-sm">Large (h-3)</p>
        <Progress value={75} className="h-3" />
      </div>

      <div className="space-y-1">
        <p className="text-sm">Extra Large (h-4)</p>
        <Progress value={75} className="h-4" />
      </div>
    </div>
  ),
}

export const WithLabels: Story = {
  render: () => (
    <div className="w-[60%] space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Project Progress</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Upload Progress</span>
          <span>60%</span>
        </div>
        <Progress value={60} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Installation</span>
          <span>90%</span>
        </div>
        <Progress value={90} />
      </div>
    </div>
  ),
}

export const MultipleProgress: Story = {
  render: () => (
    <div className="w-[60%] space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium">Task Progress</h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Design</span>
              <span>100%</span>
            </div>
            <Progress value={100} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Development</span>
              <span>75%</span>
            </div>
            <Progress value={75} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Testing</span>
              <span>30%</span>
            </div>
            <Progress value={30} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Deployment</span>
              <span>0%</span>
            </div>
            <Progress value={0} />
          </div>
        </div>
      </div>
    </div>
  ),
}
