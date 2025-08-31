# Login Page Setup Guide

## Configuration

To configure the login API endpoint, create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_LOGIN_URL=http://localhost:3001/api/login
```

Replace the URL with your actual API endpoint.

## Features

The login page includes:

- Username and password input fields
- Form validation
- Loading states during API calls
- Error handling for failed requests
- Automatic redirect to home page on successful login
- Responsive design with Tailwind CSS

## API Requirements

Your backend API should:

1. Accept POST requests to the configured endpoint
2. Expect JSON payload with `username` and `password` fields
3. Return HTTP 200 status on successful authentication
4. Return appropriate error status codes for failed attempts

## Example API Response

**Success (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "123",
    "username": "john_doe"
  }
}
```

**Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

## Usage

1. Navigate to `/login` to access the login page
2. Enter username and password
3. Click "Sign in" button
4. On success, you'll be redirected to the home page
5. On failure, an error message will be displayed

## Navigation

The app includes a navigation bar with:
- Home page link
- Login page link
- Responsive design for mobile and desktop
