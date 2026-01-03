// src/controllers/user/register.js
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { User } from '../../models/User.js';
import { buildTokenPair, hashToken } from '../../utils/token.util.js';
import { assignFreeTrialPlan } from '../../utils/plan.util.js';
import { sendActivationEmail } from '../../utils/emailService.js';
import crypto from 'crypto';

/**
 * Check if email already exists
 */
export const checkEmailExists = asyncHandler(async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    // Normalize email: trim and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ where: { email: normalizedEmail } });
    
    return res.status(200).json(
        new ApiResponse(200, { exists: !!user }, user ? 'Email already exists' : 'Email is available')
    );
});

export default async function register(req, res) {
    try {
        const { firstName, lastName, phoneNo, email, password } = req.body || {};
        if (!firstName || !lastName || !phoneNo || !email || !password) {
            return res.status(404).json({ message: 'firstName, lastName, phoneNo, email and password required' });
        }

        // Normalize email: trim and convert to lowercase
        const normalizedEmail = email.trim().toLowerCase();
        console.log('registering user', normalizedEmail);

        const exists = await User.findOne({ where: { email: normalizedEmail } });
        if (exists) return res.status(404).json({ message: 'User already exists' });

        // Generate activation token
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpires = new Date();
        activationTokenExpires.setHours(activationTokenExpires.getHours() + 24); // 24 hours expiry

        const user = await User.create({
            avatarUrl: null,
            firstName, 
            lastName,
            phoneNo,
            email: normalizedEmail,
            password,
            isActivated: false,
            activationToken,
            activationTokenExpires,
        });

        const createdUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while creating user");
        }

        // Assign Free Trial plan to new user
        try {
          await assignFreeTrialPlan(createdUser.id);
        } catch (planError) {
          console.error('Error assigning Free Trial plan:', planError);
          // Don't fail registration if plan assignment fails
        }

        // Send activation email
        const productionUrl = process.env.PRODUCTION_URL || 'https://petserviceinhome.com';
        const developmentUrl = process.env.DEVELOPMENT_URL || `http://localhost:${process.env.PORT || 3002}`;
        const baseUrl = process.env.NODE_ENV === 'production' ? productionUrl : developmentUrl;
        const activationUrl = `${baseUrl}/activate/${activationToken}`;

        try {
            const emailSent = await sendActivationEmail({
                to: normalizedEmail,
                firstName: firstName,
                activationToken,
                activationUrl,
            });

            if (!emailSent) {
                console.error('Failed to send activation email, but user was created');
                // Don't fail registration if email fails, but log it
            }
        } catch (emailError) {
            console.error('Error sending activation email:', emailError);
            // Don't fail registration if email fails
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, { 
                    user: {
                        id: createdUser.id,
                        firstName: createdUser.firstName,
                        lastName: createdUser.lastName,
                        email: createdUser.email,
                        isActivated: false
                    }
                }, "Registration successful! Please check your email to activate your account.")
            )
    } catch (e) {
        console.error('register error', e);
        return res.status(500).json({ message: 'internal_error' });
    }
}