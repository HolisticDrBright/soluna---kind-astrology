const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // `react/no-unescaped-entities` is a React DOM rule: in the browser an
      // unescaped `'` or `"` in JSX text can be ambiguous in HTML. React Native
      // has no DOM — apostrophes/quotes inside <Text> render correctly and are
      // idiomatic — so the rule is a false positive in this codebase.
      "react/no-unescaped-entities": "off",
    },
  },
]);
