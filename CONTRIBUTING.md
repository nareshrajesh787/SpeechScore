# Contributing to SpeechScore

Thank you for your interest in contributing to SpeechScore! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

1. **Fork the repository** and clone your fork
2. **Set up your development environment** (see README.md for detailed instructions)
3. **Create a new branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

## Development Workflow

### Before You Start

- Check existing issues and pull requests to avoid duplicate work
- For major changes, consider opening an issue first to discuss the approach

### Making Changes

1. **Write clean, readable code** following existing patterns
2. **Add comments** for complex logic
3. **Test your changes** locally before submitting
4. **Update documentation** if you're adding features or changing behavior

### Commit Messages

Please follow these guidelines for commit messages:

- Use clear, descriptive messages
- Start with a verb in imperative mood (e.g., "Add", "Fix", "Update", "Remove")
- Be specific about what changed and why
- Reference issue numbers if applicable

**Good examples:**
```
feat: add audio playback controls to result panel
fix: resolve CORS error for production domain
docs: update setup instructions for Windows
refactor: extract audio validation into separate function
```

**Bad examples:**
```
bugfixing
fix
update
9/14/25
```

### Pull Request Process

1. **Push your branch** to your fork
2. **Create a pull request** with a clear title and description
3. **Describe your changes:**
   - What problem does this solve?
   - What approach did you take?
   - Are there any breaking changes?
4. **Link related issues** if applicable
5. **Wait for review** and address any feedback

## Code Style

### Frontend (React/JavaScript)
- Use functional components and hooks
- Follow React best practices
- Use meaningful variable and function names
- Keep components focused and reusable

### Backend (Python/FastAPI)
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Write clear docstrings for functions
- Handle errors gracefully with appropriate HTTP status codes

## Testing

- Test your changes thoroughly before submitting
- Test both success and error cases
- Verify the changes work in both development and production-like environments

## Security

- **Never commit** API keys, credentials, or secrets
- Use environment variables for all sensitive configuration
- Review the `.env.example` files to understand what should be configured
- If you discover a security vulnerability, please report it privately

## Questions?

If you have questions or need help, feel free to:
- Open an issue with the "question" label
- Check existing documentation in the README

Thank you for contributing to SpeechScore! 🎉

