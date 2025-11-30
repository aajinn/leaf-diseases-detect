# Contributing to Leaf Disease Detection System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/your-username/leaf-diseases-detect.git
cd leaf-diseases-detect
```

### 2. Set Up Development Environment
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Code Style

We use the following tools to maintain code quality:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking

Run these before committing:
```bash
black .
isort .
flake8 .
mypy src/
```

Or use pre-commit hooks (automatically runs on commit):
```bash
pre-commit run --all-files
```

### Testing

Write tests for new features and bug fixes:
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_api.py
```

### Commit Messages

Follow conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add rate limiting to public endpoints
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update Documentation**: Ensure README and relevant docs are updated
2. **Add Tests**: Include tests for new functionality
3. **Run CI Checks**: Ensure all tests and linting pass
4. **Update CHANGELOG**: Add entry describing your changes
5. **Create PR**: Use the pull request template
6. **Code Review**: Address feedback from reviewers

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings

## Project Structure

```
leaf-disease-detection/
├── src/                    # Source code
│   ├── app.py             # FastAPI application
│   ├── auth/              # Authentication
│   ├── database/          # Database models
│   ├── routes/            # API routes
│   └── services/          # External services
├── frontend/              # Web interface
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

## Areas for Contribution

### High Priority
- Fix critical bugs (see issues labeled `bug` and `high-priority`)
- Security improvements
- Performance optimizations
- Test coverage improvements

### Medium Priority
- New features (see issues labeled `enhancement`)
- Documentation improvements
- Code refactoring
- UI/UX enhancements

### Good First Issues
Look for issues labeled `good-first-issue` - these are great for new contributors!

## Development Tips

### Running the Application
```bash
# Start FastAPI server
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000

# Start MongoDB (if needed)
mongod

# Run tests in watch mode
pytest-watch
```

### Debugging
- Use Python debugger: `import pdb; pdb.set_trace()`
- Check logs in `disease_detection.log`
- Use FastAPI's interactive docs: `http://localhost:8000/docs`

### Common Issues

**Import Errors**: Ensure you're in the project root and virtual environment is activated

**MongoDB Connection**: Make sure MongoDB is running on `localhost:27017`

**API Keys**: Copy `.env.example` to `.env` and add your API keys

## Questions?

- Check existing [Issues](https://github.com/aajinn/leaf-diseases-detect/issues)
- Create a new issue with the `question` label
- Review the [Documentation](docs/)

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Project documentation

Thank you for contributing! 🌿
