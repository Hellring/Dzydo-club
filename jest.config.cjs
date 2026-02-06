require('dotenv').config({ path: '.env' });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
};
