import { execSync } from 'child_process';

// Remove existing lock files and node_modules
console.log('Cleaning up existing files...');
try {
  execSync('rm -f package-lock.json yarn.lock pnpm-lock.yaml');
  execSync('rm -rf node_modules');
} catch (error) {
  console.log('No existing files to clean up');
}

// Install dependencies with proper SWC configuration
console.log('Installing dependencies...');
const dependencies = [
  '@swc/core',
  '@swc/helpers',
  'next',
  '@prisma/client',
  'prisma',
  // Add other dependencies as needed
];

try {
  // Create a basic package.json if it doesn't exist
  const packageJson = {
    name: "eggs-live",
    version: "0.1.0",
    private: true,
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    }
  };
  
  console.log('Creating package.json...');
  execSync(`echo '${JSON.stringify(packageJson, null, 2)}' > package.json`);
  
  // Install dependencies
  console.log('Installing dependencies...');
  dependencies.forEach(dep => {
    execSync(`npm install ${dep}@latest`);
  });
  
  console.log('Dependencies installed successfully!');
  console.log('\nNext steps:');
  console.log('1. Commit the new package.json and package-lock.json files');
  console.log('2. Redeploy your project on Vercel');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
}
