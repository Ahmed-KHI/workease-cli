# 🧪 Virtual Testing Guide

This guide shows you how to safely test the WorkEase CLI without risking your file system.

## 🛡️ Safety First

The WorkEase CLI now includes multiple safety features to prevent the file system corruption issue you experienced:

### 🔒 Safety Features Implemented

1. **No Unsafe Postinstall Scripts** - Prisma generate never runs during npm install
2. **Automatic Safety Validation** - Detects and removes dangerous scripts
3. **Virtual Testing Mode** - Test without touching your file system
4. **Dry Run Mode** - Simulate operations safely
5. **Clear Safety Warnings** - Explicit guidance on safe usage

## 🧪 Virtual Testing Commands

### 1. Virtual Test Mode (Recommended)
```bash
# Test the CLI completely safely - no file operations
workease test --template fullstack
workease test --template dashboard
workease test --template frontend
workease test --template api
```

This command will:
- ✅ Show exactly what would be created
- ✅ Analyze script safety
- ✅ Display dependency information
- ✅ Show file structure
- ❌ NOT create any actual files

### 2. Dry Run Mode
```bash
# Simulate project creation
workease init my-test-app --template fullstack --dry-run
```

This will:
- ✅ Go through the full creation process
- ✅ Show all operations that would happen
- ❌ NOT create files or install dependencies

### 3. Safety Check Mode
```bash
# Check existing projects for safety issues
workease check
# or
workease safety
```

This will:
- ✅ Scan package.json for unsafe scripts
- ✅ Automatically fix dangerous configurations
- ✅ Report safety status

## 🔍 What to Look For in Tests

When running virtual tests, pay attention to:

### ✅ Safe Indicators
- Scripts that are marked `✅ SAFE`
- No postinstall scripts containing "prisma generate"
- Manual database setup instructions
- Clear separation of dependency installation and database setup

### ⚠️ Warning Signs
- Scripts marked `⚠️ POTENTIALLY UNSAFE`
- Postinstall scripts that run Prisma commands
- Automatic Prisma generation during npm install

## 📊 Sample Virtual Test Output

```bash
$ workease test --template fullstack

🧪 Virtual Testing Mode - No Real File Operations
This simulates CLI operations without touching your file system

📋 What would happen with real execution:
   Project: virtual-test-project
   Template: fullstack

🔍 Simulating project creation...
📁 Would create directory: virtual-test-project

📄 Would generate package.json with scripts:
   dev: next dev ✅ SAFE
   build: next build ✅ SAFE
   start: next start ✅ SAFE
   lint: next lint ✅ SAFE
   db:generate: prisma generate ✅ SAFE
   db:setup: prisma generate && prisma db push ✅ SAFE
   db:check: prisma validate && echo 'Schema is valid' ✅ SAFE

🔒 Safety Analysis:
✅ No unsafe postinstall scripts detected

📦 Would install dependencies:
   - next, react, typescript (base)
   - @prisma/client, prisma (database)
   - tailwindcss, autoprefixer (styling)

📁 Would create file structure:
   ├── src/app/
   ├── src/components/
   ├── src/lib/
   ├── prisma/
   ├── package.json
   ├── tsconfig.json
   └── README.md

✅ Virtual test completed successfully!
No files were actually created on your system.
```

## 🚀 Safe Real Usage (After Testing)

Once you've verified safety with virtual tests:

```bash
# 1. Create project (safe)
workease init my-app --template fullstack

# 2. Navigate to project
cd my-app

# 3. Optional: Run safety check
workease check

# 4. Setup database (manual, safe)
npm run db:setup

# 5. Start development
npm run dev
```

## 🆘 Emergency Safety Check

If you suspect an existing project has unsafe configurations:

```bash
# Run in any project directory
workease check
```

This will automatically detect and fix unsafe postinstall scripts.

## 💡 Best Practices

1. **Always test first** - Use `workease test` before real creation
2. **Use dry-run** - Test with `--dry-run` flag when uncertain
3. **Check existing projects** - Run `workease check` on existing projects
4. **Manual database setup** - Never run Prisma during npm install
5. **Separate concerns** - Install dependencies first, setup database second

## 🔧 Troubleshooting

### If You See Unsafe Scripts
```bash
# The CLI will automatically fix them
workease check
```

### If You Want to Test Without Risk
```bash
# Use virtual mode
workease test --template your-template
```

### If Something Goes Wrong
```bash
# Check for issues
workease check --verbose
```

Your system is now protected! 🛡️
