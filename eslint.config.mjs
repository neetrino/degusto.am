import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Incremental cleanup: replace `any`, migrate `<img>` to `next/image`, fix hook deps / setState-in-effect.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "jsx-a11y/role-supports-aria-props": "off",
      "no-unused-vars": "off",
      "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],
      "max-lines": ["warn", { max: 900, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", { max: 8 }],
      "max-lines-per-function": [
        "warn",
        { max: 420, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    files: ["next.config.js", "next.config.mjs", "**/*.cjs", "eslint.config.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    files: ["shared/db/**/*.ts", "shared/db/**/*.js", "shared/db/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: [
      "**/app/**/page.tsx",
      "**/app/**/layout.tsx",
      "**/app/**/not-found.tsx",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    files: ["src/scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "max-depth": "off",
    },
  },
  {
    files: ["src/components/Header.tsx"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
];

export default config;
