# WorkEase Framework

**A productivity-first framework for building internal tools and automation platforms**

## 🎯 Purpose

WorkEase is a developer-friendly, fullstack JavaScript/TypeScript framework designed to help rapidly build internal tools and automation platforms for:

- Human Resource (HR) systems
- Accounting and finance dashboards
- Office data entry and admin workflows
- CRUD-heavy enterprise utilities

## 🚀 Quick Start

### Installation

```bash
npm install -g workease-cli
```

### Create a new project

```bash
workease init my-app --template fullstack
cd my-app

# Generate a complete model with CRUD operations
workease generate model

# Set up authentication system
workease auth --provider nextauth --database

npm run dev
```

## 🧰 Features

### **🏗️ Project Templates**
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Full Stack**: + Prisma ORM + SQLite database  
- **Dashboard**: + Authentication + Admin UI components
- **API Only**: Next.js API routes for backend services

### **🤖 Code Generation** *(Enhanced in Phase 3)*
- **� Components**: React components with TypeScript
- **📄 Pages**: Next.js app router pages with layouts  
- **🔌 API Routes**: REST endpoints with HTTP methods
- **�️ Models**: Complete database models with CRUD operations

### **🔐 Authentication System** *(New in Phase 3)*
- **Multiple Providers**: NextAuth.js, Clerk, Supabase, Custom JWT
- **Complete Features**: Login, registration, OAuth, password reset
- **Database Integration**: User models and session management
- **UI Components**: Professional auth forms and pages
- **Role-Based Access**: User permissions and role management

### **🗃️ Database Integration** *(New in Phase 3)*
- **Smart Models**: Automatic Prisma schema generation
- **CRUD APIs**: Complete REST endpoints with validation
- **TypeScript Types**: Generated interfaces and types
- **Data Seeding**: Sample data for development
- **Validation Schemas**: Zod-based input validation

## 🌐 Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
- **Backend**: Node.js + Express (or Next.js API routes)
- **Database**: SQLite (starter) → PostgreSQL/MySQL
- **ORM**: Prisma
- **Auth**: Clerk/Auth.js/Firebase Auth (configurable)
- **CLI**: Node.js CLI for scaffolding

## 📖 Documentation

For detailed documentation, visit our [docs](./docs/vision.md).

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- 📧 Email: support@workease-framework.com
- 💬 Discord: [Join our community](https://discord.gg/workease)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/myframework/issues)
