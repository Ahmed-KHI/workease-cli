import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { TemplateEngine } from './template-engine.js';

export class Generator {
  static async generateComponent() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'componentName',
        message: 'Component name:',
        validate: (input) => {
          if (!input.trim()) return 'Component name is required';
          if (!/^[A-Za-z][A-Za-z0-9]*$/.test(input)) {
            return 'Component name must be a valid identifier (letters and numbers only)';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'location',
        message: 'Where should the component be created?',
        choices: [
          { name: 'src/components', value: 'src/components' },
          { name: 'src/components/ui', value: 'src/components/ui' },
          { name: 'src/app/components', value: 'src/app/components' },
          { name: 'Custom path', value: 'custom' }
        ]
      },
      {
        type: 'input',
        name: 'customPath',
        message: 'Enter custom path:',
        when: (answers) => answers.location === 'custom',
        validate: (input) => input.trim() ? true : 'Custom path is required'
      }
    ]);

    const componentName = TemplateEngine.toPascalCase(answers.componentName);
    const kebabName = TemplateEngine.toKebabCase(componentName);
    const outputDir = answers.customPath || answers.location;
    const outputPath = path.join(process.cwd(), outputDir, `${componentName}.tsx`);

    // Check if component already exists
    if (await fs.pathExists(outputPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Component ${componentName} already exists. Overwrite?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('⚠️  Component generation cancelled.'));
        return;
      }
    }

    const variables = {
      componentName,
      kebabName
    };

    try {
      await TemplateEngine.generateFromTemplate('component.tsx', outputPath, variables);
      console.log(chalk.green(`✅ Component ${componentName} created at ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('❌ Error creating component:'), error.message);
    }
  }

  static async generatePage() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'pageName',
        message: 'Page name:',
        validate: (input) => {
          if (!input.trim()) return 'Page name is required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'pageTitle',
        message: 'Page title (for metadata):',
        default: (answers) => TemplateEngine.toPascalCase(answers.pageName)
      },
      {
        type: 'input',
        name: 'pageDescription',
        message: 'Page description (for metadata):',
        default: (answers) => `${answers.pageTitle} page description`
      },
      {
        type: 'input',
        name: 'route',
        message: 'Route path (e.g., "about", "dashboard/settings"):',
        default: (answers) => TemplateEngine.toKebabCase(answers.pageName)
      }
    ]);

    const pageName = TemplateEngine.toPascalCase(answers.pageName);
    const routePath = answers.route.startsWith('/') ? answers.route.slice(1) : answers.route;
    const outputDir = path.join(process.cwd(), 'src', 'app', routePath);
    const outputPath = path.join(outputDir, 'page.tsx');

    // Check if page already exists
    if (await fs.pathExists(outputPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Page at route /${routePath} already exists. Overwrite?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('⚠️  Page generation cancelled.'));
        return;
      }
    }

    const variables = {
      pageName,
      pageTitle: answers.pageTitle,
      pageDescription: answers.pageDescription
    };

    try {
      await TemplateEngine.generateFromTemplate('page.tsx', outputPath, variables);
      console.log(chalk.green(`✅ Page ${pageName} created at /${routePath}`));
      console.log(chalk.blue(`🌐 Visit: http://localhost:3000/${routePath}`));
    } catch (error) {
      console.error(chalk.red('❌ Error creating page:'), error.message);
    }
  }

  static async generateApiRoute() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'routeName',
        message: 'API route name:',
        validate: (input) => {
          if (!input.trim()) return 'API route name is required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'routePath',
        message: 'API route path (e.g., "users", "auth/login"):',
        default: (answers) => TemplateEngine.toKebabCase(answers.routeName)
      },
      {
        type: 'checkbox',
        name: 'methods',
        message: 'Which HTTP methods do you need?',
        choices: [
          { name: 'GET', value: 'GET', checked: true },
          { name: 'POST', value: 'POST', checked: true },
          { name: 'PUT', value: 'PUT', checked: false },
          { name: 'DELETE', value: 'DELETE', checked: false }
        ],
        validate: (input) => input.length > 0 ? true : 'Select at least one HTTP method'
      }
    ]);

    const routeName = TemplateEngine.toPascalCase(answers.routeName);
    const routePath = answers.routePath.startsWith('/') ? answers.routePath.slice(1) : answers.routePath;
    const outputDir = path.join(process.cwd(), 'src', 'app', 'api', routePath);
    const outputPath = path.join(outputDir, 'route.ts');

    // Check if API route already exists
    if (await fs.pathExists(outputPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `API route /api/${routePath} already exists. Overwrite?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('⚠️  API route generation cancelled.'));
        return;
      }
    }

    const variables = {
      routeName: routeName
    };

    try {
      // Load template and filter methods
      let template = await TemplateEngine.loadTemplate('api-route.ts');
      
      // Remove unwanted HTTP methods
      const allMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      const unwantedMethods = allMethods.filter(method => !answers.methods.includes(method));
      
      unwantedMethods.forEach(method => {
        const methodRegex = new RegExp(`export async function ${method}.*?^}`, 'gms');
        template = template.replace(methodRegex, '');
      });

      // Clean up extra newlines
      template = template.replace(/\n{3,}/g, '\n\n');
      
      const content = TemplateEngine.replaceVariables(template, variables);
      
      await fs.ensureDir(outputDir);
      await fs.writeFile(outputPath, content);
      
      console.log(chalk.green(`✅ API route created at /api/${routePath}`));
      console.log(chalk.blue(`🌐 Test endpoints:`));
      answers.methods.forEach(method => {
        console.log(chalk.gray(`   ${method} http://localhost:3000/api/${routePath}`));
      });
    } catch (error) {
      console.error(chalk.red('❌ Error creating API route:'), error.message);
    }
  }

  static async generateModel() {
    console.log(chalk.blue('\n🗄️  Model Generator - Database Schema Creation'));
    console.log(chalk.gray('Create complete database models with relationships, validations, and CRUD operations.\n'));

    // Get model name
    const { modelName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelName',
        message: 'Model name:',
        validate: (input) => {
          if (!input.trim()) return 'Model name is required';
          if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input.trim())) {
            return 'Model name must start with a letter and contain only letters and numbers';
          }
          return true;
        }
      }
    ]);

    const modelConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Model description:',
        default: `${TemplateEngine.toPascalCase(modelName)} data model`
      },
      {
        type: 'checkbox',
        name: 'fields',
        message: 'Select standard fields to include:',
        choices: [
          { name: 'id (Primary Key)', value: 'id', checked: true },
          { name: 'createdAt (Timestamp)', value: 'createdAt', checked: true },
          { name: 'updatedAt (Timestamp)', value: 'updatedAt', checked: true },
          { name: 'name (String)', value: 'name' },
          { name: 'email (String)', value: 'email' },
          { name: 'description (Text)', value: 'description' },
          { name: 'isActive (Boolean)', value: 'isActive' },
          { name: 'userId (Foreign Key)', value: 'userId' }
        ]
      },
      {
        type: 'input',
        name: 'customFields',
        message: 'Custom fields (format: fieldName:type, comma-separated):',
        default: ''
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Additional features to generate:',
        choices: [
          { name: 'CRUD API routes', value: 'crud', checked: true },
          { name: 'TypeScript types', value: 'types', checked: true },
          { name: 'Validation schemas', value: 'validation', checked: true },
          { name: 'Database seeder', value: 'seeder' },
          { name: 'Test files', value: 'tests' }
        ]
      }
    ]);

    try {
      const modelPascal = TemplateEngine.toPascalCase(modelName);
      const variables = {
        name: modelPascal,
        nameKebab: TemplateEngine.toKebabCase(modelName),
        nameCamel: TemplateEngine.toCamelCase(modelName),
        nameLower: modelName.toLowerCase(),
        description: modelConfig.description,
        timestamp: new Date().toISOString()
      };

      // Generate Prisma model schema
      await this.generatePrismaModel(modelPascal, modelConfig, variables);
      
      // Generate additional features if requested
      if (modelConfig.features.includes('types')) {
        await this.generateModelTypes(modelPascal, modelConfig, variables);
      }
      
      if (modelConfig.features.includes('crud')) {
        await this.generateCrudRoutes(modelPascal, modelConfig, variables);
      }
      
      if (modelConfig.features.includes('validation')) {
        await this.generateValidationSchemas(modelPascal, modelConfig, variables);
      }
      
      if (modelConfig.features.includes('seeder')) {
        await this.generateModelSeeder(modelPascal, modelConfig, variables);
      }
      
      console.log(chalk.green(`✅ Model '${modelPascal}' generated successfully!`));
      
      // Show next steps
      console.log(chalk.blue('\n📋 Next Steps:'));
      console.log(chalk.gray('1. Run: npx prisma db push (to apply schema changes)'));
      console.log(chalk.gray('2. Run: npx prisma generate (to update Prisma client)'));
      if (modelConfig.features.includes('seeder')) {
        console.log(chalk.gray('3. Run: npm run seed (to populate sample data)'));
      }
      console.log(chalk.gray('4. Restart your development server\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating model:'), error.message);
    }
  }

  static async generatePrismaModel(modelName, config, variables) {
    
    // Build field definitions
    let fields = [];
    
    // Standard fields
    if (config.fields.includes('id')) fields.push('  id        String   @id @default(cuid())');
    if (config.fields.includes('name')) fields.push('  name      String');
    if (config.fields.includes('email')) fields.push('  email     String   @unique');
    if (config.fields.includes('description')) fields.push('  description String?');
    if (config.fields.includes('isActive')) fields.push('  isActive  Boolean  @default(true)');
    if (config.fields.includes('userId')) fields.push('  userId    String?');
    if (config.fields.includes('createdAt')) fields.push('  createdAt DateTime @default(now())');
    if (config.fields.includes('updatedAt')) fields.push('  updatedAt DateTime @updatedAt');
    
    // Custom fields
    if (config.customFields.trim()) {
      const customFields = config.customFields.split(',').map(field => {
        const [name, type] = field.trim().split(':');
        if (name && type) {
          const prismaType = type.toLowerCase() === 'string' ? 'String' : 
                           type.toLowerCase() === 'int' ? 'Int' :
                           type.toLowerCase() === 'boolean' ? 'Boolean' :
                           type.toLowerCase() === 'datetime' ? 'DateTime' : 'String';
          return `  ${name.trim().padEnd(8)} ${prismaType}`;
        }
        return null;
      }).filter(Boolean);
      fields.push(...customFields);
    }
    
    // Relations
    if (config.fields.includes('userId')) {
      fields.push('  user      User?    @relation(fields: [userId], references: [id])');
    }

    const schemaContent = `
model ${modelName} {
${fields.join('\n')}

  @@map("${variables.nameKebab}")
}
`;

    // Check if schema.prisma exists
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (await fs.pathExists(schemaPath)) {
      // Append to existing schema
      const existingSchema = await fs.readFile(schemaPath, 'utf8');
      await fs.writeFile(schemaPath, existingSchema + schemaContent);
    } else {
      // Create new schema with base configuration
      const fullSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
${schemaContent}`;
      
      await fs.ensureDir(path.dirname(schemaPath));
      await fs.writeFile(schemaPath, fullSchema);
    }

    console.log(chalk.green(`📄 Prisma model added to schema.prisma`));
  }

  static async generateModelTypes(modelName, config, variables) {
    
    const typeContent = `// Generated types for ${modelName} model
export interface ${modelName} {
  id: string;
${config.fields.includes('name') ? '  name: string;' : ''}
${config.fields.includes('email') ? '  email: string;' : ''}
${config.fields.includes('description') ? '  description?: string;' : ''}
${config.fields.includes('isActive') ? '  isActive: boolean;' : ''}
${config.fields.includes('userId') ? '  userId?: string;' : ''}
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${modelName}Input {
${config.fields.includes('name') ? '  name: string;' : ''}
${config.fields.includes('email') ? '  email: string;' : ''}
${config.fields.includes('description') ? '  description?: string;' : ''}
${config.fields.includes('isActive') ? '  isActive?: boolean;' : ''}
${config.fields.includes('userId') ? '  userId?: string;' : ''}
}

export interface Update${modelName}Input {
${config.fields.includes('name') ? '  name?: string;' : ''}
${config.fields.includes('email') ? '  email?: string;' : ''}
${config.fields.includes('description') ? '  description?: string;' : ''}
${config.fields.includes('isActive') ? '  isActive?: boolean;' : ''}
${config.fields.includes('userId') ? '  userId?: string;' : ''}
}
`;

    const typesPath = path.join(process.cwd(), 'src', 'types', `${variables.nameKebab}.ts`);
    await fs.ensureDir(path.dirname(typesPath));
    await fs.writeFile(typesPath, typeContent);
    
    console.log(chalk.green(`📄 TypeScript types created at src/types/${variables.nameKebab}.ts`));
  }

  static async generateCrudRoutes(modelName, config, variables) {
    
    const crudContent = `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/${variables.nameKebab} - List all ${variables.nameLower}s
export async function GET(request: NextRequest) {
  try {
    const ${variables.nameCamel}s = await prisma.${variables.nameCamel}.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(${variables.nameCamel}s);
  } catch (error) {
    console.error('Error fetching ${variables.nameLower}s:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ${variables.nameLower}s' },
      { status: 500 }
    );
  }
}

// POST /api/${variables.nameKebab} - Create new ${variables.nameLower}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const ${variables.nameCamel} = await prisma.${variables.nameCamel}.create({
      data: body
    });
    
    return NextResponse.json(${variables.nameCamel}, { status: 201 });
  } catch (error) {
    console.error('Error creating ${variables.nameLower}:', error);
    return NextResponse.json(
      { error: 'Failed to create ${variables.nameLower}' },
      { status: 500 }
    );
  }
}`;

    const crudPath = path.join(process.cwd(), 'src', 'app', 'api', variables.nameKebab, 'route.ts');
    await fs.ensureDir(path.dirname(crudPath));
    await fs.writeFile(crudPath, crudContent);
    
    // Generate individual item routes (by ID)
    const itemContent = `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/${variables.nameKebab}/[id] - Get single ${variables.nameLower}
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ${variables.nameCamel} = await prisma.${variables.nameCamel}.findUnique({
      where: { id: params.id }
    });
    
    if (!${variables.nameCamel}) {
      return NextResponse.json(
        { error: '${modelName} not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(${variables.nameCamel});
  } catch (error) {
    console.error('Error fetching ${variables.nameLower}:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ${variables.nameLower}' },
      { status: 500 }
    );
  }
}

