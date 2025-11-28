import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

const oAuthConfig = {
  skipOidc: true,
  skipIssuerCheck: true,
};

export const environment = {
  production: false,
  application: {
    baseUrl,
    name: 'VCareer',
  },
  oAuthConfig,
  apis: {
    default: {
      url: 'https://localhost:44385',
      rootNamespace: 'VCareer',
    }
  },
  // API Configuration
  apiUrl: 'http://localhost:3000/api',
  useMockApi: false, // ✅ Tắt MockAPI vì đã có API thật
  mockDelay: 1000,
  debug: true,
} as Environment;