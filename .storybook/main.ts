import path from "path"
import { createRequire } from "module"
import type { StorybookConfig } from "@storybook/react-webpack5"

const require = createRequire(import.meta.url)

const config: StorybookConfig = {
  stories: ["../components/**/*.mdx", "../components/**/*.stories.@(js|jsx|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  docs: {
    autodocs: "tag",
  },
  webpackFinal: async (webpackConfig) => {
    const config = webpackConfig
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, ".."),
    }
    config.resolve.extensions = Array.from(new Set([...(config.resolve.extensions || []), ".ts", ".tsx"]))

    config.module = config.module || { rules: [] }
    config.module.rules = config.module.rules || []
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve("babel-loader"),
          options: {
            presets: [
              require.resolve("@babel/preset-env"),
              [
                require.resolve("@babel/preset-react"),
                {
                  runtime: "automatic",
                  importSource: "react",
                },
              ],
              require.resolve("@babel/preset-typescript"),
            ],
          },
        },
      ],
    })

    return config
  },
}

export default config
