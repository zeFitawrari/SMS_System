const required = ['DATABASE_URL', 'ACCESS_TOKEN_SECRET', 'ACTION_SECRET'];

export const validateEnv = () => {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  if ((process.env.ACCESS_TOKEN_SECRET || '').length < 32) {
    throw new Error('ACCESS_TOKEN_SECRET must be at least 32 characters');
  }
};
