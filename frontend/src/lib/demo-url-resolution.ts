/**
 * Demo script showing how dynamic URL resolution works
 * This file demonstrates the behavior in different environments
 */

import { getBaseUrl, buildApiUrl, isRelativeUrl } from './url-utils';
import { API_CONFIG } from '@/config/api';

export function demonstrateUrlResolution() {
  console.log('=== Dynamic URL Resolution Demo ===');
  
  // Show current base URL
  console.log('Current base URL:', getBaseUrl());
  
  // Show how API endpoints are resolved
  console.log('\nAPI Endpoint Resolution:');
  console.log('LOGIN_URL:', API_CONFIG.LOGIN_URL);
  console.log('Resolved:', buildApiUrl(API_CONFIG.LOGIN_URL));
  
  console.log('REFRESH_URL:', API_CONFIG.REFRESH_URL);
  console.log('Resolved:', buildApiUrl(API_CONFIG.REFRESH_URL));
  
  console.log('LOGOUT_URL:', API_CONFIG.LOGOUT_URL);
  console.log('Resolved:', buildApiUrl(API_CONFIG.LOGOUT_URL));
  
  console.log('PROFILE_URL:', API_CONFIG.PROFILE_URL);
  console.log('Resolved:', buildApiUrl(API_CONFIG.PROFILE_URL));
  
  // Show URL type detection
  console.log('\nURL Type Detection:');
  console.log('Is /api/Auth/login relative?', isRelativeUrl('/api/Auth/login'));
  console.log('Is https://example.com/api/Auth/login relative?', isRelativeUrl('https://example.com/api/Auth/login'));
  
  console.log('\n=== End Demo ===');
}

// Example of how this would work in different scenarios
export function simulateDifferentEnvironments() {
  console.log('\n=== Environment Simulation ===');
  
  // Simulate development environment
  console.log('\nDevelopment Environment (localhost:3000):');
  const devBaseUrl = 'http://localhost:3000';
  console.log('Base URL:', devBaseUrl);
  console.log('Login URL:', `${devBaseUrl}/api/Auth/login`);
  
  // Simulate production environment
  console.log('\nProduction Environment (https://myapp.com):');
  const prodBaseUrl = 'https://myapp.com';
  console.log('Base URL:', prodBaseUrl);
  console.log('Login URL:', `${prodBaseUrl}/api/Auth/login`);
  
  // Simulate staging environment
  console.log('\nStaging Environment (https://staging.myapp.com):');
  const stagingBaseUrl = 'https://staging.myapp.com';
  console.log('Base URL:', stagingBaseUrl);
  console.log('Login URL:', `${stagingBaseUrl}/api/Auth/login`);
  
  console.log('\n=== End Environment Simulation ===');
}
