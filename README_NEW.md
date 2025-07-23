<div align="center">

# 🚀 WorkEase CLI

**Enterprise-Grade Project Generator with Safety-First Architecture**

[![GitHub Stars](https://img.shields.io/github/stars/Ahmed-KHI/workease-cli?style=for-the-badge&logo=github)](https://github.com/Ahmed-KHI/workease-cli)
[![GitHub License](https://img.shields.io/github/license/Ahmed-KHI/workease-cli?style=for-the-badge)](https://github.com/Ahmed-KHI/workease-cli/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/workease-cli?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/workease-cli)

*A productivity-focused CLI for building internal tools, dashboards, and enterprise applications with built-in safety guarantees*

[📖 Documentation](#-documentation) • [🚀 Quick Start](#-quick-start) • [🧪 Virtual Testing](#-virtual-testing) • [💡 Examples](#-examples)

</div>

---

## ✨ Why WorkEase CLI?

- **🔒 Safety-First**: Virtual testing mode prevents file system corruption
- **⚡ Rapid Development**: Create full-stack apps in minutes, not hours
- **🏢 Enterprise-Ready**: Built for HR systems, dashboards, and CRUD applications
- **🧪 Risk-Free Testing**: Test CLI operations without touching your file system
- **🎯 TypeScript-Native**: Full type safety across your entire stack

## 🛡️ Safety Features

> **Critical:** WorkEase CLI implements comprehensive safety measures to protect your system from file corruption and infinite operations.

- **Virtual Testing Mode**: Test all operations without creating real files
- **Automatic Safety Validation**: Detects and removes dangerous postinstall scripts
- **Dry-Run Capabilities**: Preview changes before execution
- **Prisma Safety**: Prevents file system corruption from unsafe database operations
- **Installation Protection**: Separates dependency installation from database setup

## 🚀 Quick Start

### Installation

```bash
npm install -g workease-cli
```

### Create Your First Project

```bash
# Interactive project creation
workease init

# Or specify template directly
workease init my-app --template fullstack
cd my-app

# Set up database (SAFE - runs after project creation)
npm run db:setup

# Start development
npm run dev
```

### 🧪 Virtual Testing (Recommended First Step)

Test the CLI safely without creating any files:

```bash
# Test CLI operations in virtual mode
workease test --template fullstack

# Run any command in dry-run mode
workease init my-app --dry-run --template dashboard
```

## 🏗️ Project Templates

| Template | Description | Tech Stack |
|----------|-------------|------------|
| **🚀 Full Stack** | Complete web application | Next.js + TypeScript + Tailwind + Prisma |
| **⚡ Frontend** | Client-side application | Next.js + TypeScript + Tailwind |
| **🔧 API Only** | Backend services | Next.js API Routes + TypeScript + Prisma |
| **📊 Dashboard** | Admin panel with auth | Full Stack + Authentication + Admin UI |

## 🤖 Code Generation

Generate production-ready code with built-in best practices:

```bash
# Interactive generator
workease generate

# Specific generators
workease g component UserCard
workease g page dashboard/analytics
workease g api users
workease g model Product
```

### Available Generators

- **🧩 Components**: React components with TypeScript
- **📄 Pages**: Next.js app router pages with layouts
- **🔌 API Routes**: REST endpoints with validation
- **🗃️ Models**: Database models with CRUD operations
- **📊 Data Tables**: List views with pagination & filtering
- **📝 Forms**: Auto-generated forms from models
- **📈 Dashboards**: Admin panels with charts & metrics

## 🔐 Authentication System

```bash
# Set up authentication
workease auth --provider nextauth --database

# Available providers
workease auth --provider clerk
workease auth --provider supabase
```

**Features:**
- Multiple authentication providers
- Complete user management
- Role-based access control
- Professional UI components
- Database integration

## 🌐 Tech Stack

<div align="center">

| Frontend | Backend | Database | Tools |
|----------|---------|----------|-------|
| ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) | ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) |
| ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) | ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) | ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white) | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) |

</div>

## 🧪 Virtual Testing

WorkEase CLI includes a comprehensive virtual testing system that simulates all operations without touching your file system.

```bash
# Test different templates safely
workease test --template fullstack
workease test --template dashboard
workease test --template api

# Check safety of existing projects
workease check

# Run any command in simulation mode
workease init my-project --dry-run --verbose
```

