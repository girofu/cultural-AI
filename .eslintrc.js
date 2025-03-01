module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {},
  overrides: [
    {
      files: ["*.js"],
      parser: "@babel/eslint-parser",
    },
  ],
};
