// Integration test for authMiddleware.js
import request from "supertest";
import express from "express";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js";

// Mock environment variable for JWT secret
process.env.JWT_SECRET = "test_secret";

// Create a test Express app
const testApp = express();
testApp.use(express.json());

// User Protected route for testing requireSignIn middleware
testApp.get("/protected", requireSignIn, (req, res) => {
  res.status(200).json({ success: true, message: "Access granted" });
});

// Admin-only Protected route for testing requireSignIn + isAdmin middleware
testApp.get("/admin", requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ success: true, message: "Admin access granted" });
});

// Mock userModel.findById for database queries
jest.mock("../models/userModel.js");

describe("authMiddleware - Integration Tests:", () => {
    let userToken, adminToken;
    beforeAll(() => {
        // Generate Valid User and Admin tokens for tests
        userToken = JWT.sign({_id: "user_id123", role: 0}, process.env.JWT_SECRET, { expiresIn: "7h" });
        adminToken = JWT.sign({_id: "admin_id123", role: 1}, process.env.JWT_SECRET, { expiresIn: "7h" });
    })

    // Test requireSignIn middleware
    describe("requireSignIn middleware", () => {
        it("should allow access and return 200 if a valid token is provided", async () => {
            const response = await request(testApp)
                .get("/protected")
                .set("Authorization", userToken);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, message: "Access granted" });
        });

        it("should block access and return 401 if no token is provided", async () => {
            const response = await request(testApp).get("/protected");
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ success: false, message: "Unauthorized: No token provided" });
        });

        it("should block access and return 401 if an invalid token is provided", async () => {
            const response = await request(testApp)
                .get("/protected")
                .set("Authorization", "invalid_token");
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ success: false, message: "Unauthorized: Invalid or expired token" });
        });
    });

    // Test isAdmin middleware
    describe("isAdmin middleware", () => {
        it("should allow access and return 200 to an admin user", async () => {
            userModel.findById.mockResolvedValueOnce({ _id: "admin_id123", role: 1 });
            const response = await request(testApp)
                .get("/admin")
                .set("Authorization", adminToken);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true, message: "Admin access granted" });
        });

        it("should block access and return 403 to a non-admin user", async () => {
            userModel.findById.mockResolvedValueOnce({ _id: "user_id123", role: 0 });
            const response = await request(testApp)
                .get("/admin")
                .set("Authorization", userToken);
            expect(response.status).toBe(403);
            expect(response.body).toEqual({ success: false, message: "Forbidden: Admin Access Required" });
        });

        it("should block access and return 401 if the user does not exist", async () => {
            const response = await request(testApp).get("/admin");
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ success: false, message: "Unauthorized: No token provided" });
        });
    });
})