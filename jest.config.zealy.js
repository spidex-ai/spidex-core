module.exports = {
  displayName: 'Zealy Quest Tests',
  testMatch: [
    '**/test/**/*.zealy.spec.ts',
    '**/src/**/*zealy*.spec.ts'
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/modules/user-quest/**/*.(t|j)s',
    'src/database/entities/zealy*.(t|j)s',
    'src/database/repositories/zealy*.(t|j)s',
  ],
  coverageDirectory: './coverage/zealy',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  },
};