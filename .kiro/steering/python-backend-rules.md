---
inclusion: fileMatch
fileMatchPattern: "src/**/*.py"
---

# Python Backend Specific Rules

## FastAPI Specific Guidelines
- Use dependency injection for database connections
- Implement proper CORS configuration
- Use background tasks for heavy operations
- Include OpenAPI documentation with examples

## MongoDB Integration
- Use motor for async MongoDB operations
- Implement connection pooling
- Add proper indexing for frequently queried fields
- Use aggregation pipelines for complex queries

## Error Handling
- Create custom exception classes
- Use HTTPException with proper status codes
- Log all errors with appropriate levels
- Return consistent error response format

## Performance
- Implement caching where appropriate
- Use pagination for list endpoints
- Optimize database queries
- Add request/response compression