#!/usr/bin/env node

/**
 * WorkEase CLI - A safe and reliable project generator
 * 
 * SAFETY MEASURES IMPLEMENTED:
 * - No postinstall scripts run Prisma generate during npm install
 * - Prisma commands only run manually after schema is properly set up
 * - Installation process validates package.json for unsafe scripts
 * - Clear separation between dependency installation and database setup
 * 
 * This prevents file system corruption that can occur when Prisma
 * tries to generate without a proper schema during npm install.
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import { Generator } from './utils/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// Safety validation function
async function validateProjectSafety(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      
      if (packageJson.scripts && packageJson.scripts.postinstall) {
        if (packageJson.scripts.postinstall.includes('prisma generate')) {
          console.log(chalk.red('⚠️  DANGER: Unsafe postinstall script detected!'));
          console.log(chalk.yellow('This could cause file system corruption. Removing unsafe script...'));
          
          delete packageJson.scripts.postinstall;
          await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
          
          console.log(chalk.green('✅ Unsafe script removed. Project is now safe.'));
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow('Warning: Could not validate project safety:', error.message));
  }
}

console.log(chalk.blue.bold('🚀 WorkEase CLI - Your productivity toolkit!'));

program
  .name('workease')
  .description('CLI tool for WorkEase framework')
  .version('1.0.0')
  .option('--dry-run', 'Run in simulation mode (no actual file operations)', false)
  .option('--verbose', 'Show detailed output for debugging', false);

program
  .command('init')
  .argument('[name]', 'project name')
  .option('-t, --template <template>', 'project template', 'default')
  .description('Initialize a new WorkEase project')
  .action(async (name, options, command) => {
    const globalOptions = command.parent.opts();
    const isDryRun = globalOptions.dryRun;
    const isVerbose = globalOptions.verbose;
    
    if (isDryRun) {
      console.log(chalk.yellow('🧪 DRY RUN MODE - No actual files will be created'));
    }
    
    try {
      let projectName = name;
      let template = options.template;
      
      if (!projectName || template === 'default') {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'What is your project name?',
            default: projectName || 'my-workease-app',
            when: () => !projectName,
            validate: (input) => {
              if (!input.trim()) return 'Project name is required';
              if (!/^[a-z0-9-_]+$/.test(input)) {
                return 'Project name must contain only lowercase letters, numbers, hyphens, and underscores';
              }
              return true;
            }
          },
          {
            type: 'list',
            name: 'template',
            message: 'Choose a project template:',
            choices: [
              { name: '🚀 Full Stack App - Next.js + TypeScript + Tailwind + Prisma', value: 'fullstack' },
              { name: '⚡ Frontend Only - Next.js + TypeScript + Tailwind', value: 'frontend' },
              { name: '🔧 API Only - Next.js API routes + TypeScript', value: 'api' },
              { name: '📊 Dashboard - Admin panel with auth and CRUD', value: 'dashboard' }
            ],
            when: () => template === 'default'
          }
        ]);
        
        if (!projectName) projectName = answers.projectName;
        if (template === 'default') template = answers.template;
      }

      const spinner = ora('Creating new WorkEase project...').start();
      
      if (isDryRun) {
        spinner.text = 'DRY RUN: Simulating project creation...';
        await simulateProjectCreation(projectName, template);
        spinner.succeed(chalk.yellow('DRY RUN completed - No actual files created'));
        return;
      }
      
      // Check if directory already exists
      if (fs.existsSync(projectName)) {
        spinner.fail(`Directory ${projectName} already exists!`);
        return;
      }

      // Create project directory
      await fs.ensureDir(projectName);
      
      spinner.text = 'Setting up project structure...';
      
      // Create project based on template
      await createProjectFromTemplate(projectName, template);
      
      spinner.text = 'Installing dependencies...';
      
      // Install dependencies
      await installDependencies(projectName, template);
      
      spinner.succeed(chalk.green('Project created successfully!'));
      
      console.log(chalk.yellow('\n📁 Next steps:'));
      console.log(chalk.white(`   cd ${projectName}`));
      
      if (template === 'fullstack' || template === 'dashboard') {
        console.log(chalk.blue('\n🔐 Database Setup (IMPORTANT):'));
        console.log(chalk.white('   npx prisma generate    # Generate Prisma client'));
        console.log(chalk.white('   npx prisma db push     # Create database tables'));
        console.log(chalk.gray('   ⚠️  Always run these AFTER project creation, not during npm install'));
      }
      
      console.log(chalk.yellow('\n🚀 Start Development:'));
      console.log(chalk.white('   npm run dev'));
      console.log(chalk.gray('\n✨ Happy coding with WorkEase!'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error creating project:'), error.message);
    }
  });

program
  .command('generate')
  .alias('g')
  .argument('[type]', 'component type (component, page, api, model)')
  .description('Generate components, pages, API routes, or models')
  .action(async (type) => {
    // Check if we're in a WorkEase project
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error(chalk.red('❌ Not in a valid project directory. Run this command from your project root.'));
      return;
    }

    if (!type) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'generateType',
          message: 'What would you like to generate?',
          choices: [
            { name: '🧩 Component - React component with TypeScript', value: 'component' },
            { name: '📄 Page - Next.js app router page', value: 'page' },
            { name: '🔌 API Route - Next.js API route handler', value: 'api' },
            { name: '🗃️ Model - Database model with CRUD operations', value: 'model' },
            { name: '📊 Data Table - List view with pagination & filtering', value: 'table' },
            { name: '📝 Form - Auto-generated forms from models', value: 'form' },
            { name: '📈 Dashboard - Admin panel with charts & metrics', value: 'dashboard' }
          ]
        }
      ]);
      type = answers.generateType;
    }
    
    console.log(chalk.blue(`🛠️ Generating ${type}...`));
    
    try {
      switch (type.toLowerCase()) {
        case 'component':
        case 'comp':
          await Generator.generateComponent();
          break;
        case 'page':
          await Generator.generatePage();
          break;
        case 'api':
        case 'route':
          await Generator.generateApiRoute();
          break;
        case 'model':
          await Generator.generateModel();
          break;
        case 'table':
          await Generator.generateDataTable();
          break;
        case 'form':
          await Generator.generateForm();
          break;
        case 'dashboard':
          await Generator.generateDashboard();
          break;
        default:
          console.error(chalk.red(`❌ Unknown generator type: ${type}`));
          console.log(chalk.yellow('Available types: component, page, api, model, table, form, dashboard'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Generator error:'), error.message);
    }
  });

// Auth setup command
program
  .command('auth')
  .description('Set up authentication system')
  .option('--provider <provider>', 'Auth provider (nextauth, clerk, supabase)', 'nextauth')
  .option('--database', 'Include database models for users', false)
  .action(async (options) => {
    // Check if we're in a WorkEase project
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error(chalk.red('❌ Not in a valid project directory. Run this command from your project root.'));
      return;
    }

    try {
      await Generator.generateAuthSystem(options);
    } catch (error) {
      console.error(chalk.red('❌ Auth setup error:'), error.message);
    }
  });

async function createProjectFromTemplate(projectName, template) {
  const projectPath = path.resolve(projectName);
  
  // Base package.json structure
  const basePackageJson = {
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    }
  };

  let packageJson = { ...basePackageJson };
  let dependencies = {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  };

  let devDependencies = {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.45.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.1.0"
  };

  // Template-specific configurations
  switch (template) {
    case 'fullstack':
      dependencies = {
        ...dependencies,
        "@tailwindcss/forms": "^0.5.0",
        "tailwindcss": "^3.3.0",
        "autoprefixer": "^10.4.0",
        "postcss": "^8.4.0",
        "@prisma/client": "^5.0.0",
        "bcryptjs": "^2.4.3",
        "@types/bcryptjs": "^2.4.2",
        // UI Component Dependencies
        "clsx": "^2.0.0",
        "tailwind-merge": "^2.0.0",
        "class-variance-authority": "^0.7.0",
        "lucide-react": "^0.400.0",
        // Form & Validation Dependencies  
        "@hookform/resolvers": "^3.3.0",
        "react-hook-form": "^7.47.0",
        "zod": "^3.22.0",
        // Chart Dependencies
        "recharts": "^2.8.0",
        // Additional UI Dependencies
        "@radix-ui/react-slot": "^1.0.2",
        "@radix-ui/react-tabs": "^1.0.4",
        "@radix-ui/react-select": "^2.0.0",
        "@radix-ui/react-switch": "^1.0.3",
        "tailwindcss-animate": "^1.0.7"
      };
      devDependencies = {
        ...devDependencies,
        "prisma": "^5.0.0"
      };
      packageJson.scripts = {
  ...packageJson.scripts,
  "db:generate": "prisma generate", 
  "db:setup": "prisma generate && prisma db push",
  "db:check": "prisma validate && echo 'Schema is valid'"
};
      break;

    case 'frontend':
      dependencies = {
        ...dependencies,
        "@tailwindcss/forms": "^0.5.0",
        "tailwindcss": "^3.3.0",
        "autoprefixer": "^10.4.0",
        "postcss": "^8.4.0"
      };
      break;

    case 'api':
      dependencies = {
        ...dependencies,
        "@prisma/client": "^5.0.0",
        "bcryptjs": "^2.4.3",
        "@types/bcryptjs": "^2.4.2"
      };
      devDependencies = {
        ...devDependencies,
        "prisma": "^5.0.0"
      };
      packageJson.scripts = {
  ...packageJson.scripts,
  "db:generate": "prisma generate", 
  "db:setup": "prisma generate && prisma db push",
  "db:check": "prisma validate && echo 'Schema is valid'"
};
      break;

    case 'dashboard':
      dependencies = {
        ...dependencies,
        "@tailwindcss/forms": "^0.5.0",
        "tailwindcss": "^3.3.0",
        "autoprefixer": "^10.4.0",
        "postcss": "^8.4.0",
        "@prisma/client": "^5.0.0",
        "bcryptjs": "^2.4.3",
        "@types/bcryptjs": "^2.4.2",
        "lucide-react": "^0.290.0",
        "@headlessui/react": "^1.7.0"
      };
      devDependencies = {
        ...devDependencies,
        "prisma": "^5.0.0"
      };
      packageJson.scripts = {
  ...packageJson.scripts,
  "db:generate": "prisma generate",
  "db:setup": "prisma generate && prisma db push",
  "db:check": "prisma validate && echo 'Schema is valid'",
  "postinstall": "echo '✅ WorkEase dashboard project created successfully! Run: npm run db:setup to initialize database'"
};
      break;
  }

  packageJson.dependencies = dependencies;
  packageJson.devDependencies = devDependencies;

  // Write package.json
  await fs.writeJSON(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

  // Create directory structure
  await fs.ensureDir(path.join(projectPath, 'src/app'));
  await fs.ensureDir(path.join(projectPath, 'src/components'));
  await fs.ensureDir(path.join(projectPath, 'src/lib'));

  if (template === 'fullstack' || template === 'api' || template === 'dashboard') {
    await fs.ensureDir(path.join(projectPath, 'prisma'));
  }

  // Create configuration files
  await createConfigFiles(projectPath, template);
  
  // Create app structure
  await createAppStructure(projectPath, template);

  // Create UI components for templates that need them
  if (['fullstack', 'dashboard'].includes(template)) {
    await createUIComponents(projectPath);
  }

  // Create basic files
  await fs.writeFile(path.join(projectPath, 'README.md'), generateReadme(projectName, template));
  await fs.writeFile(path.join(projectPath, '.gitignore'), generateGitignore());

  if (template === 'fullstack' || template === 'api' || template === 'dashboard') {
    await createPrismaSchema(projectPath, template);
  }
}

async function createConfigFiles(projectPath, template) {
  // TypeScript config
  const tsConfig = {
    compilerOptions: {
      lib: ["dom", "dom.iterable", "es6"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [
        {
          name: "next"
        }
      ],
      baseUrl: ".",
      paths: {
        "@/*": ["./src/*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  };

  await fs.writeJSON(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });

  // Next.js config
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
`;

  await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig);

  // Tailwind config (if needed)
  if (['fullstack', 'frontend', 'dashboard'].includes(template)) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require("tailwindcss-animate"),
  ],
}
`;

    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

    await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig);
    await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig);

    // Global styles
    const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;

    await fs.ensureDir(path.join(projectPath, 'src/app'));
    await fs.writeFile(path.join(projectPath, 'src/app/globals.css'), globalCss);
  }
}

async function createAppStructure(projectPath, template) {
  // Root layout
  const layoutContent = `import type { Metadata } from 'next'
${['fullstack', 'frontend', 'dashboard'].includes(template) ? "import './globals.css'" : ''}

export const metadata: Metadata = {
  title: 'WorkEase App',
  description: 'Built with WorkEase Framework',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body${['fullstack', 'frontend', 'dashboard'].includes(template) ? ' className="min-h-screen"' : ''}>{children}</body>
    </html>
  )
}
`;

  await fs.writeFile(path.join(projectPath, 'src/app/layout.tsx'), layoutContent);

  // Home page based on template
  let pageContent = '';

  switch (template) {
    case 'fullstack':
    case 'dashboard':
      pageContent = `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Your WorkEase App
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your full-stack application is ready! Start building amazing features.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Database ready with Prisma</li>
                <li>TypeScript configured</li>
                <li>Tailwind CSS for styling</li>
                <li>API routes set up</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📚 Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Helpful links to get you productive quickly:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>WorkEase Documentation</li>
                <li>Next.js App Router Guide</li>
                <li>Prisma Documentation</li>
                <li>Tailwind CSS Reference</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}`;
      break;

    case 'frontend':
      pageContent = `export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to Your WorkEase Frontend
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          A modern frontend application built with Next.js, TypeScript, and Tailwind CSS.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">⚡ Fast</h3>
            <p className="text-gray-600">Optimized for performance with Next.js</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🎨 Beautiful</h3>
            <p className="text-gray-600">Styled with Tailwind CSS</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🔒 Type Safe</h3>
            <p className="text-gray-600">Built with TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  )
}`;
      break;

    case 'api':
      pageContent = `export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          WorkEase API Server
        </h1>
        
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">API Endpoints:</h2>
          <ul className="space-y-2">
            <li><code className="bg-white px-2 py-1 rounded">GET /api/health</code> - Health check</li>
            <li><code className="bg-white px-2 py-1 rounded">GET /api/users</code> - Get all users</li>
            <li><code className="bg-white px-2 py-1 rounded">POST /api/users</code> - Create user</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            🚀 Your API server is ready! Start building your endpoints.
          </p>
        </div>
      </div>
    </div>
  )
}`;
      break;
  }

  await fs.writeFile(path.join(projectPath, 'src/app/page.tsx'), pageContent);

  // Create UI components for dashboard and fullstack
  if (template === 'dashboard' || template === 'fullstack') {
    await fs.ensureDir(path.join(projectPath, 'src/components/ui'));
    
    const cardComponent = `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
`;

    await fs.writeFile(path.join(projectPath, 'src/components/ui/card.tsx'), cardComponent);

    // Utils
    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwindcss-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

    await fs.writeFile(path.join(projectPath, 'src/lib/utils.ts'), utilsContent);
  }

  // API routes for API and fullstack templates
  if (['api', 'fullstack', 'dashboard'].includes(template)) {
    await fs.ensureDir(path.join(projectPath, 'src/app/api/health'));
    
    const healthRoute = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'WorkEase API is running'
  });
}
`;

    await fs.writeFile(path.join(projectPath, 'src/app/api/health/route.ts'), healthRoute);
  }
}

async function createPrismaSchema(projectPath, template) {
  const schemaContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

${template === 'dashboard' ? `
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
` : ''}
`;

  await fs.writeFile(path.join(projectPath, 'prisma/schema.prisma'), schemaContent);
}

function generateReadme(projectName, template) {
  return `# ${projectName}

A ${template} application built with WorkEase Framework.

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
\`\`\`

${template === 'fullstack' || template === 'dashboard' || template === 'api' ? `
Set up the database:

\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`
` : ''}

Then, run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- \`src/app/\` - Next.js App Router pages and layouts
- \`src/components/\` - Reusable React components
- \`src/lib/\` - Utility functions and configurations${template === 'fullstack' || template === 'dashboard' || template === 'api' ? `
- \`prisma/\` - Database schema and migrations` : ''}

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety${['fullstack', 'frontend', 'dashboard'].includes(template) ? `
- [Tailwind CSS](https://tailwindcss.com/) - Styling` : ''}${template === 'fullstack' || template === 'dashboard' || template === 'api' ? `
- [Prisma](https://prisma.io/) - Database ORM` : ''}

## WorkEase CLI

Generate new components, pages, and API routes:

\`\`\`bash
npx myframework generate
\`\`\`

Learn more at [WorkEase Documentation](https://workease-framework.com/docs)
`;
}

function generateGitignore() {
  return `# Dependencies
node_modules/
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# database
/prisma/dev.db
/prisma/dev.db-journal
`;
}

async function createUIComponents(projectPath) {
  // Create src/lib/utils.ts
  const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;

  await fs.ensureDir(path.join(projectPath, 'src/lib'));
  await fs.writeFile(path.join(projectPath, 'src/lib/utils.ts'), utilsContent);

  // Create UI components directory
  await fs.ensureDir(path.join(projectPath, 'src/components/ui'));

  // Create Button component
  const buttonContent = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/button.tsx'), buttonContent);

  // Create Card component
  const cardContent = `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/card.tsx'), cardContent);

  // Add other essential UI components
  await createFormComponents(projectPath);
  await createInputComponents(projectPath);
}

async function createFormComponents(projectPath) {
  const formContent = `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: \`\${id}-form-item\`,
    formDescriptionId: \`\${id}-form-item-description\`,
    formMessageId: \`\${id}-form-item-message\`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? \`\${formDescriptionId}\`
          : \`\${formDescriptionId} \${formMessageId}\`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormField,
  FormMessage,
}`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/form.tsx'), formContent);

  // Create Label component
  const labelContent = `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/label.tsx'), labelContent);
}

async function createInputComponents(projectPath) {
  // Create Input component
  const inputContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/input.tsx'), inputContent);

  // Create Textarea component
  const textareaContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/textarea.tsx'), textareaContent);

  // Create Select component (simplified version)
  const selectContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

// For compatibility with Radix UI Select API
export const SelectTrigger = Select
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectItem = ({ children, value }: { children: React.ReactNode, value: string }) => (
  <option value={value}>{children}</option>
)
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder}</option>

export { Select }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/select.tsx'), selectContent);

  // Create Switch component (simplified)
  const switchContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Switch.displayName = "Switch"

export { Switch }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/switch.tsx'), switchContent);

  // Create basic Tabs component
  const tabsContent = `import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props} />
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/tabs.tsx'), tabsContent);

  // Add the missing Badge component
  const badgeContent = `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }`;

  await fs.writeFile(path.join(projectPath, 'src/components/ui/badge.tsx'), badgeContent);
}

async function installDependencies(projectName, template) {
  try {
    const projectPath = path.resolve(projectName);
    
    // Read package.json to ensure no unsafe postinstall scripts
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await fs.readJSON(packageJsonPath);
    
    // Safety check: Remove any postinstall scripts that run prisma generate
    if (packageJson.scripts && packageJson.scripts.postinstall) {
      if (packageJson.scripts.postinstall.includes('prisma generate')) {
        console.log(chalk.yellow('⚠️  Removing unsafe postinstall script to prevent file system issues'));
        delete packageJson.scripts.postinstall;
        await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
      }
    }
    
    // Install dependencies using npm
    console.log(chalk.blue('📦 Installing dependencies...'));
    
    await execa('npm', ['install'], {
      cwd: projectPath,
      stdio: 'inherit'
    });
    
    console.log(chalk.green('✅ Dependencies installed successfully'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to install dependencies:'), error.message);
    console.log(chalk.yellow('💡 You can manually install dependencies by running: npm install'));
  }
}

// Safety command to check existing projects
program
  .command('check')
  .alias('safety')
  .description('Check current project for safety issues')
  .action(async () => {
    console.log(chalk.blue('🔍 Running WorkEase safety check...'));
    
    try {
      await validateProjectSafety(process.cwd());
      console.log(chalk.green('✅ Project safety check completed'));
    } catch (error) {
      console.error(chalk.red('❌ Safety check failed:'), error.message);
    }
  });

// Virtual testing command
program
  .command('test')
  .alias('virtual')
  .description('Run CLI in virtual mode for safe testing')
  .option('--template <template>', 'Template to test', 'fullstack')
  .action(async (options) => {
    console.log(chalk.blue.bold('🧪 Virtual Testing Mode - No Real File Operations'));
    console.log(chalk.gray('This simulates CLI operations without touching your file system\n'));
    
    const testProjectName = 'virtual-test-project';
    
    console.log(chalk.yellow('📋 What would happen with real execution:'));
    console.log(chalk.white(`   Project: ${testProjectName}`));
    console.log(chalk.white(`   Template: ${options.template}`));
    
    // Simulate project creation
    console.log(chalk.blue('\n🔍 Simulating project creation...'));
    
    try {
      await simulateProjectCreation(testProjectName, options.template);
      console.log(chalk.green('\n✅ Virtual test completed successfully!'));
      console.log(chalk.gray('No files were actually created on your system.'));
    } catch (error) {
      console.error(chalk.red('❌ Virtual test failed:'), error.message);
    }
  });

// Virtual simulation function for safe testing
async function simulateProjectCreation(projectName, template) {
  console.log(chalk.blue('📁 Would create directory:'), chalk.white(projectName));
  
  // Simulate package.json analysis
  console.log(chalk.blue('📄 Would generate package.json with scripts:'));
  
  const baseScripts = {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint"
  };
  
  let additionalScripts = {};
  
  switch (template) {
    case 'fullstack':
      additionalScripts = {
        "db:generate": "prisma generate",
        "db:setup": "prisma generate && prisma db push",
        "db:check": "prisma validate && echo 'Schema is valid'"
      };
      break;
    case 'api':
      additionalScripts = {
        "db:generate": "prisma generate",
        "db:setup": "prisma generate && prisma db push", 
        "db:check": "prisma validate && echo 'Schema is valid'"
      };
      break;
    case 'dashboard':
      additionalScripts = {
        "db:generate": "prisma generate",
        "db:setup": "prisma generate && prisma db push",
        "db:check": "prisma validate && echo 'Schema is valid'",
        "postinstall": "echo '✅ WorkEase dashboard project created successfully! Run: npm run db:setup to initialize database'"
      };
      break;
  }
  
  const allScripts = { ...baseScripts, ...additionalScripts };
  
  Object.entries(allScripts).forEach(([script, command]) => {
    const isPostinstall = script === 'postinstall';
    const isSafe = !command.includes('prisma generate') || !isPostinstall;
    const status = isSafe ? chalk.green('✅ SAFE') : chalk.red('⚠️  POTENTIALLY UNSAFE');
    
    console.log(`   ${chalk.cyan(script)}: ${chalk.gray(command)} ${status}`);
  });
  
  // Safety analysis
  console.log(chalk.blue('\n🔒 Safety Analysis:'));
  
  const hasUnsafePostinstall = additionalScripts.postinstall && 
    additionalScripts.postinstall.includes('prisma generate');
    
  if (hasUnsafePostinstall) {
    console.log(chalk.red('❌ DANGER: postinstall script runs Prisma generate'));
    console.log(chalk.yellow('   This could cause file system corruption!'));
  } else {
    console.log(chalk.green('✅ No unsafe postinstall scripts detected'));
  }
  
  console.log(chalk.blue('\n📦 Would install dependencies:'));
  console.log(chalk.gray('   - next, react, typescript (base)'));
  
  if (['fullstack', 'api', 'dashboard'].includes(template)) {
    console.log(chalk.gray('   - @prisma/client, prisma (database)'));
  }
  
  if (['fullstack', 'frontend', 'dashboard'].includes(template)) {
    console.log(chalk.gray('   - tailwindcss, autoprefixer (styling)'));
  }
  
  console.log(chalk.blue('\n📁 Would create file structure:'));
  console.log(chalk.gray('   ├── src/app/'));
  console.log(chalk.gray('   ├── src/components/'));
  console.log(chalk.gray('   ├── src/lib/'));
  
  if (['fullstack', 'api', 'dashboard'].includes(template)) {
    console.log(chalk.gray('   ├── prisma/'));
  }
  
  console.log(chalk.gray('   ├── package.json'));
  console.log(chalk.gray('   ├── tsconfig.json'));
  console.log(chalk.gray('   └── README.md'));
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000));
}

program.parse();
