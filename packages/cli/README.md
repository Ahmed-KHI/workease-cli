# workease-cli

**A productivity-first CLI framework for building internal tools and automation platforms**

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

### **🤖 Code Generation**
- **🧩 Components**: React components with TypeScript
- **📄 Pages**: Next.js app router pages with layouts  
- **🔌 API Routes**: REST endpoints with HTTP methods
- **🗃️ Models**: Complete database models with CRUD operations
- **📊 Data Tables**: List views with pagination, sorting, filtering
- **📝 Forms**: Auto-generated forms with validation
- **📈 Dashboards**: Admin panels with charts and metrics

### **🔐 Authentication System**
- **Multi-provider support**: NextAuth.js, Clerk, Supabase
- **Database integration**: User models and sessions
- **UI components**: Login/signup forms
- **Role-based access control**: User permissions

### **⚡ Developer Experience**
- **Interactive CLI**: Beautiful prompts and feedback
- **TypeScript**: Full type safety throughout
- **Modern stack**: Next.js 15, Tailwind CSS, Prisma
- **Professional UI**: shadcn/ui component library

## 📖 Commands

```bash
# Initialize new project
workease init <project-name> --template <frontend|fullstack|dashboard|api>

# Generate code
workease generate
# Interactive menu with: component, page, api, model, table, form, dashboard

# Set up authentication
workease auth --provider <nextauth|clerk|supabase>

# Help
workease --help
```

## 🛠️ Generated Project Structure

```
my-app/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utilities
├── prisma/              # Database schema (fullstack)
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🎯 Perfect For

- **Internal tools** and admin panels
- **CRUD-heavy applications**
- **Business dashboards** and reporting
- **Data entry** and management systems
- **Rapid prototyping** and MVP development

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please see our contributing guidelines.

## 🆘 Support

- 📧 Issues: [GitHub Issues](https://github.com/workease-framework/workease-cli/issues)
- 📖 Docs: Full documentation and examples