// PUT /api/${variables.nameKebab}/[id] - Update ${variables.nameLower}
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const ${variables.nameCamel} = await prisma.${variables.nameCamel}.update({
      where: { id: params.id },
      data: body
    });
    
    return NextResponse.json(${variables.nameCamel});
  } catch (error) {
    console.error('Error updating ${variables.nameLower}:', error);
    return NextResponse.json(
      { error: 'Failed to update ${variables.nameLower}' },
      { status: 500 }
    );
  }
}

// DELETE /api/${variables.nameKebab}/[id] - Delete ${variables.nameLower}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.${variables.nameCamel}.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ${variables.nameLower}:', error);
    return NextResponse.json(
      { error: 'Failed to delete ${variables.nameLower}' },
      { status: 500 }
    );
  }
}`;

    const itemPath = path.join(process.cwd(), 'src', 'app', 'api', variables.nameKebab, '[id]', 'route.ts');
    await fs.ensureDir(path.dirname(itemPath));
    await fs.writeFile(itemPath, itemContent);
    
    console.log(chalk.green(`🌐 CRUD API routes created:`));
    console.log(chalk.gray(`   GET    /api/${variables.nameKebab}`));
    console.log(chalk.gray(`   POST   /api/${variables.nameKebab}`));
    console.log(chalk.gray(`   GET    /api/${variables.nameKebab}/[id]`));
    console.log(chalk.gray(`   PUT    /api/${variables.nameKebab}/[id]`));
    console.log(chalk.gray(`   DELETE /api/${variables.nameKebab}/[id]`));
  }

  static async generateValidationSchemas(modelName, config, variables) {
    
    const validationContent = `import { z } from 'zod';

