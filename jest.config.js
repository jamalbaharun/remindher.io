/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['./node_modules/ts-jest/dist/legacy/ts-jest-transformer.js', {
      tsconfig: { skipLibCheck: true, esModuleInterop: true },
    }],
  },
}

module.exports = config

