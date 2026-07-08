# CLAUDE.md

## Project Overview

This is a PERN stack application built for a full-stack web development course.

The app uses:

- PostgreSQL for the database
- Express.js for the backend API
- React for the frontend
- Node.js as the runtime

The goal of this project is to help students learn how the frontend, backend, and database work together.

---

## Student Learning Goals

When helping with this project, prioritize learning over speed.

Explain code in beginner-friendly language.

When making suggestions, connect the explanation to full-stack concepts such as:

- React components
- State management
- API calls
- Express routes
- Controllers
- Database queries
- Request and response flow
- Error handling

---

## General Rules

Before editing code:

1. Inspect the relevant files.
2. Explain the issue or goal.
3. Suggest a short plan.
4. Wait for confirmation if the change is large.

When editing code:

1. Make the smallest reasonable change.
2. Do not rewrite the whole project.
3. Do not add extra libraries unless necessary.
4. Keep the code readable for beginner full-stack students.
5. Follow the existing file structure and naming style.

After editing code:

1. Explain what changed.
2. Explain why the change works.
3. List the files that were changed.
4. Suggest how to test the result.

---

## Code Style

Use clear and beginner-friendly JavaScript.

Prefer readable code over overly clever code.

Use async/await for backend database calls.

Use meaningful variable names.

Add short comments only when they help students understand the code.

Avoid advanced patterns unless they are already used in the project.

---

## Backend Guidelines

The backend uses Express.

Routes should be organized clearly.

When working on backend features:

- Check the route file first
- Then check the controller
- Then check the database query
- Then check server setup if needed

Use proper HTTP status codes.

Examples:

- 200 for successful GET requests
- 201 for successful creation
- 400 for bad requests
- 404 for not found
- 500 for server errors

Do not expose sensitive error details to the frontend.

---

## Frontend Guidelines

The frontend uses React.

When working on frontend features:

- Check the relevant component
- Check state variables
- Check event handlers
- Check API calls
- Check how data is rendered

Keep components understandable for students.

Do not create overly complex abstractions unless needed.

When using forms, remember to use `event.preventDefault()`.

---

## Database Guidelines

The database uses PostgreSQL.

When working with database-related code:

- Check table names carefully
- Check column names carefully
- Use parameterized queries when writing SQL
- Do not hardcode user input into SQL strings
- Explain how the query connects to the route or controller

Do not delete or reset data unless specifically asked.

---

## Testing and Debugging

When debugging, follow this flow:

1. Read the error message
2. Identify where the error is happening
3. Trace the request flow
4. Check frontend request
5. Check backend route
6. Check controller logic
7. Check database query
8. Suggest the smallest fix

After a fix, suggest a simple test.

Example:

- Start the backend server
- Start the frontend app
- Open the browser
- Try the feature manually
- Check the terminal for errors
- Check the browser console for errors

---

## What Not To Do

Do not complete the entire project for the student.

Do not generate large amounts of code without explanation.

Do not replace all existing code with a new architecture.

Do not add authentication, payment, deployment, or advanced features unless specifically requested.

Do not hide complexity from the student. Explain it clearly.

Do not assume the code is correct without checking files first.

---

## Preferred Explanation Style

Use this explanation format when possible:

1. What the problem is
2. Where the problem is happening
3. Why it is happening
4. What change fixes it
5. How to test it

Use simple language.

Assume the student is learning full-stack development for the first time.

---

## Example Student-Friendly Response

The issue is happening in the backend route.

Your React component is sending a request to `/api/posts`, but the Express server does not currently have a matching GET route for `/api/posts`.

To fix this, we need to add a GET route that asks the database for posts and sends them back as JSON.

After that, you can test it by visiting the frontend page or using the browser/network tab to confirm the request returns data.