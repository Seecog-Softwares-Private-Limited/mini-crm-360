import passport from "passport";
import { Router } from "express";
import { signAccessToken } from "../utils/token.util.js";
import { buildTokenPair, hashToken } from "../utils/token.util.js";

const router = Router();

/* Google */
router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res) => {
        const user = req.user;

        // 1️⃣ Generate access + refresh token
        const { accessToken, refreshToken, refreshExp } =
            buildTokenPair(user.id);

        // 2️⃣ Save hashed refresh token in DB
        user.refreshTokens = hashToken(refreshToken);
        user.refreshTokenExpiresAt = refreshExp
            ? new Date(refreshExp * 1000)
            : null;

        await user.save();

        // 3️⃣ Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: false,          
            sameSite: "lax",        
            path: "/",           
        };

        res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect("/dashboard");
    }
);

/* Facebook & Instagram */
router.get("/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
);

router.get("/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    (req, res) => {
        const token = signAccessToken(req.user.id);
        res.redirect(`/dashboard?token=${token}`);
    }
);

router.post("/logout", async (req, res) => {
  // Clear cookies
  res
    .clearCookie("accessToken", { path: "/" })
    .clearCookie("refreshToken", { path: "/" })
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
});


export default router;
