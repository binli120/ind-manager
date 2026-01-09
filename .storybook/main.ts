// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import path, { dirname } from "path";
import { createRequire } from "module"
import type { StorybookConfig } from "@storybook/react-webpack5"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url)

const config: StorybookConfig = {
  stories: ["../components/**/*.mdx", "../components/**/*.stories.@(js|jsx|ts|tsx)"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-links", "@storybook/addon-a11y", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-webpack5",
    options: {
      builder: {
        useSWC: true,
      },
    },
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
  }
}

export default config