// Validation schema for creating ${modelName}
export const create${modelName}Schema = z.object({
${config.fields.includes('name') ? '  name: z.string().min(1, "Name is required"),' : ''}
${config.fields.includes('email') ? '  email: z.string().email("Invalid email format"),' : ''}
${config.fields.includes('description') ? '  description: z.string().optional(),' : ''}
${config.fields.includes('isActive') ? '  isActive: z.boolean().optional().default(true),' : ''}
${config.fields.includes('userId') ? '  userId: z.string().optional(),' : ''}
});

// Validation schema for updating ${modelName}
export const update${modelName}Schema = z.object({
${config.fields.includes('name') ? '  name: z.string().min(1, "Name is required").optional(),' : ''}
${config.fields.includes('email') ? '  email: z.string().email("Invalid email format").optional(),' : ''}
${config.fields.includes('description') ? '  description: z.string().optional(),' : ''}
${config.fields.includes('isActive') ? '  isActive: z.boolean().optional(),' : ''}
${config.fields.includes('userId') ? '  userId: z.string().optional(),' : ''}
});

export type Create${modelName}Input = z.infer<typeof create${modelName}Schema>;
export type Update${modelName}Input = z.infer<typeof update${modelName}Schema>;
`;

    const validationPath = path.join(process.cwd(), 'src', 'lib', 'validations', `${variables.nameKebab}.ts`);
    await fs.ensureDir(path.dirname(validationPath));
    await fs.writeFile(validationPath, validationContent);
    
    console.log(chalk.green(`✅ Validation schemas created at src/lib/validations/${variables.nameKebab}.ts`));
  }

  static async generateModelSeeder(modelName, config, variables) {
    
    const seederContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed${modelName}() {
  console.log('Seeding ${modelName} data...');
  
  const sampleData = [
    {
${config.fields.includes('name') ? `      name: "Sample ${modelName} 1",` : ''}
${config.fields.includes('email') ? `      email: "sample1@example.com",` : ''}
${config.fields.includes('description') ? `      description: "This is a sample ${variables.nameLower}",` : ''}
${config.fields.includes('isActive') ? `      isActive: true,` : ''}
    },
    {
${config.fields.includes('name') ? `      name: "Sample ${modelName} 2",` : ''}
${config.fields.includes('email') ? `      email: "sample2@example.com",` : ''}
${config.fields.includes('description') ? `      description: "Another sample ${variables.nameLower}",` : ''}
${config.fields.includes('isActive') ? `      isActive: true,` : ''}
    },
  ];

  for (const data of sampleData) {
    await prisma.${variables.nameCamel}.upsert({
      where: { ${config.fields.includes('email') ? 'email: data.email' : `name: data.name || "Sample"`} },
      update: {},
      create: data,
    });
  }
  
  console.log('${modelName} seeding completed!');
}
`;

    const seederPath = path.join(process.cwd(), 'prisma', 'seeders', `${variables.nameKebab}.ts`);
    await fs.ensureDir(path.dirname(seederPath));
    await fs.writeFile(seederPath, seederContent);
    
    console.log(chalk.green(`🌱 Database seeder created at prisma/seeders/${variables.nameKebab}.ts`));
  }

  static async generateAuthSystem(options = {}) {
    
    console.log(chalk.blue('\n🔐 Authentication System Setup'));
    console.log(chalk.gray('Set up complete authentication with login, registration, and user management.\n'));

    // Get auth configuration from user
    const authConfig = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Choose authentication provider:',
        choices: [
          { name: 'NextAuth.js - Popular, flexible, secure', value: 'nextauth' },
          { name: 'Clerk - Managed auth service', value: 'clerk' },
          { name: 'Supabase Auth - Open source alternative', value: 'supabase' },
          { name: 'Custom JWT - Build your own', value: 'custom' }
        ],
        default: options.provider || 'nextauth'
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'What auth features do you need?',
        choices: [
          { name: 'Email/Password login', value: 'credentials', checked: true },
          { name: 'Google OAuth', value: 'google' },
          { name: 'GitHub OAuth', value: 'github' },
          { name: 'User registration', value: 'registration', checked: true },
          { name: 'Password reset', value: 'reset' },
          { name: 'Email verification', value: 'verification' },
          { name: 'User profiles', value: 'profiles', checked: true },
          { name: 'Role-based access', value: 'rbac' }
        ]
      },
      {
        type: 'confirm',
        name: 'includeDatabase',
        message: 'Include database models for users?',
        default: options.database || true
      },
      {
        type: 'confirm',
        name: 'includeUI',
        message: 'Generate auth UI components (login, signup forms)?',
        default: true
      }
    ]);

    try {
      console.log(chalk.blue(`\n🚀 Setting up ${authConfig.provider} authentication...`));
      
      // Generate auth system based on provider
      switch (authConfig.provider) {
        case 'nextauth':
          await this.generateNextAuth(authConfig);
          break;
        case 'clerk':
          await this.generateClerkAuth(authConfig);
          break;
        case 'supabase':
          await this.generateSupabaseAuth(authConfig);
          break;
        case 'custom':
          await this.generateCustomAuth(authConfig);
          break;
      }
      
      console.log(chalk.green('\n✅ Authentication system generated successfully!'));
      
      // Show next steps
      console.log(chalk.blue('\n📋 Next Steps:'));
      console.log(chalk.gray('1. Install new dependencies: npm install'));
      if (authConfig.includeDatabase) {
        console.log(chalk.gray('2. Update database: npx prisma db push'));
        console.log(chalk.gray('3. Generate Prisma client: npx prisma generate'));
      }
      console.log(chalk.gray('4. Set up environment variables (see .env.example)'));
      console.log(chalk.gray('5. Restart your development server\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error setting up authentication:'), error.message);
    }
  }

  static async generateNextAuth(config) {
    
    // NextAuth configuration
    const authOptions = `import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
${config.features.includes('google') ? "import GoogleProvider from 'next-auth/providers/google';" : ''}
${config.features.includes('github') ? "import GitHubProvider from 'next-auth/providers/github';" : ''}
${config.includeDatabase ? "import { PrismaAdapter } from '@next-auth/prisma-adapter';" : ''}
${config.includeDatabase ? "import { PrismaClient } from '@prisma/client';" : ''}
import bcrypt from 'bcryptjs';

${config.includeDatabase ? 'const prisma = new PrismaClient();' : ''}

export const authOptions: NextAuthOptions = {
${config.includeDatabase ? '  adapter: PrismaAdapter(prisma),' : ''}
  providers: [
${config.features.includes('credentials') ? `    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        ${config.includeDatabase ? `
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
        ` : `
        // TODO: Implement user lookup and password verification
        if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
          return { id: '1', email: 'admin@example.com', name: 'Admin User' };
        }
        return null;
        `}
      }
    }),` : ''}
${config.features.includes('google') ? `    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),` : ''}
${config.features.includes('github') ? `    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),` : ''}
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
`;

    // Save NextAuth configuration
    const authConfigPath = path.join(process.cwd(), 'src', 'lib', 'auth.ts');
    await fs.ensureDir(path.dirname(authConfigPath));
    await fs.writeFile(authConfigPath, authOptions);
    
    // Generate API route
    const apiRoute = `import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
`;

    const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
    await fs.ensureDir(path.dirname(apiPath));
    await fs.writeFile(apiPath, apiRoute);

    if (config.includeDatabase) {
      await this.generateUserModel(config);
    }

    if (config.includeUI) {
      await this.generateAuthUI(config, 'nextauth');
    }

    // Update package.json dependencies
    await this.updatePackageJsonForAuth('nextauth', config);

    console.log(chalk.green('📁 NextAuth.js setup complete'));
  }

  static async generateUserModel(config) {
    
    const userModel = `
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?
  image         String?
  ${config.features.includes('rbac') ? 'role          String    @default("USER")' : ''}
  ${config.features.includes('profiles') ? `
  profile       Profile?
  ` : ''}
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

${config.features.includes('profiles') ? `
model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  bio       String?
  website   String?
  location  String?
  birthday  DateTime?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profiles")
}
` : ''}
`;

    // Check if schema.prisma exists and append the models
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (await fs.pathExists(schemaPath)) {
      const existingSchema = await fs.readFile(schemaPath, 'utf8');
      if (!existingSchema.includes('model User')) {
        await fs.writeFile(schemaPath, existingSchema + userModel);
      }
    } else {
      const fullSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
${userModel}`;
      
      await fs.ensureDir(path.dirname(schemaPath));
      await fs.writeFile(schemaPath, fullSchema);
    }

    console.log(chalk.green('📄 User database models created'));
  }

  static async generateAuthUI(config, provider) {
    
    // Login component
    const loginComponent = `'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      ${config.features.includes('google') || config.features.includes('github') ? `
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          ${config.features.includes('google') ? `
          <button
            onClick={() => signIn('google')}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Google
          </button>
          ` : ''}
          ${config.features.includes('github') ? `
          <button
            onClick={() => signIn('github')}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            GitHub
          </button>
          ` : ''}
        </div>
      </div>
      ` : ''}
    </div>
  );
}
`;

    const loginPath = path.join(process.cwd(), 'src', 'components', 'auth', 'LoginForm.tsx');
    await fs.ensureDir(path.dirname(loginPath));
    await fs.writeFile(loginPath, loginComponent);

    // Sign in page
    const signinPage = `import LoginForm from '@/components/auth/LoginForm';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
`;

    const signinPath = path.join(process.cwd(), 'src', 'app', 'auth', 'signin', 'page.tsx');
    await fs.ensureDir(path.dirname(signinPath));
    await fs.writeFile(signinPath, signinPage);

    console.log(chalk.green('🎨 Authentication UI components created'));
  }

  static async updatePackageJsonForAuth(provider, config) {
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Add dependencies based on provider
    const newDependencies = {};
    
    switch (provider) {
      case 'nextauth':
        newDependencies['next-auth'] = '^4.24.0';
        newDependencies['@next-auth/prisma-adapter'] = '^1.0.7';
        newDependencies['bcryptjs'] = '^2.4.3';
        break;
      case 'clerk':
        newDependencies['@clerk/nextjs'] = '^4.29.0';
        break;
      case 'supabase':
        newDependencies['@supabase/supabase-js'] = '^2.38.0';
        newDependencies['@supabase/auth-helpers-nextjs'] = '^0.8.7';
        break;
    }

    // Add dev dependencies
    const newDevDependencies = {};
    if (provider === 'nextauth') {
      newDevDependencies['@types/bcryptjs'] = '^2.4.6';
    }

    // Update package.json
    packageJson.dependencies = { ...packageJson.dependencies, ...newDependencies };
    packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDependencies };

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    console.log(chalk.green('📦 Package.json updated with auth dependencies'));
  }

  static async generateClerkAuth(config) {
    console.log(chalk.yellow('🚧 Clerk integration coming soon!'));
  }

  static async generateSupabaseAuth(config) {
    console.log(chalk.yellow('🚧 Supabase integration coming soon!'));
  }

  static async generateCustomAuth(config) {
    console.log(chalk.yellow('🚧 Custom JWT auth coming soon!'));
  }

  static async generateDataTable() {
    console.log(chalk.blue('\n📊 Data Table Generator - List Views with Advanced Features'));
    console.log(chalk.gray('Generate complete data tables with pagination, sorting, filtering, and CRUD operations.\n'));

    // Get table configuration
    const tableConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelName',
        message: 'Model name for the data table:',
        validate: (input) => {
          if (!input.trim()) return 'Model name is required';
          if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input.trim())) {
            return 'Model name must start with a letter and contain only letters and numbers';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'tableName',
        message: 'Table component name:',
        default: (answers) => `${TemplateEngine.toPascalCase(answers.modelName)}Table`
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select table features:',
        choices: [
          { name: 'Pagination', value: 'pagination', checked: true },
          { name: 'Sorting', value: 'sorting', checked: true },
          { name: 'Filtering', value: 'filtering', checked: true },
          { name: 'Search', value: 'search', checked: true },
          { name: 'CRUD Actions (Edit, Delete)', value: 'crud', checked: true },
          { name: 'Bulk Operations', value: 'bulk' },
          { name: 'Export to CSV', value: 'export' },
          { name: 'Real-time Updates', value: 'realtime' }
        ]
      },
      {
        type: 'checkbox',
        name: 'columns',
        message: 'Select columns to display (you can customize later):',
        choices: [
          { name: 'ID', value: 'id' },
          { name: 'Name', value: 'name', checked: true },
          { name: 'Email', value: 'email' },
          { name: 'Description', value: 'description' },
          { name: 'Status/Active', value: 'isActive', checked: true },
          { name: 'Created Date', value: 'createdAt', checked: true },
          { name: 'Updated Date', value: 'updatedAt' }
        ]
      }
    ]);

    try {
      const modelPascal = TemplateEngine.toPascalCase(tableConfig.modelName);
      const tablePascal = TemplateEngine.toPascalCase(tableConfig.tableName);
      const variables = {
        modelName: modelPascal,
        modelCamel: TemplateEngine.toCamelCase(tableConfig.modelName),
        modelKebab: TemplateEngine.toKebabCase(tableConfig.modelName),
        tableName: tablePascal,
        tableCamel: TemplateEngine.toCamelCase(tableConfig.tableName),
        tableKebab: TemplateEngine.toKebabCase(tableConfig.tableName),
        features: tableConfig.features,
        columns: tableConfig.columns
      };

      await this.generateTableComponent(variables);
      await this.generateTableHooks(variables);
      
      if (tableConfig.features.includes('filtering')) {
        await this.generateTableFilters(variables);
      }

      console.log(chalk.green(`✅ Data table '${tablePascal}' generated successfully!`));
      console.log(chalk.blue('\n📋 Usage:'));
      console.log(chalk.gray(`Import: import { ${tablePascal} } from '@/components/tables/${variables.tableKebab}';`));
      console.log(chalk.gray(`Use: <${tablePascal} />`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating data table:'), error.message);
    }
  }

  static async generateTableComponent(variables) {
    const tableComponent = `'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
${variables.features.includes('search') ? "import { Search } from 'lucide-react';" : ''}
${variables.features.includes('crud') ? "import { Edit, Trash2, Plus } from 'lucide-react';" : ''}
${variables.features.includes('sorting') ? "import { ArrowUpDown } from 'lucide-react';" : ''}
import { use${variables.modelName}Table } from '@/hooks/use-${variables.tableKebab}';

interface ${variables.tableName}Props {
  className?: string;
  ${variables.features.includes('crud') ? 'onEdit?: (item: any) => void;' : ''}
  ${variables.features.includes('crud') ? 'onDelete?: (item: any) => void;' : ''}
  ${variables.features.includes('crud') ? 'onCreate?: () => void;' : ''}
}

export function ${variables.tableName}({ 
  className,
  ${variables.features.includes('crud') ? 'onEdit,' : ''}
  ${variables.features.includes('crud') ? 'onDelete,' : ''}
  ${variables.features.includes('crud') ? 'onCreate' : ''}
}: ${variables.tableName}Props) {
  const {
    data,
    loading,
    error,
    ${variables.features.includes('pagination') ? 'page, setPage, totalPages,' : ''}
    ${variables.features.includes('search') ? 'searchQuery, setSearchQuery,' : ''}
    ${variables.features.includes('sorting') ? 'sortField, sortOrder, handleSort,' : ''}
    ${variables.features.includes('filtering') ? 'filters, setFilters,' : ''}
    refetch
  } = use${variables.modelName}Table();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading data: {error}</p>
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className={\`space-y-4 \${className}\`}>
      {/* Header with search and actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">${variables.modelName} Management</h2>
          ${variables.features.includes('search') ? `
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search ${variables.modelCamel}s..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          ` : ''}
        </div>
        
        ${variables.features.includes('crud') ? `
        <div className="flex space-x-2">
          <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add ${variables.modelName}
          </Button>
        </div>
        ` : ''}
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              ${variables.columns.map(col => {
                const colName = col === 'isActive' ? 'Status' : col.charAt(0).toUpperCase() + col.slice(1);
                if (variables.features.includes('sorting')) {
                  return `<TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('${col}')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  ${colName}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>`;
                } else {
                  return `<TableHead>${colName}</TableHead>`;
                }
              }).join('\n              ')}
              ${variables.features.includes('crud') ? '<TableHead className="text-right">Actions</TableHead>' : ''}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={${variables.columns.length + (variables.features.includes('crud') ? 1 : 0)}} className="text-center py-8">
                  No ${variables.modelCamel}s found.
                </TableCell>
              </TableRow>
            ) : (
              data?.map((item: any) => (
                <TableRow key={item.id}>
                  ${variables.columns.map(col => {
                    if (col === 'createdAt' || col === 'updatedAt') {
                      return `<TableCell>{new Date(item.${col}).toLocaleDateString()}</TableCell>`;
                    } else if (col === 'isActive') {
                      return `<TableCell>
                    <span className={\`px-2 py-1 rounded-full text-xs \${
                      item.${col} 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }\`}>
                      {item.${col} ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>`;
                    } else {
                      return `<TableCell>{item.${col} || '-'}</TableCell>`;
                    }
                  }).join('\n                  ')}
                  ${variables.features.includes('crud') ? `
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  ` : ''}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      ${variables.features.includes('pagination') ? `
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      ` : ''}
    </div>
  );
}`;

    const tablePath = path.join(process.cwd(), 'src', 'components', 'tables', `${variables.tableKebab}.tsx`);
    await fs.ensureDir(path.dirname(tablePath));
    await fs.writeFile(tablePath, tableComponent);

    console.log(chalk.green(`📄 Data table component created at src/components/tables/${variables.tableKebab}.tsx`));
  }

  static async generateTableHooks(variables) {
    const hookContent = `import { useState, useEffect } from 'react';

