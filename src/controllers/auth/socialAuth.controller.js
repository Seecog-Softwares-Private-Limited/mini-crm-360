import { User } from '../../models/User.js';
import { buildTokenPair, hashToken } from '../../utils/token.util.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import axios from 'axios';

/**
 * Generic social login handler
 */
const handleSocialLoginCallback = async (req, res, profile, provider) => {
  try {
    const { id, email, firstName, lastName, picture, phoneNo } = profile;

    if (!email) {
      return res.redirect('/login?error=Email is required for social login');
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        phoneNo: phoneNo || null,
        avatarUrl: picture || null,
        password: `social_${provider}_${id}`, // Dummy password for social users
        socialId: id,
        socialProvider: provider,
      });
    } else {
      // Update social info if not set
      if (!user.socialId) {
        user.socialId = id;
        user.socialProvider = provider;
        if (picture && !user.avatarUrl) {
          user.avatarUrl = picture;
        }
        await user.save();
      }
    }

    // Generate tokens
    const { accessToken, refreshToken, accessExp, refreshExp } = buildTokenPair(user.id);

    // Update refresh token
    user.refreshTokens = hashToken(refreshToken);
    user.refreshTokenExpiresAt = refreshExp ? new Date(refreshExp * 1000) : null;
    await user.save();

    // Set cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    res
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .redirect('/dashboard');
  } catch (error) {
    console.error(`Social login error (${provider}):`, error);
    res.redirect('/login?error=Social login failed');
  }
};

/**
 * Google OAuth
 */
// Helper function to get API base URL based on environment
const getApiBaseUrl = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 3002;
  
  if (nodeEnv === 'prod' || nodeEnv === 'production') {
    return `https://petserviceinhome.com:${port}`;
  }
  return `http://localhost:${port}`;
};

export const googleAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${getApiBaseUrl()}/api/v1/auth/google/callback`;
  const scope = 'openid email profile';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  
  res.redirect(authUrl);
});

export const googleCallback = asyncHandler(async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/login?error=Authorization failed');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${getApiBaseUrl()}/api/v1/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, email, given_name, family_name, picture } = userResponse.data;

    await handleSocialLoginCallback(req, res, {
      id,
      email,
      firstName: given_name,
      lastName: family_name,
      picture,
      provider: 'google',
    }, 'google');
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/login?error=Google login failed');
  }
});

/**
 * Instagram OAuth (Basic Display API)
 */
export const instagramAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = `${getApiBaseUrl()}/api/v1/auth/instagram/callback`;
  const scope = 'user_profile,user_media';
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  res.redirect(authUrl);
});

export const instagramCallback = asyncHandler(async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/login?error=Authorization failed');
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = `${getApiBaseUrl()}/api/v1/auth/instagram/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const { access_token, user_id } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(`https://graph.instagram.com/${user_id}?fields=id,username&access_token=${access_token}`);

    const { id, username } = userResponse.data;

    await handleSocialLoginCallback(req, res, {
      id,
      email: `${username}@instagram.com`, // Instagram doesn't provide email
      firstName: username,
      lastName: '',
      picture: null,
      provider: 'instagram',
    }, 'instagram');
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    res.redirect('/login?error=Instagram login failed');
  }
});

/**
 * Facebook OAuth
 */
export const facebookAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${getApiBaseUrl()}/api/v1/auth/facebook/callback`;
  const scope = 'email,public_profile';
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  res.redirect(authUrl);
});

export const facebookCallback = asyncHandler(async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/login?error=Authorization failed');
    }

    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${getApiBaseUrl()}/api/v1/auth/facebook/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token,
      },
    });

    const { id, email, name, picture } = userResponse.data;
    const nameParts = name ? name.split(' ') : ['User', ''];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    await handleSocialLoginCallback(req, res, {
      id,
      email: email || `${id}@facebook.com`,
      firstName,
      lastName,
      picture: picture?.data?.url || null,
      provider: 'facebook',
    }, 'facebook');
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.redirect('/login?error=Facebook login failed');
  }
});

/**
 * GitHub OAuth
 */
export const githubAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${getApiBaseUrl()}/api/v1/auth/github/callback`;
  const scope = 'user:email';
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  
  res.redirect(authUrl);
});

export const githubCallback = asyncHandler(async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/login?error=Authorization failed');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${getApiBaseUrl()}/api/v1/auth/github/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }, {
      headers: { Accept: 'application/json' },
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const [userResponse, emailResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${access_token}` },
      }),
    ]);

    const { id, login, name, avatar_url } = userResponse.data;
    const emailData = emailResponse.data.find(e => e.primary) || emailResponse.data[0];
    const email = emailData?.email || `${login}@github.com`;
    const nameParts = name ? name.split(' ') : [login, ''];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    await handleSocialLoginCallback(req, res, {
      id: id.toString(),
      email,
      firstName,
      lastName,
      picture: avatar_url,
      provider: 'github',
    }, 'github');
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect('/login?error=GitHub login failed');
  }
});

/**
 * LinkedIn OAuth
 */
export const linkedinAuth = asyncHandler(async (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${getApiBaseUrl()}/api/v1/auth/linkedin/callback`;
  const scope = 'r_liteprofile r_emailaddress';
  const state = Math.random().toString(36).substring(7);
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
  
  res.redirect(authUrl);
});

export const linkedinCallback = asyncHandler(async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/login?error=Authorization failed');
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${getApiBaseUrl()}/api/v1/auth/linkedin/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const [profileResponse, emailResponse] = await Promise.all([
      axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    ]);

    const { id, firstName, lastName } = profileResponse.data;
    const email = emailResponse.data?.elements?.[0]?.['handle~']?.emailAddress || `${id}@linkedin.com`;

    await handleSocialLoginCallback(req, res, {
      id: id.toString(),
      email,
      firstName: firstName?.localized?.en_US || 'User',
      lastName: lastName?.localized?.en_US || '',
      picture: null,
      provider: 'linkedin',
    }, 'linkedin');
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    res.redirect('/login?error=LinkedIn login failed');
  }
});

/**
 * Twitter OAuth (OAuth 1.0a)
 */
export const twitterAuth = asyncHandler(async (req, res) => {
  // Twitter OAuth 1.0a requires a more complex flow
  // For now, redirect to a placeholder
  res.redirect('/login?error=Twitter login coming soon');
});

export const twitterCallback = asyncHandler(async (req, res) => {
  res.redirect('/login?error=Twitter login coming soon');
});

