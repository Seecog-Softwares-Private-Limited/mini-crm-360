// src/controllers/user/activateAccount.js
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { User } from '../../models/User.js';
import { buildTokenPair, hashToken } from '../../utils/token.util.js';
import { assignFreeTrialPlan } from '../../utils/plan.util.js';

/**
 * Activate user account via activation token
 */
export const activateAccount = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        throw new ApiError(400, 'Activation token is required');
    }

    // Find user by activation token
    const user = await User.findOne({
        where: {
            activationToken: token,
            isActivated: false
        }
    });

    if (!user) {
        // Check if token exists but account is already activated
        const alreadyActivated = await User.findOne({
            where: { activationToken: token }
        });
        
        if (alreadyActivated && alreadyActivated.isActivated) {
            return res.status(200).render('activate-account', {
                title: 'Account Already Activated',
                success: false,
                message: 'Your account has already been activated. You can now log in.',
                user: null
            });
        }

        return res.status(400).render('activate-account', {
            title: 'Invalid Activation Link',
            success: false,
            message: 'Invalid or expired activation token. Please request a new activation email.',
            user: null
        });
    }

    // Check if token has expired
    if (user.activationTokenExpires && new Date() > new Date(user.activationTokenExpires)) {
        return res.status(400).render('activate-account', {
            title: 'Activation Link Expired',
            success: false,
            message: 'This activation link has expired. Please request a new activation email.',
            user: null
        });
    }

    // Activate the account
    user.isActivated = true;
    user.activationToken = null;
    user.activationTokenExpires = null;
    await user.save();

    // Build tokens for immediate login
    const { accessToken, refreshToken, refreshExp } = buildTokenPair(user.id);

    // Persist refresh token
    user.refreshTokens = hashToken(refreshToken);
    user.refreshTokenExpiresAt = refreshExp ? new Date(refreshExp * 1000) : null;
    await user.save();

    // Set cookies for automatic login
    const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    };

    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    // Render success page
    return res.status(200).render('activate-account', {
        title: 'Account Activated Successfully',
        success: true,
        message: 'Your account has been activated successfully! You can now log in.',
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }
    });
});

/**
 * Resend activation email
 */
export const resendActivationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
        // Don't reveal if user exists or not for security
        return res.status(200).json(
            new ApiResponse(200, null, 'If an account exists with this email, an activation link has been sent.')
        );
    }

    if (user.isActivated) {
        return res.status(400).json(
            new ApiResponse(400, null, 'Account is already activated. You can log in.')
        );
    }

    // Generate new activation token
    const cryptoModule = await import('crypto');
    const activationToken = cryptoModule.randomBytes(32).toString('hex');
    const activationTokenExpires = new Date();
    activationTokenExpires.setHours(activationTokenExpires.getHours() + 24);

    user.activationToken = activationToken;
    user.activationTokenExpires = activationTokenExpires;
    await user.save();

    // Send activation email
    const { sendActivationEmail } = await import('../../utils/emailService.js');
    const productionUrl = process.env.PRODUCTION_URL || 'https://petserviceinhome.com';
    const developmentUrl = process.env.DEVELOPMENT_URL || `http://localhost:${process.env.PORT || 3002}`;
    const baseUrl = process.env.NODE_ENV === 'production' ? productionUrl : developmentUrl;
    const activationUrl = `${baseUrl}/activate/${activationToken}`;

    try {
        await sendActivationEmail({
            to: normalizedEmail,
            firstName: user.firstName,
            activationToken,
            activationUrl,
        });

        return res.status(200).json(
            new ApiResponse(200, null, 'Activation email has been sent. Please check your inbox.')
        );
    } catch (emailError) {
        console.error('Error sending activation email:', emailError);
        throw new ApiError(500, 'Failed to send activation email. Please try again later.');
    }
});

