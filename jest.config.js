// jest.config.js
module.exports = {
  preset: 'ts-jest', // Use ts-jest preset
  testEnvironment: 'node', // Or 'jsdom' if you're testing browser-specific code (e.g., React components)
  roots: ['<rootDir>/src'], // Tell Jest where to look for your source and test files
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)?$', // Pattern to find test files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Extensions Jest should process
  transform: {
    '^.+\\.ts$': 'ts-jest', // Transform .ts files with ts-jest
  },
  // You might also need to configure moduleNameMapper for path aliases if you use them in your tsconfig.json
  // moduleNameMapper: {
  //   "^@/(.*)$": "<rootDir>/src/$1"
  // },
};