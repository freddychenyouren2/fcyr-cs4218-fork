import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Utility function for token verification
const verifyToken = (token) => {
    try {
        return JWT.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error(error);
        throw new Error("JWT Verification Failed");
    }
};

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const authHeaderToken = req.headers.authorization;
        console.log("authHeaderToken: ", authHeaderToken);
        if (!authHeaderToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        const decoded = verifyToken(authHeaderToken);
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