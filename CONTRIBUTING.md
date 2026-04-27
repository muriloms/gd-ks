# Contributing to GD-KS

Thank you for your interest in contributing to GD-KS! This document provides guidelines for contributing.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/muriloms/gd-ks/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing [Issues](https://github.com/muriloms/gd-ks/issues) for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit with clear messages
7. Push and create a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/muriloms/gd-ks.git
cd gd-ks

# Install dependencies
npm install

# Link for local testing
npm link

# Run locally
gd-ks --help
```

## Code Style

- Use ES Modules (import/export)
- Follow ESLint configuration
- Use Prettier for formatting
- Write clear comments for complex logic
- Use meaningful variable names

## Commit Messages

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

Example: `feat: add UE5 architect agent`

## Project Structure

```
gd-ks/
├── bin/           # CLI executables
├── src/
│   ├── cli/       # CLI commands
│   ├── core/      # Core system
│   └── modules/   # Feature modules
├── tools/
│   ├── installer/ # Installation system
│   └── compiler/  # Agent compiler
├── docs/          # Documentation
└── samples/       # Example projects
```

## Questions?

Feel free to open an issue for any questions.

Thank you for contributing! 🎮
