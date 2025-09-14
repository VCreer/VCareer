import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

const oAuthConfig = {
  issuer: 'https://localhost:44385/',
  redirectUri: baseUrl,
  clientId: 'VCareer_App',
  responseType: 'code',
  scope: 'offline_access VCareer',
  requireHttps: true,
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
    },
    AbpAccountPublic: {
      url: oAuthConfig.issuer,
      rootNamespace: 'AbpAccountPublic',
    },
  },
} as Environment;
