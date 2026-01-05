# Service Layer Architecture

This directory contains the core business logic of the application. We use a **Dependency Injection (DI)** pattern to manage service instances and dependencies.

## Key Principles
1.  **Stateless Logic:** Services should contain pure business logic and API calls. State should be managed in `context` or components.
2.  **Singleton Pattern:** Services are instantiated once in `serviceProvider.js` and shared throughout the app.
3.  **Abstraction:** Components should not know about the underlying API details (Firebase, REST, etc.), only the Service methods.

## How to Create a New Service
1.  Create a class in this directory (e.g., `PaymentService.js`).
2.  Define methods for your value proposition.
3.  Register the service in `src/repositories/ServiceProvider.js` (or `serviceProvider.js` root).
4.  Expose it via the `useService` hook.

## Example
```javascript
class PaymentService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async processPayment(amount) {
    // Business logic
    return this.api.post('/pay', { amount });
  }
}
```
