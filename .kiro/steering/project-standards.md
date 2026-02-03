# Project Standards and Rules

## Communication Style
- Do not explain what you are doing unless explicitly asked
- No summaries after implementing or fixing something
- Be concise and direct in responses
- Only provide explanations when requested

## Code Style Guidelines
- Use Python type hints for all function parameters and return values
- Follow PEP 8 naming conventions
- Add docstrings to all classes and functions
- Use meaningful variable names

## Database Rules
- Always use async/await for database operations
- Include proper error handling for all database calls
- Use ObjectId validation for MongoDB document IDs

## API Development
- Include proper HTTP status codes
- Add request/response validation using Pydantic models
- Implement proper error handling with descriptive messages
- Always include authentication checks for protected endpoints

## Frontend Guidelines
- Use consistent CSS class naming (BEM methodology preferred)
- Include proper error handling in JavaScript
- Add loading states for async operations
- Ensure responsive design for all components

## Security Requirements
- Never commit sensitive data (API keys, passwords)
- Validate all user inputs
- Use proper authentication and authorization
- Sanitize data before database operations

## Testing Standards
- Write unit tests for all service functions
- Include integration tests for API endpoints
- Test error scenarios and edge cases
- Maintain test coverage above 80%