**Why Virtual Testing?**
- **Zero Risk**: No files are created or modified
- **Full Simulation**: See exactly what would happen
- **Safety Analysis**: Automatic detection of unsafe operations
- **Learning Tool**: Understand CLI behavior before committing

## 💡 Examples

### Create a Full-Stack Dashboard

```bash
# 1. Test first (recommended)
workease test --template dashboard

# 2. Create project
workease init hr-dashboard --template dashboard
cd hr-dashboard

# 3. Set up database safely
npm run db:setup

# 4. Generate components
workease g model Employee
workease g page employees
workease g component EmployeeCard

# 5. Start development
npm run dev
```

### API-Only Backend Service

```bash
workease init api-service --template api
cd api-service

# Generate API endpoints
workease g api users
workease g api auth
workease g model User

# Database setup
npm run db:setup
npm run dev
```

## 📊 Project Structure

```
my-workease-app/
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # Reusable components
│   ├── lib/               # Utilities and configurations
│   └── types/             # TypeScript definitions
├── prisma/                # Database schema (if applicable)
├── public/                # Static assets
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 🔧 CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `workease init` | Create new project | `workease init my-app --template fullstack` |
| `workease generate` | Generate code | `workease g component Button` |
| `workease auth` | Set up authentication | `workease auth --provider nextauth` |
| `workease test` | Virtual testing mode | `workease test --template dashboard` |
| `workease check` | Safety validation | `workease check` |

### Global Options

- `--dry-run`: Simulate operations without file changes
- `--verbose`: Show detailed output for debugging
- `--help`: Show help information

## 📖 Documentation

- **[Getting Started Guide](./docs/getting-started.md)**: Step-by-step tutorial
- **[Virtual Testing Guide](./VIRTUAL_TESTING.md)**: Complete safety testing documentation
- **[API Reference](./docs/api-reference.md)**: Detailed CLI commands
- **[Framework Vision](./docs/vision.md)**: Project goals and roadmap
- **[Contributing Guide](./CONTRIBUTING.md)**: How to contribute

## 🏢 Use Cases

**Perfect for:**
- 👥 **HR Management Systems**: Employee portals, time tracking, performance reviews
- 💰 **Financial Dashboards**: Accounting interfaces, expense tracking, reporting
- 📊 **Admin Panels**: Content management, user administration, analytics
- 🔧 **Internal Tools**: Data entry forms, workflow automation, utilities
- 📈 **Business Applications**: CRM systems, inventory management, project tracking

## 🛠️ Advanced Features

### Database Management

```bash
# Generate complete CRUD operations
workease g model Product --crud

# Create database relationships
workease g model Order --relations

# Set up data validation
workease g validation ProductSchema
```

### UI Component Generation

```bash
# Generate themed components
workease g component Button --variant primary
workease g component Table --features pagination,sorting,filtering
workease g form UserForm --model User
```

### API Development

```bash
# Generate REST endpoints with validation
workease g api products --methods get,post,put,delete
workease g middleware auth
workease g controller ProductController
```

## 🎯 Roadmap

- [ ] **v2.0**: GraphQL API generation
- [ ] **v2.1**: Docker containerization support
- [ ] **v2.2**: Serverless deployment templates
- [ ] **v2.3**: Advanced UI component library
- [ ] **v2.4**: Database migration tools
- [ ] **v2.5**: Testing framework integration

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Test** your changes: `workease test --template fullstack`
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to the branch: `git push origin feature/amazing-feature`
6. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/Ahmed-KHI/workease-cli.git
cd workease-cli
npm install
npm link

# Test your changes
workease test --template fullstack
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support & Community

<div align="center">

[![Email](https://img.shields.io/badge/Email-m.muhammad.ahmed115%40gmail.com-blue?style=for-the-badge&logo=gmail)](mailto:m.muhammad.ahmed115@gmail.com)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-7289da?style=for-the-badge&logo=discord)](https://discord.com/users/1211977466898419776)
[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-green?style=for-the-badge&logo=github)](https://github.com/Ahmed-KHI/workease-cli/issues)

</div>

---

<div align="center">

**Made with ❤️ by [Muhammad Ahmed](https://github.com/Ahmed-KHI)**

*Building tools that empower developers to create amazing applications safely and efficiently*

⭐ **Star this repo if WorkEase CLI helped you build something awesome!**

</div>
