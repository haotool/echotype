# Contributing to EchoType

Thank you for your interest in contributing to EchoType! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Style](#code-style)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be kind and courteous to other contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/EchoType.git
   cd EchoType
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/haotool/EchoType.git
   ```

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Chrome browser

### Installation

```bash
# Install dependencies
pnpm install

# Start development server with HMR
pnpm dev

# Load extension in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |

## Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. **Commit your changes** following the commit guidelines

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): subject

# Types: feat, fix, refactor, test, docs, chore, style
# Scope: shared, chatgpt, background, offscreen, options, popup
# Subject: imperative, <50 chars, no period

# Examples:
feat(chatgpt): add multi-language selector support
fix(background): handle tab connection timeout
docs(readme): update installation instructions
test(shared): add unit tests for normalizeText
```

## Pull Request Process

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub:
   - Fill out the PR template
   - Link any related issues
   - Request review from maintainers

4. **Address review feedback** if any

5. **Merge** once approved

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui
```

### Manual Testing

1. Load the extension in Chrome
2. Open ChatGPT temporary chat: `https://chatgpt.com/?temporary-chat=true`
3. Test dictation workflow:
   - Press `Alt+Shift+D` to toggle dictation
   - Press `Alt+Shift+C` to cancel
   - Press `Alt+Shift+V` to paste last result

## Code Style

### TypeScript

- Use strict mode
- Prefer `const` over `let`
- Use explicit types for function parameters
- Document public functions with JSDoc

### CSS

- Use CSS variables for theming
- Follow BEM naming convention
- Support both light and dark modes

### File Organization

```
src/
├── shared/          # Shared utilities and types
├── background/      # Service Worker
├── content/
│   ├── chatgpt/     # ChatGPT content script
│   └── universal/   # Universal paste script
├── offscreen/       # Clipboard operations
├── options/         # Settings page
└── popup/           # Popup UI
```

## Questions?

- Open an issue for bugs or feature requests
- Contact: haotool.org@gmail.com

---

Thank you for contributing! 🎉
