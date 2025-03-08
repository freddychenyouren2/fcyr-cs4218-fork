import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token-based
export const requireSignIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Access Denied. No token provided." });
        }

        try {
            const decode = JWT.verify(token, process.env.JWT_SECRET);
            req.user = decode;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
            } else {
                return res.status(401).json({ success: false, message: "Invalid token." });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Admin access
export const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if (!user || user.role !== 1) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin access required.",
            });
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error in admin middleware",
            error,
        });
    }
};
