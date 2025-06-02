export function validateEnv() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  // Validate MongoDB URI format
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri?.startsWith('mongodb+srv://')) {
    console.error('MONGODB_URI must be a valid MongoDB Atlas connection string');
    return false;
  }

  console.log('Environment variables validated successfully');
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`MONGODB_URI exists: ${Boolean(process.env.MONGODB_URI)}`);
  
  return true;
} 