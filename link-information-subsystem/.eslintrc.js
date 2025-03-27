module.exports = {
  extends: ["plugin:@typescript-eslint/recommended", "plugin:import/typescript", "prettier"],
  plugins: [
    "@typescript-eslint/eslint-plugin",
    "import",
    "unused-imports",
  ],
  parser: "@typescript-eslint/parser",
  rules: {
    "unused-imports/no-unused-imports": "warn",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-unused-vars": "off",
    "no-console": [
      "warn",
      {
        allow: ["warn", "error"],
      },
    ],
    // any型を許容する設定
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
