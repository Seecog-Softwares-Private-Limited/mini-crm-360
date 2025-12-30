import passport from "passport";
import { Router } from "express";
import { signAccessToken, buildTokenPair, hashToken } from "../utils/token.util.js";

const router = Router();

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // dev: false, prod: true (https)
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

/* Google */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    const user = req.user;

    const { accessToken, refreshToken, refreshExp } = buildTokenPair(user.id);

    user.refreshTokens = hashToken(refreshToken);
    user.refreshTokenExpiresAt = refreshExp ? new Date(refreshExp * 1000) : null;
    await user.save();

    const cookieOptions = getCookieOptions();

    return res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .redirect("/dashboard");
  }
);

/* Facebook */
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  async (req, res) => {
    const user = req.user;

    const { accessToken, refreshToken, refreshExp } = buildTokenPair(user.id);

    user.refreshTokens = hashToken(refreshToken);
    user.refreshTokenExpiresAt = refreshExp ? new Date(refreshExp * 1000) : null;
    await user.save();

    const cookieOptions = getCookieOptions();

    return res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .redirect("/dashboard");
  }
);


/* ✅ Logout (POST) */
router.post("/logout", (req, res) => {
  const baseOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  // ✅ Clear on multiple possible paths (safe + fixes path mismatch)
  const paths = ["/", "/auth", "/api", "/api/v1", "/api/v1/auth", "/api/v1/users"];

  for (const p of paths) {
    res.clearCookie("accessToken", { ...baseOpts, path: p });
    res.clearCookie("refreshToken", { ...baseOpts, path: p });
    res.clearCookie("sessionToken", { ...baseOpts, path: p }); // ✅ IMPORTANT
    res.clearCookie("rzp_unified_session_id", { path: p });    // optional
  }

  return res.status(200).json({ success: true, message: "Logged out successfully" });
});


export default router;
