# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automatically runs on every push and pull request to ensure code quality and catch issues early.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on: Push and Pull Requests to `main` and `develop` branches

**Jobs:**

#### Lint (Code Quality Checks)
- Checks code formatting with Black
- Validates import sorting with isort
- Runs flake8 for code linting
- Identifies syntax errors and code smells

#### Test
- Sets up MongoDB service container
- Runs pytest test suite
- Generates coverage reports
- Uploads coverage to Codecov

#### Security
- Scans dependencies for known vulnerabilities (Safety)
- Runs Bandit security linter
- Generates security reports

#### Build
- Verifies all imports work correctly
- Checks for syntax errors
- Ensures the application can start

### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)

Runs on: Push to `main` branch or version tags

**Jobs:**
- Deploys to Vercel production environment
- Requires Vercel secrets to be configured

## Setup Instructions

### 1. Enable GitHub Actions

GitHub Actions is enabled by default. The workflows will run automatically on push/PR.

### 2. Configure Secrets (Optional)

For deployment, add these secrets in GitHub repository settings:

**Settings → Secrets and variables → Actions → New repository secret**

Required secrets for deployment:
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 3. Set Up Pre-commit Hooks (Local Development)

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

## Status Badges

Add these badges to your README.md:

```markdown
![CI/CD](https://github.com/aajinn/leaf-diseases-detect/workflows/CI/CD%20Pipeline/badge.svg)
![Deploy](https://github.com/aajinn/leaf-diseases-detect/workflows/Deploy%20to%20Production/badge.svg)
```

## Workflow Triggers

### Automatic Triggers
- **Push** to `main` or `develop` branches
- **Pull Request** to `main` or `develop` branches
- **Tag** creation (for releases)

### Manual Triggers
You can manually trigger workflows from the Actions tab in GitHub.

## Understanding Results

### ✅ Success
All checks passed - code is ready to merge

### ⚠️ Warning
Some non-critical checks failed - review and fix if needed

### ❌ Failure
Critical checks failed - must be fixed before merging

## Local Testing

Run the same checks locally before pushing:

```bash
# Code formatting
black --check .

# Import sorting
isort --check-only .

# Linting
flake8 .

# Type checking
mypy src/

# Security scan
bandit -r src/

# Run tests
pytest

# Run all pre-commit hooks
pre-commit run --all-files
```

## Troubleshooting

### Tests Failing in CI but Pass Locally

1. Check Python version matches (3.9)
2. Ensure all dependencies are in requirements.txt
3. Check for environment-specific issues
4. Review MongoDB connection settings

### Linting Failures

1. Run `black .` to auto-format
2. Run `isort .` to fix imports
3. Fix flake8 warnings manually

### Security Scan Failures

1. Review Bandit report in artifacts
2. Update vulnerable dependencies
3. Add `# nosec` comment for false positives (with justification)

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep commits small** and focused
3. **Write meaningful commit messages**
4. **Add tests** for new features
5. **Update documentation** when needed
6. **Review CI results** before requesting review

## Continuous Improvement

The CI/CD pipeline is continuously improved. Suggestions welcome!

- Add more test coverage
- Improve security scanning
- Add performance benchmarks
- Implement automated releases

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pytest Documentation](https://docs.pytest.org/)
- [Black Documentation](https://black.readthedocs.io/)
- [Pre-commit Documentation](https://pre-commit.com/)
