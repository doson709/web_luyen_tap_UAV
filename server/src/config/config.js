require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'uav_secret_key_zoom_2026_exam_secure_jwt',
  JWT_EXPIRES_IN: '7d',
  SSO_PROVIDER_NAME: process.env.SSO_PROVIDER_NAME || 'UAV Military & Civil SSO',
  SSO_CLIENT_ID: process.env.SSO_CLIENT_ID || 'uav-sso-app-id',
  SSO_MOCK_ENABLED: true
};