export interface Use${variables.modelName}TableOptions {
  ${variables.features.includes('pagination') ? 'pageSize?: number;' : ''}
  ${variables.features.includes('search') ? 'debounceMs?: number;' : ''}
}

export function use${variables.modelName}Table(options: Use${variables.modelName}TableOptions = {}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  ${variables.features.includes('pagination') ? `
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = options.pageSize || 10;
  ` : ''}
  
  ${variables.features.includes('search') ? `
  const [searchQuery, setSearchQuery] = useState('');
  ` : ''}
  
  ${variables.features.includes('sorting') ? `
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  ` : ''}

  ${variables.features.includes('filtering') ? `
  const [filters, setFilters] = useState<Record<string, any>>({});
  ` : ''}

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = \`/api/${variables.modelKebab}\`;
      const params = new URLSearchParams();

      ${variables.features.includes('pagination') ? `
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      ` : ''}

      ${variables.features.includes('search') ? `
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      ` : ''}

      ${variables.features.includes('sorting') ? `
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);
      ` : ''}

      ${variables.features.includes('filtering') ? `
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      ` : ''}

      if (params.toString()) {
        url += \`?\${params.toString()}\`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch ${variables.modelCamel}s: \${response.statusText}\`);
      }

      const result = await response.json();
      
      ${variables.features.includes('pagination') ? `
      if (result.data) {
        setData(result.data);
        setTotalPages(Math.ceil(result.total / pageSize));
      } else {
        setData(result);
      }
      ` : `
      setData(result);
      `}
      
    } catch (err) {
      console.error('Error fetching ${variables.modelCamel}s:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  ${variables.features.includes('sorting') ? `
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  ` : ''}

  const refetch = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [
    ${variables.features.includes('pagination') ? 'page, pageSize,' : ''}
    ${variables.features.includes('search') ? 'searchQuery,' : ''}
    ${variables.features.includes('sorting') ? 'sortField, sortOrder,' : ''}
    ${variables.features.includes('filtering') ? 'filters' : ''}
  ]);

  return {
    data,
    loading,
    error,
    ${variables.features.includes('pagination') ? 'page, setPage, totalPages,' : ''}
    ${variables.features.includes('search') ? 'searchQuery, setSearchQuery,' : ''}
    ${variables.features.includes('sorting') ? 'sortField, sortOrder, handleSort,' : ''}
    ${variables.features.includes('filtering') ? 'filters, setFilters,' : ''}
    refetch
  };
}`;

    const hookPath = path.join(process.cwd(), 'src', 'hooks', `use-${variables.tableKebab}.ts`);
    await fs.ensureDir(path.dirname(hookPath));
    await fs.writeFile(hookPath, hookContent);

    console.log(chalk.green(`🪝 Table hook created at src/hooks/use-${variables.tableKebab}.ts`));
  }

  static async generateForm() {
    console.log(chalk.blue('\n📝 Form Generator - Smart Forms from Models'));
    console.log(chalk.gray('Generate complete forms with validation, TypeScript types, and CRUD operations.\n'));

    const formConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelName',
        message: 'Model name for the form:',
        validate: (input) => {
          if (!input.trim()) return 'Model name is required';
          if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input.trim())) {
            return 'Model name must start with a letter and contain only letters and numbers';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'formType',
        message: 'Form type:',
        choices: [
          { name: 'Create Form - For creating new records', value: 'create' },
          { name: 'Edit Form - For updating existing records', value: 'edit' },
          { name: 'Combined Form - Handles both create and edit', value: 'combined' }
        ]
      },
      {
        type: 'checkbox',
        name: 'fields',
        message: 'Select fields to include in form:',
        choices: [
          { name: 'Name', value: 'name', checked: true },
          { name: 'Email', value: 'email' },
          { name: 'Description', value: 'description', checked: true },
          { name: 'Status/Active', value: 'isActive', checked: true },
          { name: 'Category', value: 'category' },
          { name: 'Price', value: 'price' },
          { name: 'Tags', value: 'tags' }
        ]
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Form features:',
        choices: [
          { name: 'Client-side validation', value: 'validation', checked: true },
          { name: 'File upload support', value: 'upload' },
          { name: 'Auto-save drafts', value: 'autosave' },
          { name: 'Multi-step wizard', value: 'wizard' },
          { name: 'Rich text editor', value: 'richtext' },
          { name: 'Date/time pickers', value: 'datepicker' }
        ]
      }
    ]);

    try {
      const modelPascal = TemplateEngine.toPascalCase(formConfig.modelName);
      const variables = {
        modelName: modelPascal,
        modelCamel: TemplateEngine.toCamelCase(formConfig.modelName),
        modelKebab: TemplateEngine.toKebabCase(formConfig.modelName),
        formType: formConfig.formType,
        fields: formConfig.fields,
        features: formConfig.features,
        formName: `${modelPascal}Form`
      };

      await this.generateFormComponent(variables);
      await this.generateFormTypes(variables);
      
      if (formConfig.features.includes('validation')) {
        await this.generateFormValidation(variables);
      }

      console.log(chalk.green(`✅ Form '${variables.formName}' generated successfully!`));
      console.log(chalk.blue('\n📋 Usage:'));
      console.log(chalk.gray(`Import: import { ${variables.formName} } from '@/components/forms/${variables.modelKebab}-form';`));
      if (formConfig.formType === 'combined') {
        console.log(chalk.gray(`Create: <${variables.formName} mode="create" onSubmit={handleCreate} />`));
        console.log(chalk.gray(`Edit: <${variables.formName} mode="edit" initialData={data} onSubmit={handleUpdate} />`));
      } else {
        console.log(chalk.gray(`Use: <${variables.formName} onSubmit={handleSubmit} />`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error generating form:'), error.message);
    }
  }

  static async generateFormComponent(variables) {
    const formComponent = `'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
${variables.features.includes('datepicker') ? "import { Calendar } from '@/components/ui/calendar';" : ''}
${variables.features.includes('richtext') ? "import { RichTextEditor } from '@/components/ui/rich-text-editor';" : ''}
import { ${variables.formType === 'combined' ? `create${variables.modelName}Schema, update${variables.modelName}Schema` : `${variables.formType}${variables.modelName}Schema`} } from '@/lib/validations/${variables.modelKebab}';
import { ${variables.modelName}${variables.formType === 'combined' ? ', Create' + variables.modelName + 'Input, Update' + variables.modelName + 'Input' : 'Input'} } from '@/types/${variables.modelKebab}';

interface ${variables.formName}Props {
  ${variables.formType === 'combined' ? "mode: 'create' | 'edit';" : ''}
  ${variables.formType === 'edit' || variables.formType === 'combined' ? `initialData?: ${variables.modelName};` : ''}
  onSubmit: (data: ${variables.formType === 'combined' ? 'Create' + variables.modelName + 'Input | Update' + variables.modelName + 'Input' : variables.modelName + 'Input'}) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export function ${variables.formName}({
  ${variables.formType === 'combined' ? 'mode,' : ''}
  ${variables.formType === 'edit' || variables.formType === 'combined' ? 'initialData,' : ''}
  onSubmit,
  onCancel,
  loading = false,
  className
}: ${variables.formName}Props) {
  ${variables.features.includes('autosave') ? 'const [lastSaved, setLastSaved] = useState<Date | null>(null);' : ''}
  
  const form = useForm<${variables.formType === 'combined' ? 'Create' + variables.modelName + 'Input | Update' + variables.modelName + 'Input' : variables.modelName + 'Input'}>({
    resolver: zodResolver(${variables.formType === 'combined' ? `mode === 'create' ? create${variables.modelName}Schema : update${variables.modelName}Schema` : `${variables.formType}${variables.modelName}Schema`}),
    defaultValues: ${variables.formType === 'edit' || variables.formType === 'combined' ? `initialData || ` : ''}{
      ${variables.fields.includes('name') ? "name: ''," : ''}
      ${variables.fields.includes('email') ? "email: ''," : ''}
      ${variables.fields.includes('description') ? "description: ''," : ''}
      ${variables.fields.includes('isActive') ? "isActive: true," : ''}
      ${variables.fields.includes('category') ? "category: ''," : ''}
      ${variables.fields.includes('price') ? "price: 0," : ''}
      ${variables.fields.includes('tags') ? "tags: []," : ''}
    }
  });

  ${variables.features.includes('autosave') ? `
  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Debounce auto-save
      const timeoutId = setTimeout(() => {
        if (${variables.formType === 'combined' ? 'mode === "edit" && initialData' : 'initialData'}) {
          localStorage.setItem(\`form-draft-\${${variables.formType === 'combined' ? 'initialData?.id' : 'initialData.id'}}\`, JSON.stringify(value));
          setLastSaved(new Date());
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    });
    
    return () => subscription.unsubscribe();
  }, [form, ${variables.formType === 'combined' ? 'mode, initialData' : 'initialData'}]);
  ` : ''}

  const handleSubmit = async (data: ${variables.formType === 'combined' ? 'Create' + variables.modelName + 'Input | Update' + variables.modelName + 'Input' : variables.modelName + 'Input'}) => {
    try {
      await onSubmit(data);
      
      ${variables.features.includes('autosave') ? `
      // Clear draft on successful submission
      if (${variables.formType === 'combined' ? 'mode === "edit" && initialData' : 'initialData'}) {
        localStorage.removeItem(\`form-draft-\${${variables.formType === 'combined' ? 'initialData?.id' : 'initialData.id'}}\`);
      }
      ` : ''}
      
      ${variables.formType === 'create' ? "form.reset();" : ''}
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className={\`space-y-6 \${className}\`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          ${variables.formType === 'combined' ? `{mode === 'create' ? 'Create' : 'Edit'} ${variables.modelName}` : `${variables.formType === 'create' ? 'Create New' : 'Edit'} ${variables.modelName}`}
        </h2>
        
        ${variables.features.includes('autosave') ? `
        {lastSaved && (
          <p className="text-sm text-gray-500">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
        ` : ''}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${variables.fields.includes('name') ? `
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            ` : ''}
            
            ${variables.fields.includes('email') ? `
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            ` : ''}
            
            ${variables.fields.includes('category') ? `
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            ` : ''}
            
            ${variables.fields.includes('price') ? `
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            ` : ''}
          </div>

          ${variables.fields.includes('description') ? `
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  ${variables.features.includes('richtext') ? `
                  <RichTextEditor {...field} />
                  ` : `
                  <Textarea 
                    placeholder="Enter description" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                  `}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          ` : ''}

          ${variables.fields.includes('isActive') ? `
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Enable or disable this ${variables.modelCamel}
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          ` : ''}

          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : ${variables.formType === 'combined' ? `mode === 'create' ? 'Create ${variables.modelName}' : 'Update ${variables.modelName}'` : `'${variables.formType === 'create' ? 'Create' : 'Update'} ${variables.modelName}'`}}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}`;

    const formPath = path.join(process.cwd(), 'src', 'components', 'forms', `${variables.modelKebab}-form.tsx`);
    await fs.ensureDir(path.dirname(formPath));
    await fs.writeFile(formPath, formComponent);

    console.log(chalk.green(`📝 Form component created at src/components/forms/${variables.modelKebab}-form.tsx`));
  }

  static async generateFormTypes(variables) {
    const typesContent = `// Form-specific types for ${variables.modelName}
export interface ${variables.modelName}FormData {
  ${variables.fields.includes('name') ? 'name: string;' : ''}
  ${variables.fields.includes('email') ? 'email: string;' : ''}
  ${variables.fields.includes('description') ? 'description?: string;' : ''}
  ${variables.fields.includes('isActive') ? 'isActive: boolean;' : ''}
  ${variables.fields.includes('category') ? 'category: string;' : ''}
  ${variables.fields.includes('price') ? 'price: number;' : ''}
  ${variables.fields.includes('tags') ? 'tags: string[];' : ''}
}

${variables.formType === 'combined' ? `
export type Create${variables.modelName}FormData = Omit<${variables.modelName}FormData, 'id' | 'createdAt' | 'updatedAt'>;
export type Update${variables.modelName}FormData = Partial<Create${variables.modelName}FormData>;
` : `
export type ${variables.modelName}${variables.formType === 'create' ? 'Create' : 'Update'}FormData = ${variables.formType === 'create' ? `Omit<${variables.modelName}FormData, 'id' | 'createdAt' | 'updatedAt'>` : `Partial<${variables.modelName}FormData>`};
`}`;

    const typesPath = path.join(process.cwd(), 'src', 'types', `${variables.modelKebab}-form.ts`);
    await fs.ensureDir(path.dirname(typesPath));
    await fs.writeFile(typesPath, typesContent);

    console.log(chalk.green(`📄 Form types created at src/types/${variables.modelKebab}-form.ts`));
  }

  static async generateFormValidation(variables) {
    const validationContent = `import { z } from 'zod';

// Form validation schema for ${variables.modelName}
export const ${variables.modelName.toLowerCase()}FormSchema = z.object({
  ${variables.fields.includes('name') ? "name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters')," : ''}
  ${variables.fields.includes('email') ? "email: z.string().email('Invalid email address')," : ''}
  ${variables.fields.includes('description') ? "description: z.string().max(500, 'Description must be less than 500 characters').optional()," : ''}
  ${variables.fields.includes('isActive') ? "isActive: z.boolean().default(true)," : ''}
  ${variables.fields.includes('category') ? "category: z.string().min(1, 'Category is required')," : ''}
  ${variables.fields.includes('price') ? "price: z.number().min(0, 'Price must be positive').max(999999.99, 'Price is too high')," : ''}
  ${variables.fields.includes('tags') ? "tags: z.array(z.string()).optional().default([])," : ''}
});

${variables.formType === 'combined' ? `
export const create${variables.modelName}FormSchema = ${variables.modelName.toLowerCase()}FormSchema;
export const update${variables.modelName}FormSchema = ${variables.modelName.toLowerCase()}FormSchema.partial();
` : `
export const ${variables.formType}${variables.modelName}FormSchema = ${variables.formType === 'create' ? `${variables.modelName.toLowerCase()}FormSchema` : `${variables.modelName.toLowerCase()}FormSchema.partial()`};
`}

export type ${variables.modelName}FormInput = z.infer<typeof ${variables.modelName.toLowerCase()}FormSchema>;
${variables.formType === 'combined' ? `
export type Create${variables.modelName}FormInput = z.infer<typeof create${variables.modelName}FormSchema>;
export type Update${variables.modelName}FormInput = z.infer<typeof update${variables.modelName}FormSchema>;
` : `
export type ${variables.modelName}${variables.formType === 'create' ? 'Create' : 'Update'}FormInput = z.infer<typeof ${variables.formType}${variables.modelName}FormSchema>;
`}`;

    const validationPath = path.join(process.cwd(), 'src', 'lib', 'validations', `${variables.modelKebab}-form.ts`);
    await fs.ensureDir(path.dirname(validationPath));
    await fs.writeFile(validationPath, validationContent);

    console.log(chalk.green(`✅ Form validation schemas created at src/lib/validations/${variables.modelKebab}-form.ts`));
  }

  static async generateDashboard() {
    console.log(chalk.blue('\n📈 Dashboard Generator - Admin Panels & Analytics'));
    console.log(chalk.gray('Generate complete admin dashboards with charts, metrics, and data management.\n'));

    const dashboardConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'dashboardName',
        message: 'Dashboard name:',
        default: 'AdminDashboard',
        validate: (input) => {
          if (!input.trim()) return 'Dashboard name is required';
          if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input.trim())) {
            return 'Dashboard name must start with a letter and contain only letters and numbers';
          }
          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'widgets',
        message: 'Select dashboard widgets:',
        choices: [
          { name: 'Overview Stats Cards', value: 'stats', checked: true },
          { name: 'Recent Activity Feed', value: 'activity', checked: true },
          { name: 'Charts & Analytics', value: 'charts', checked: true },
          { name: 'Data Tables', value: 'tables', checked: true },
          { name: 'User Management Panel', value: 'users' },
          { name: 'Settings Panel', value: 'settings' },
          { name: 'Quick Actions Bar', value: 'actions', checked: true },
          { name: 'Notifications Center', value: 'notifications' }
        ]
      },
      {
        type: 'checkbox',
        name: 'chartTypes',
        message: 'Chart types to include:',
        choices: [
          { name: 'Line Chart (Time series)', value: 'line', checked: true },
          { name: 'Bar Chart (Categories)', value: 'bar', checked: true },
          { name: 'Pie Chart (Distribution)', value: 'pie' },
          { name: 'Area Chart (Trends)', value: 'area' },
          { name: 'Donut Chart (Progress)', value: 'donut' }
        ],
        when: (answers) => answers.widgets.includes('charts')
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Dashboard features:',
        choices: [
          { name: 'Real-time data updates', value: 'realtime' },
          { name: 'Export to PDF/Excel', value: 'export' },
          { name: 'Dark/Light theme toggle', value: 'theme', checked: true },
          { name: 'Customizable layout', value: 'customizable' },
          { name: 'Mobile responsive', value: 'responsive', checked: true },
          { name: 'Data filtering', value: 'filtering', checked: true }
        ]
      }
    ]);

    try {
      const dashboardPascal = TemplateEngine.toPascalCase(dashboardConfig.dashboardName);
      const variables = {
        dashboardName: dashboardPascal,
        dashboardKebab: TemplateEngine.toKebabCase(dashboardConfig.dashboardName),
        widgets: dashboardConfig.widgets,
        chartTypes: dashboardConfig.chartTypes || [],
        features: dashboardConfig.features
      };

      await this.generateDashboardComponent(variables);
      await this.generateDashboardWidgets(variables);
      await this.generateDashboardPage(variables);

      console.log(chalk.green(`✅ Dashboard '${dashboardPascal}' generated successfully!`));
      console.log(chalk.blue('\n📋 Dashboard includes:'));
      variables.widgets.forEach(widget => {
        const widgetNames = {
          stats: '📊 Overview statistics cards',
          activity: '🔔 Recent activity feed',
          charts: '📈 Interactive charts and analytics',
          tables: '📋 Data management tables',
          users: '👥 User management panel',
          settings: '⚙️ Settings configuration',
          actions: '⚡ Quick actions toolbar',
          notifications: '🔔 Notifications center'
        };
        console.log(chalk.gray(`   ${widgetNames[widget] || widget}`));
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating dashboard:'), error.message);
    }
  }

  static async generateDashboardComponent(variables) {
    const dashboardComponent = `'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
${variables.features.includes('theme') ? "import { useTheme } from 'next-themes';" : ''}
${variables.widgets.includes('charts') ? "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';" : ''}
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign,
  Bell,
  Settings,
  Plus,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    revenue: number;
    growth: number;
  };
  ${variables.widgets.includes('charts') ? `
  chartData: Array<{
    name: string;
    value: number;
    ${variables.chartTypes.includes('line') ? 'date: string;' : ''}
    ${variables.chartTypes.includes('bar') ? 'category: string;' : ''}
  }>;
  ` : ''}
  ${variables.widgets.includes('activity') ? `
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }>;
  ` : ''}
}

export function ${variables.dashboardName}() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  ${variables.features.includes('filtering') ? 'const [dateFilter, setDateFilter] = useState("7d");' : ''}
  ${variables.features.includes('realtime') ? 'const [lastUpdated, setLastUpdated] = useState<Date>(new Date());' : ''}
  ${variables.features.includes('theme') ? 'const { theme, setTheme } = useTheme();' : ''}

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      setData(result);
      ${variables.features.includes('realtime') ? 'setLastUpdated(new Date());' : ''}
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    ${variables.features.includes('realtime') ? `
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // 30 seconds
    return () => clearInterval(interval);
    ` : ''}
  }, [${variables.features.includes('filtering') ? 'dateFilter' : ''}]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 ${variables.features.includes('responsive') ? 'container mx-auto' : ''}">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening.
            ${variables.features.includes('realtime') ? ` Last updated: {lastUpdated.toLocaleTimeString()}` : ''}
          </p>
        </div>
        
        <div className="flex space-x-2">
          ${variables.features.includes('filtering') ? `
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          ` : ''}
          
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          ${variables.features.includes('export') ? `
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          ` : ''}
          
          ${variables.features.includes('theme') ? `
          <Button 
            variant="outline" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
          ` : ''}
        </div>
      </div>

      ${variables.widgets.includes('stats') ? `
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.stats.growth}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$\{data?.stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data?.stats.growth}%</div>
            <p className="text-xs text-muted-foreground">
              Monthly growth
            </p>
          </CardContent>
        </Card>
      </div>
      ` : ''}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${variables.widgets.includes('charts') ? `
        {/* Charts Section */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Performance metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="line" className="w-full">
              <TabsList className="grid w-full grid-cols-${variables.chartTypes.length}">
                ${variables.chartTypes.includes('line') ? '<TabsTrigger value="line">Trends</TabsTrigger>' : ''}
                ${variables.chartTypes.includes('bar') ? '<TabsTrigger value="bar">Categories</TabsTrigger>' : ''}
                ${variables.chartTypes.includes('pie') ? '<TabsTrigger value="pie">Distribution</TabsTrigger>' : ''}
              </TabsList>
              
              ${variables.chartTypes.includes('line') ? `
              <TabsContent value="line" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              ` : ''}
              
              ${variables.chartTypes.includes('bar') ? `
              <TabsContent value="bar" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              ` : ''}
            </Tabs>
          </CardContent>
        </Card>
        ` : ''}

        ${variables.widgets.includes('activity') ? `
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        ` : ''}
      </div>

      ${variables.widgets.includes('actions') ? `
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>Add User</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Bell className="h-6 w-6" />
              <span>Notifications</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="h-6 w-6" />
              <span>Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      ` : ''}
    </div>
  );
}`;

    const dashboardPath = path.join(process.cwd(), 'src', 'components', 'dashboards', `${variables.dashboardKebab}.tsx`);
    await fs.ensureDir(path.dirname(dashboardPath));
    await fs.writeFile(dashboardPath, dashboardComponent);

    console.log(chalk.green(`📈 Dashboard component created at src/components/dashboards/${variables.dashboardKebab}.tsx`));
  }

  static async generateDashboardWidgets(variables) {
    // Generate individual widget components
    const widgetsToGenerate = [
      { name: 'StatsCard', condition: variables.widgets.includes('stats') },
      { name: 'ActivityFeed', condition: variables.widgets.includes('activity') },
      { name: 'ChartWidget', condition: variables.widgets.includes('charts') }
    ];

    for (const widget of widgetsToGenerate) {
      if (widget.condition) {
        await this.generateWidgetComponent(widget.name, variables);
      }
    }
  }

  static async generateWidgetComponent(widgetName, variables) {
    const widgetComponents = {
      StatsCard: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className={\`text-xs \${trend.isPositive ? 'text-green-600' : 'text-red-600'}\`}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}`,
      
      ActivityFeed: `interface Activity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  const getActivityColor = (type?: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={\`w-2 h-2 rounded-full mt-2 \${getActivityColor(activity.type)}\`}></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
            <p className="text-xs text-gray-500">by {activity.user}</p>
          </div>
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}`,
      
      ChartWidget: `import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface ChartWidgetProps {
  data: ChartData[];
  title: string;
  type?: 'line' | 'bar' | 'area';
  color?: string;
  height?: number;
}

export function ChartWidget({ 
  data, 
  title, 
  type = 'line', 
  color = '#8884d8', 
  height = 300 
}: ChartWidgetProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div style={{ height: \`\${height}px\` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}`
    };

    const widgetContent = widgetComponents[widgetName];
    if (widgetContent) {
      const widgetPath = path.join(process.cwd(), 'src', 'components', 'widgets', `${widgetName.toLowerCase()}.tsx`);
      await fs.ensureDir(path.dirname(widgetPath));
      await fs.writeFile(widgetPath, widgetContent);

      console.log(chalk.green(`🧩 Widget component created at src/components/widgets/${widgetName.toLowerCase()}.tsx`));
    }
  }

  static async generateDashboardPage(variables) {
    const dashboardPage = `import { ${variables.dashboardName} } from '@/components/dashboards/${variables.dashboardKebab}';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <${variables.dashboardName} />
    </div>
  );
}

export const metadata = {
  title: 'Dashboard - Admin Panel',
  description: 'Admin dashboard with analytics and management tools',
};`;

    const pagePath = path.join(process.cwd(), 'src', 'app', 'dashboard', 'page.tsx');
    await fs.ensureDir(path.dirname(pagePath));
    await fs.writeFile(pagePath, dashboardPage);

    console.log(chalk.green(`📄 Dashboard page created at src/app/dashboard/page.tsx`));
  }

  static async generateTableFilters(variables) {
    const filtersContent = `import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface TableFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, any>) => void;
  onClear: () => void;
  searchQuery: string;
  filters: Record<string, any>;
}

export function TableFilters({ onSearch, onFilter, onClear, searchQuery, filters }: TableFiltersProps) {
  const [tempFilters, setTempFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFilter(tempFilters);
  };

  const handleClearFilters = () => {
    setTempFilters({});
    onClear();
  };

  return (
    <div className="flex items-center justify-between space-x-4 p-4 bg-white border rounded-lg">
      <div className="flex items-center space-x-2 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={tempFilters.status || ''} onValueChange={(value) => setTempFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={handleApplyFilters} variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Apply
        </Button>
        
        {(Object.keys(filters).length > 0 || searchQuery) && (
          <Button onClick={handleClearFilters} variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}`;

    const filtersPath = path.join(process.cwd(), 'src', 'components', 'tables', `${variables.tableKebab}-filters.tsx`);
    await fs.ensureDir(path.dirname(filtersPath));
    await fs.writeFile(filtersPath, filtersContent);

    console.log(chalk.green(`🔍 Table filters created at src/components/tables/${variables.tableKebab}-filters.tsx`));
  }

  static async generateTablePagination(variables) {
    const paginationContent = `import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
    </div>
  );
}`;

    const paginationPath = path.join(process.cwd(), 'src', 'components', 'tables', `${variables.tableKebab}-pagination.tsx`);
    await fs.ensureDir(path.dirname(paginationPath));
    await fs.writeFile(paginationPath, paginationContent);

    console.log(chalk.green(`📄 Table pagination created at src/components/tables/${variables.tableKebab}-pagination.tsx`));
  }
}
