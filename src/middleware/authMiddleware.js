import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

import { User } from "../models/User.js"
import { decodeExpUnix, verifyAccessToken } from "../utils/token.util.js"
import { getUserPlan } from "../utils/plan.util.js"

export const verifyUser = asyncHandler(async (req, res, next) => {
    try {
        // Check for token in cookies first, then Authorization header
        const cookieToken = req.cookies?.accessToken;
        const headerToken = req.headers["authorization"] || req.headers["Authorization"];
        const bearerToken = headerToken?.replace(/^Bearer\s+/i, "").trim();
        const token = cookieToken || bearerToken;

        console.log('Auth check - Cookies:', req.cookies);
        console.log('Auth check - Token found:', !!token);
        console.log('Auth check - Token source:', cookieToken ? 'cookie' : (bearerToken ? 'header' : 'none'));

        if (!token) {
            // Check if this is a frontend request (HTML) or API request (JSON)
            if (req.accepts('html')) {
                console.log('No token found, redirecting to login');
                return res.redirect('/login');
            } else {
                throw new ApiError(401, "Unauthorized request")
            }
        }

        const decoded = verifyAccessToken(token)
        console.log("Decoded Token:->", decoded)

        const user = await User.findByPk(decoded?.sub, {
            attributes: { exclude: ['password', 'refreshTokens'] }
        });

        if (!user) {
            // Check if this is a frontend request (HTML) or API request (JSON)
            if (req.accepts('html')) {
                return res.redirect('/login');
            } else {
                throw new ApiError(401, "Invalid Access Token")
            }
        }

        // Attach user plan information
        try {
          const userPlan = await getUserPlan(user.id);
          user.plan = userPlan; // Attach plan to user object
        } catch (planError) {
          console.error('Error fetching user plan:', planError);
          user.plan = null; // Set to null if error
        }

        req.user = user;
        console.log("verify User")
        next()
    } catch (error) {
        console.log("Auth error:", error.message);
        
        // Check if this is a frontend request (HTML) or API request (JSON)
        if (req.accepts('html')) {
            // Clear the invalid token cookie
            res.clearCookie('accessToken');
            return res.redirect('/login');
        } else {
            // For API requests, return JSON error
            res.status(401).json({ 
                success: false,
                message: 'Authentication failed', 
                error: error.message 
            });
        }
    }
})

export const verifyOwner = asyncHandler(async (req, res, next) => {
    try {
        // Check for token in cookies first, then Authorization header
        const cookieToken = req.cookies?.accessToken;
        const headerToken = req.headers["authorization"] || req.headers["Authorization"];
        const bearerToken = headerToken?.replace(/^Bearer\s+/i, "").trim();
        const token = cookieToken || bearerToken;

        if (!token) {
            // Check if this is a frontend request (HTML) or API request (JSON)
            if (req.accepts('html')) {
                return res.redirect('/login');
            } else {
                throw new ApiError(401, "Unauthorized request")
            }
        }

        const decoded = verifyAccessToken(token)
        console.log("Decoded Token:->", decoded)

        const owner = await User.findByPk(decoded?.sub, {
            attributes: { exclude: ['password', 'refreshTokens'] }
        });

        if (!owner) {
            // Check if this is a frontend request (HTML) or API request (JSON)
            if (req.accepts('html')) {
                return res.redirect('/login');
            } else {
                throw new ApiError(401, "Invalid Access Token")
            }
        }

        if (owner.role !== "shop_owner") {
            // Check if this is a frontend request (HTML) or API request (JSON)
            if (req.accepts('html')) {
                return res.redirect('/login');
            } else {
                throw new ApiError(403, "Access denied, only shop owner can access")
            }
        }

        req.owner = owner;
        console.log("verify Owner")
        next()
    } catch (error) {
        console.log("Auth error:", error.message);
        
        // Check if this is a frontend request (HTML) or API request (JSON)
        if (req.accepts('html')) {
            // Clear the invalid token cookie
            res.clearCookie('accessToken');
            return res.redirect('/login');
        } else {
            // For API requests, return JSON error
            res.status(401).json({ 
                success: false,
                message: 'Authentication failed', 
                error: error.message 
            });
        }
    }
});