import type { Preview } from "@storybook/react-webpack5"
import React from "react"
import { Provider } from "react-redux"

import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { store } from "@/lib/store"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "white" },
        { name: "dark", value: "#0c0c0c" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen bg-background text-foreground antialiased">
            <Story />
          </div>
        </ThemeProvider>
      </Provider>
    ),
  ],
}

export default preview
