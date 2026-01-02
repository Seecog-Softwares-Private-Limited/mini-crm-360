// src/middleware/adminMiddleware.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to verify user is an admin
 * Must be used after verifyUser middleware
 */
export const verifyAdmin = asyncHandler(async (req, res, next) => {
    try {
        // Check if user is authenticated (should be set by verifyUser middleware)
        if (!req.user) {
            if (req.accepts('html')) {
                return res.redirect('/login');
            } else {
                throw new ApiError(401, "Authentication required");
            }
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            if (req.accepts('html')) {
                return res.status(403).send(`
                    <html>
                        <head><title>Access Denied</title></head>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1 style="color: #dc2626;">403 - Access Denied</h1>
                            <p>You do not have permission to access this page.</p>
                            <a href="/dashboard" style="color: #667eea; text-decoration: none;">Go to Dashboard</a>
                        </body>
                    </html>
                `);
            } else {
                throw new ApiError(403, "Access denied. Admin role required.");
            }
        }

        next();
    } catch (error) {
        console.log("Admin auth error:", error.message);
        
        // For API requests, always return JSON
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                error: error.message
            });
        }
        
        // For HTML requests, return HTML error page
        if (req.accepts('html')) {
            return res.status(403).send(`
                <html>
                    <head><title>Access Denied</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #dc2626;">403 - Access Denied</h1>
                        <p>${error.message}</p>
                        <a href="/dashboard" style="color: #667eea; text-decoration: none;">Go to Dashboard</a>
                    </body>
                </html>
            `);
        } else {
            res.status(403).json({
                success: false,
                message: 'Access denied',
                error: error.message
            });
        }
    }
});

