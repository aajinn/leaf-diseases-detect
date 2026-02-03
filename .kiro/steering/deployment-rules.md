---
inclusion: manual
---

# Deployment and Production Rules

## Environment Configuration
- Use environment variables for all configuration
- Never hardcode URLs or credentials
- Implement proper logging levels for production
- Use secrets management for sensitive data

## Docker Guidelines
- Use multi-stage builds for optimization
- Include health checks in containers
- Set proper resource limits
- Use non-root users in containers

## CI/CD Requirements
- Run all tests before deployment
- Include security scanning
- Use automated database migrations
- Implement rollback strategies

## Monitoring
- Add application metrics
- Implement health check endpoints
- Set up proper alerting
- Include performance monitoring