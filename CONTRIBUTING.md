# Contributing to TheWCAG Color Blindness Simulator

Thank you for your interest in contributing to the Color Blindness Simulator! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be considerate in your interactions with other contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your changes
5. Make your changes and test them
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm 9 or later
- Chrome, Edge, or Brave browser for testing

### Installation

```bash
# Clone the repository
git clone https://github.com/WOLFIEEEE/ColorBlindness-Extension.git
cd ColorBlindness-Extension

# Install dependencies
npm install

# Start development server
npm run dev
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder

### Available Scripts

```bash
npm run dev          # Start development server with HMR
npm run build        # Build for production
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors
npm run typecheck    # TypeScript type checking
```

## Project Structure

```
ColorBlindness-Extension/
├── src/
│   ├── background/        # Service worker (background script)
│   ├── content/          # Content script (injected into pages)
│   ├── devtools/         # DevTools panel
│   ├── popup/            # Extension popup UI
│   │   └── components/   # React components
│   ├── lib/              # Shared utilities
│   │   └── __tests__/    # Unit tests
│   └── styles/           # CSS styles
├── public/               # Static assets
├── dist/                 # Built extension (git-ignored)
└── .github/              # GitHub workflows and templates
```

## Code Style

### TypeScript

- Use TypeScript for all source files
- Enable strict mode
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Document public APIs with JSDoc comments

### React

- Use functional components with hooks
- Follow React hooks rules
- Keep components focused and small
- Use proper prop types

### CSS

- Use Tailwind CSS for styling
- Follow utility-first approach
- Use CSS variables for theming

### General

- Use meaningful variable and function names
- Keep functions small and focused
- Write comments for complex logic
- Handle errors appropriately

### Linting

The project uses ESLint and TypeScript for code quality. Run linting before committing:

```bash
npm run lint
npm run typecheck
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in `__tests__` directories near the code
- Use descriptive test names
- Test edge cases
- Mock Chrome APIs appropriately

### Test Coverage

Aim for high test coverage on:
- Utility functions
- State management
- Component interactions
- Error handling

## Pull Request Process

### Before Submitting

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm run test:run`
4. Run linting: `npm run lint`
5. Run type checking: `npm run typecheck`
6. Build the extension: `npm run build`
7. Test the built extension in the browser

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(popup): add severity slider for anomaly types
fix(content): handle restricted page detection
docs(readme): update installation instructions
```

### Pull Request Template

When creating a PR, include:

- **Description**: What changes were made and why
- **Testing**: How the changes were tested
- **Screenshots**: If UI changes were made
- **Related Issues**: Link to related issues

### Review Process

1. Submit your PR
2. Wait for CI checks to pass
3. Address review feedback
4. Once approved, the PR will be merged

## Reporting Issues

### Bug Reports

Include:
- Browser and version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots (if applicable)

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Proposed implementation (if any)

## Questions?

If you have questions, please:
- Check existing issues
- Open a new issue with the "question" label
- Visit [TheWCAG.com](https://thewcag.com) for more resources

Thank you for contributing!

