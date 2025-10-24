# Contributing to LSBible SDK

Thank you for your interest in contributing to the LSBible SDK! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a welcoming environment

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/kdcokenny/lsbible/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - SDK version and environment details

### Suggesting Features

1. Check existing [Issues](https://github.com/kdcokenny/lsbible/issues) for similar requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach

### Contributing Code

#### Setting Up Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/kdcokenny/lsbible.git
cd lsbible

# Install dependencies
bun install

# Setup Python SDK
cd packages/python-sdk
uv sync
```

#### Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run Tests and Checks**
   ```bash
   # For Python SDK
   cd packages/python-sdk
   uv run pytest
   uv run ty check lsbible
   uv run ruff check lsbible
   uv run ruff format lsbible
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Adding tests
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

   Then create a PR on GitHub with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots (if applicable)

## Adding a New Language SDK

We welcome contributions of SDKs in any language! Each SDK must implement the same API design with structured parameters.

### Requirements

1. **Client Interface** - HTTP client with caching
2. **Type System** - Strong typing in the target language
3. **Models** - All data models with validation
4. **Parser** - HTML parser for passages
5. **Validation** - Full Bible reference validation
6. **Tests** - Comprehensive test suite (>80% coverage)
7. **Documentation** - README with examples

### Package Structure

```
packages/{language}-sdk/
├── README.md              # Language-specific README
├── LICENSE
├── {package-config}       # Language-specific config
├── src/                   # Source code
│   ├── client.{ext}
│   ├── models.{ext}
│   ├── parser.{ext}
│   ├── books.{ext}
│   └── validators.{ext}
└── tests/                 # Test suite
```

### API Consistency

All SDKs must provide equivalent APIs. Example for TypeScript:

```typescript
import { LSBibleClient, BookName } from '@lsbible/sdk';

const client = new LSBibleClient();

// Type-safe verse lookup
const passage = await client.getVerse(BookName.JOHN, 3, 16);

// Or with string (validated at runtime)
const passage2 = await client.getVerse("John", 3, 16);
```

### Steps to Add a New SDK

1. **Create Package Directory**
   ```bash
   mkdir packages/{language}-sdk
   ```

2. **Implement Required Modules**
   - Client with caching
   - All data models
   - HTML parser
   - Validators
   - Bible structure data

3. **Add Tests**
   - Aim for >80% coverage
   - Test all validation edge cases
   - Test API integration

4. **Write Documentation**
   - README with quick start
   - API reference
   - Usage examples

5. **Update Turborepo Config**
   Add your package to `turbo.json` tasks

6. **Submit Pull Request**
   - Follow the API design patterns from existing SDKs
   - Include examples in the PR description

## Python SDK Specific Guidelines

### Code Style

- Use [Ruff](https://docs.astral.sh/ruff/) for linting and formatting
- Follow PEP 8 conventions
- Use type hints for all functions
- Maximum line length: 100 characters

### Testing

- Use pytest for all tests
- Name test files `test_*.py`
- Aim for >80% code coverage
- Test both success and error cases

### Type Checking

- Use [ty](https://github.com/zed-industries/ty) for type checking
- All code must pass type checking
- No `type: ignore` without justification

### Documentation

- Use docstrings for all public functions
- Follow Google docstring style
- Include examples in docstrings

## Review Process

1. All PRs require at least one approval
2. All tests must pass
3. Code coverage must not decrease
4. Documentation must be updated
5. No merge conflicts

## Questions?

- Open a [Discussion](https://github.com/kdcokenny/lsbible/discussions)
- Ask in your PR
- Check existing documentation

Thank you for contributing to LSBible SDK!
