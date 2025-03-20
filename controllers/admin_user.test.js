import request from "supertest";
import mongoose from "mongoose";
import app from "../server"; // Ensure correct path
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";

// Define test variables
let userToken;
let adminToken;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

    // 1️. Register & Login Admin User
    await request(app).post("/api/v1/auth/register").send({
        name: "Admin User",
        email: "admin@example.com",
        password: "AdminPass123",
        phone: "9876543210",
        address: "Admin Office",
        answer: "AdminAnswer",
    });

    // Ensure the registered user is promoted to admin
    await userModel.findOneAndUpdate(
        { email: "admin@example.com" },
        { role: 1 } // Set role to Admin
    );

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
        email: "admin@example.com",
        password: "AdminPass123",
    });

    adminToken = adminLogin.body.token;

    if (!adminToken) {
        throw new Error("Admin JWT Token not received! Admin login may have failed.");
    }

    // 2️. Register & Login Regular User
    await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: "testuser@example.com",
        password: "UserPass123",
        phone: "1234567890",
        address: "123 Test Street",
        answer: "TestAnswer",
    });

    const userLogin = await request(app).post("/api/v1/auth/login").send({
        email: "testuser@example.com",
        password: "UserPass123",
    });

    userToken = userLogin.body.token;

    if (!userToken) {
        throw new Error("User JWT Token not received! User login may have failed.");
    }
});

afterAll(async () => {
    await userModel.deleteMany({});
    await mongoose.connection.close();
});

/** Allow Admin Access to Admin Routes */
test("should allow access to admin-auth route with valid admin token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth")
        .set("Authorization", `${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
});

/** Deny Regular User Access to Admin Routes */
test("should deny access to admin-auth route with a non-admin token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth")
        .set("Authorization", `${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Forbidden: Admin Access Required");
});

/** Deny Access Without a Token */
test("should deny access to admin-auth route without a token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: No token provided");
});

/** Deny Access with Invalid Token */
test("should deny access to admin-auth route with an invalid token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth")
        .set("Authorization", "Invalid.Token.String");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: Invalid or expired token");
});
