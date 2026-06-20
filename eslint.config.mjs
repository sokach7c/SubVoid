import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["sub-web/**", "subboost/**"],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["features/clash/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default eslintConfig;
