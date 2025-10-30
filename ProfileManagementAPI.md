# Profile Management API Documentation

## Overview
This document describes the Profile Management APIs for the VCareer application. These APIs allow users to manage their personal information and change their passwords.

## Authentication
All API endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get Current User Profile
**GET** `/api/profile`

Gets the current authenticated user's profile information.

**Authorization:** Requires `VCareer.Profile` permission

**Response:**
```json
{
  "id": "guid",
  "name": "string",
  "surname": "string", 
  "email": "string",
  "phoneNumber": "string",
  "bio": "string",
  "dateOfBirth": "2023-01-01T00:00:00Z",
  "gender": true,
  "location": "string",
  "address": "string",
  "nationality": "string",
  "maritalStatus": "string",
  "userName": "string",
  "emailConfirmed": true,
  "phoneNumberConfirmed": true,
  "creationTime": "2023-01-01T00:00:00Z",
  "lastModificationTime": "2023-01-01T00:00:00Z"
}
```

### 2. Update Personal Information
**PUT** `/api/profile/personal-info`

Updates the current user's personal information.

**Authorization:** Requires `VCareer.Profile.UpdatePersonalInfo` permission

**Request Body:**
```json
{
  "name": "string (required, max 256 chars)",
  "surname": "string (required, max 256 chars)",
  "email": "string (email format, max 256 chars)",
  "phoneNumber": "string (phone format, max 16 chars)",
  "bio": "string (max 1000 chars)",
  "dateOfBirth": "2023-01-01T00:00:00Z",
  "gender": true,
  "location": "string (max 500 chars)",
  "address": "string (max 1000 chars)",
  "nationality": "string (max 100 chars)",
  "maritalStatus": "string (max 50 chars)"
}
```

**Response:** 204 No Content (on success)

**Error Responses:**
- 400 Bad Request: Validation errors
- 401 Unauthorized: Invalid or missing token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: User not found

### 3. Change Password
**PUT** `/api/profile/change-password`

Changes the current user's password.

**Authorization:** Requires `VCareer.Profile.ChangePassword` permission

**Request Body:**
```json
{
  "currentPassword": "string (required, min 6 chars, max 100 chars)",
  "newPassword": "string (required, min 6 chars, max 100 chars)",
  "confirmPassword": "string (required, must match newPassword)"
}
```

**Response:** 204 No Content (on success)

**Error Responses:**
- 400 Bad Request: Validation errors or incorrect current password
- 401 Unauthorized: Invalid or missing token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: User not found

## Error Handling

All APIs follow standard HTTP status codes and return error details in the following format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string",
    "data": {},
    "validationErrors": [
      {
        "message": "string",
        "members": ["string"]
      }
    ]
  }
}
```

## Validation Rules

### UpdatePersonalInfoDto
- `name`: Required, maximum 256 characters
- `surname`: Required, maximum 256 characters  
- `email`: Valid email format, maximum 256 characters
- `phoneNumber`: Valid phone format, maximum 16 characters
- `bio`: Maximum 1000 characters
- `location`: Maximum 500 characters
- `address`: Maximum 1000 characters
- `nationality`: Maximum 100 characters
- `maritalStatus`: Maximum 50 characters

### ChangePasswordDto
- `currentPassword`: Required, 6-100 characters
- `newPassword`: Required, 6-100 characters
- `confirmPassword`: Required, must match `newPassword`

## Usage Examples

### Update Personal Information
```bash
curl -X PUT "https://api.vcareer.com/api/profile/personal-info" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "surname": "Doe", 
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "bio": "Experienced software developer",
    "dateOfBirth": "1990-01-01T00:00:00Z",
    "gender": true,
    "location": "New York, USA",
    "address": "123 Main St, New York, NY 10001",
    "nationality": "American",
    "maritalStatus": "Single"
  }'
```

### Change Password
```bash
curl -X PUT "https://api.vcareer.com/api/profile/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456", 
    "confirmPassword": "newPassword456"
  }'
```

## Security Considerations

1. **Password Requirements**: Passwords must be at least 6 characters long
2. **Current Password Verification**: The current password is verified before allowing password change
3. **Permission-based Access**: All endpoints require appropriate permissions
4. **Input Validation**: All inputs are validated on both client and server side
5. **Audit Logging**: All profile updates are logged for audit purposes

## Notes

- Profile information is stored using ABP's ExtraProperties feature for additional fields
- All timestamps are in UTC format
- The API follows RESTful conventions
- All endpoints return appropriate HTTP status codes
- Error messages are localized and can be translated
