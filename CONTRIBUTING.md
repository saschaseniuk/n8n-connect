# Contributing to n8n-connect

Thank you for your interest in contributing to n8n-connect!

This is an **independent community project** - not affiliated with or endorsed by n8n GmbH. We welcome contributions from anyone who wants to help improve the SDK for integrating frontend applications with n8n workflows.

This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.15.0
- Git

### Setup

1. Fork the repository on GitHub

2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/n8n-connect.git
   cd n8n-connect
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

5. Run tests to verify setup:
   ```bash
   pnpm test
   ```

## Development Workflow

### Project Structure

```
n8n-connect/
├── packages/
│   ├── core/          # @n8n-connect/core - Framework-agnostic core
│   ├── react/         # @n8n-connect/react - React integration
│   └── cli/           # n8n-connect CLI tools
├── docs/              # Documentation
├── tasks/             # Development task specifications
└── tests/             # Test specifications
```

### Available Scripts

```bash
pnpm build        # Build all packages
pnpm dev          # Start development mode with watch
pnpm test         # Run all tests
pnpm lint         # Check code quality
pnpm format       # Format code with Prettier
pnpm typecheck    # Run TypeScript type checking
pnpm clean        # Clean build artifacts
```

### Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Write or update tests as needed

4. Ensure all tests pass:
   ```bash
   pnpm test
   ```

5. Ensure code passes linting:
   ```bash
   pnpm lint
   ```

6. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: add new feature description"
   ```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` with type guards when necessary

### Code Style

- Code is automatically formatted with Prettier
- ESLint enforces additional code quality rules
- Run `pnpm format` before committing

### Naming Conventions

- **Files**: kebab-case (`my-component.ts`)
- **Classes/Interfaces/Types**: PascalCase (`MyComponent`)
- **Functions/Variables**: camelCase (`myFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Documentation

- Add JSDoc comments for public APIs
- Update relevant documentation in `docs/` when changing functionality
- Include code examples in documentation

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(core): add timeout configuration to client options

fix(react): resolve memory leak in useWorkflow cleanup

docs: update installation instructions for pnpm
```

## Pull Requests

### Before Submitting

1. Ensure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Run the full test suite:
   ```bash
   pnpm test
   ```

3. Run linting and type checking:
   ```bash
   pnpm lint
   pnpm typecheck
   ```

### PR Guidelines

- Keep PRs focused on a single change
- Provide a clear description of what the PR does
- Reference any related issues
- Include screenshots for UI changes
- Update documentation if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated (if applicable)
```

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, package versions)
- Relevant code snippets or error messages

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Proposed API or implementation ideas (optional)

## Questions?

If you have questions about contributing:
- Check existing issues and discussions
- Open a new discussion for general questions
- Open an issue for specific bugs or feature requests

## License

By contributing to n8n-connect, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to n8n-connect!
