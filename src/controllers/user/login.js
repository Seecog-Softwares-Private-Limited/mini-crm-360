import { User } from "../../models/User.js";
import { UserSession } from "../../models/UserSession.js";
import { ActivityLog } from "../../models/ActivityLog.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { buildTokenPair, hashToken } from "../../utils/token.util.js";
import { assignFreeTrialPlan, getUserPlan } from "../../utils/plan.util.js";
import crypto from 'crypto';

export const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isValid = await user.isPasswordCorrect(password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const { accessToken, refreshToken, accessExp, refreshExp } = buildTokenPair(
            user.id
        );

        user.refreshTokens = hashToken(refreshToken);
        user.refreshTokenExpiresAt = refreshExp ? new Date(refreshExp * 1000) : null;
        await user.save();

        // Check if user has a plan, if not assign Free Trial
        try {
          const existingPlan = await getUserPlan(user.id);
          if (!existingPlan) {
            await assignFreeTrialPlan(user.id);
          }
        } catch (planError) {
          console.error('Error checking/assigning plan:', planError);
          // Don't fail login if plan check fails
        }

        // Create session record
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Extract device and browser info from user agent
        let deviceInfo = 'Unknown Device';
        let browserInfo = 'Unknown Browser';
        
        if (userAgent) {
          if (userAgent.includes('Mobile')) {
            deviceInfo = 'Mobile Device';
          } else if (userAgent.includes('Tablet')) {
            deviceInfo = 'Tablet';
          } else {
            deviceInfo = 'Desktop';
          }
          
          if (userAgent.includes('Chrome')) browserInfo = 'Chrome';
          else if (userAgent.includes('Firefox')) browserInfo = 'Firefox';
          else if (userAgent.includes('Safari')) browserInfo = 'Safari';
          else if (userAgent.includes('Edge')) browserInfo = 'Edge';
        }

        try {
          await UserSession.create({
            userId: user.id,
            sessionToken: hashToken(sessionToken),
            deviceInfo,
            browserInfo,
            ipAddress,
            isActive: true
          });
        } catch (sessionError) {
          console.error('Error creating session:', sessionError);
          // Don't fail login if session creation fails
        }

        // Log activity
        try {
          await ActivityLog.create({
            userId: user.id,
            action: 'login',
            description: 'User logged in',
            ipAddress,
            userAgent
          });
        } catch (logError) {
          console.error('Error logging activity:', logError);
          // Don't fail login if activity logging fails
        }

        // Prepare user data for response (exclude sensitive fields)
        const userData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar || user.avatarUrl || null,
          plan: null // Will be fetched on dashboard if needed
        };

        // Cookie options - for production, use secure and sameSite: 'lax' (same-origin)
        // For cross-origin, use 'none', but since API and frontend are same domain, 'lax' is fine
        const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
        const options = {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax", // Same domain, so 'lax' is fine
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/', // Ensure cookies are available for all paths
            domain: undefined // Don't set domain - let browser use current domain
        }
        
        console.log('🍪 Setting cookies with options:', JSON.stringify(options, null, 2));
        console.log('🍪 Cookie domain will be:', req.headers.host);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .cookie("sessionToken", sessionToken, options)
            .json(new ApiResponse(200, { tokens: { accessToken, refreshToken }, user: userData }, "Login Successful"))

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
})

export const logoutUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionToken = req.cookies?.sessionToken;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(401).json({ message: "Invalid user" });
        }

        // Clear refresh tokens and expiry
        user.refreshTokens = null;
        user.refreshTokenExpiresAt = null;
        await user.save();

        // Deactivate session if sessionToken exists
        if (sessionToken) {
          const hashedToken = hashToken(sessionToken);
          await UserSession.update(
            { isActive: false },
            { where: { userId, sessionToken: hashedToken } }
          );
        }

        // Log activity
        await ActivityLog.create({
          userId,
          action: 'logout',
          description: 'User logged out',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || ''
        });

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            expires: new Date(0) // Expire the cookie immediately
        };

        return res
            .status(200)
            .cookie("accessToken", "", options)
            .cookie("refreshToken", "", options)
            .cookie("sessionToken", "", options)
            .json(new ApiResponse(200, null, "Logout Successful"));
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});