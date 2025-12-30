# Social Login / SSO Setup Guide

This guide will help you set up social login (OAuth) for Google, Instagram, Facebook, GitHub, LinkedIn, and Twitter.

## Environment Variables

Add the following environment variables to your `property.env` file:

```env
# Environment Configuration
# Set NODE_ENV to 'prod' or 'production' for production server (15.206.19.156)
# Otherwise, it will use localhost
NODE_ENV=development  # or 'prod'/'production' for production
PORT=3002  # Optional, defaults to 3002

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

## Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3002/api/v1/auth/google/callback` (development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (production)
7. Copy the Client ID and Client Secret to your `.env` file

### 2. Instagram OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Instagram Basic Display" product
4. Go to "Basic Display" → "Settings"
5. Add OAuth Redirect URIs:
   - `http://localhost:3002/api/v1/auth/instagram/callback` (development)
   - `https://yourdomain.com/api/v1/auth/instagram/callback` (production)
6. Copy the App ID and App Secret to your `.env` file

### 3. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to "Settings" → "Basic"
5. Add Valid OAuth Redirect URIs:
   - `http://localhost:3002/api/v1/auth/facebook/callback` (development)
   - `https://yourdomain.com/api/v1/auth/facebook/callback` (production)
6. Copy the App ID and App Secret to your `.env` file

### 4. GitHub OAuth Setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: Your app URL
   - Authorization callback URL: `http://localhost:3002/api/v1/auth/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

### 5. LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Go to "Auth" tab
4. Add redirect URLs:
   - `http://localhost:3002/api/v1/auth/linkedin/callback` (development)
   - `https://yourdomain.com/api/v1/auth/linkedin/callback` (production)
5. Request access to: `r_liteprofile` and `r_emailaddress`
6. Copy the Client ID and Client Secret to your `.env` file

### 6. Twitter OAuth Setup

Twitter OAuth 1.0a requires additional setup. Currently, Twitter login shows a "coming soon" message.

## Database Migration

The User model has been updated to include `socialId` and `socialProvider` fields. If you have existing data, you may need to run a migration:

```sql
ALTER TABLE users 
ADD COLUMN socialId VARCHAR(255) NULL,
ADD COLUMN socialProvider VARCHAR(50) NULL;
```

## Testing

1. Start your server
2. Navigate to `/login`
3. Click on any social login button
4. You'll be redirected to the provider's OAuth page
5. After authorization, you'll be redirected back and logged in

## Notes

- Social login users will have a password starting with `social_` prefix
- If a user already exists with the same email, the social login will link to that account
- Profile pictures from social providers will be saved to the `avatarUrl` field
- Social login tokens are stored in cookies (same as regular login)

