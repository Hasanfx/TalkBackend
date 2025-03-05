/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node", // Change to "jsdom" for React/Next.js projects
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    roots: ["<rootDir>/src/tests"], // Change this if your test files are elsewhere
  };
  