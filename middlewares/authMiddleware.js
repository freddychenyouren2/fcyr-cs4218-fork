import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Utility function for token verification
const verifyToken = (token) => {
    try {
        return JWT.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or expired token",
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Error in Sign In Middleware",
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        // Check if user is found
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No user found",
            });
        }

        const user = await userModel.findById(req.user._id);
        if(!user || user.role !== 1) { 
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin Access Required",
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Error in admin middleware",
        });
    }
};