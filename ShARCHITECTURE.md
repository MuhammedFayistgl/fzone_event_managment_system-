# Application Architecture

## Frontend Structure

src/
├── components
├── pages
├── redux
├── services
├── hooks
├── layouts
├── utils
├── routes

---

# Frontend Rules

- Keep components reusable
- Avoid business logic inside UI components
- Use hooks for reusable logic
- Use centralized API services
- Keep Redux scalable
- Avoid unnecessary re-renders

---

# Backend Structure

server/
├── routes
├── controllers
├── middleware
├── services
├── models
├── utils
├── validators

---

# Backend Rules

- Routes should stay thin
- Business logic belongs in services
- Controllers should only coordinate
- Validation should be separated
- Middleware should remain reusable
- Avoid direct database access in routes

---

# API Standards

- RESTful naming
- centralized error responses
- reusable response handlers
- proper status codes
- authentication middleware

---

# Database Rules

- avoid duplicated fields
- maintain normalized relationships
- use indexing where needed
- optimize query performance