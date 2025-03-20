import request from "supertest";
import mongoose from "mongoose";
import app from "../server"; // Ensure correct path
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";
import braintree from "braintree";

jest.mock("braintree"); // Ensure mock is used

describe("Braintree Mock Tests", () => {
    test("should return a fake transaction ID", async () => {
        const gateway = new braintree.BraintreeGateway();
        const response = await gateway.transaction.sale({
            amount: "10.00",
            paymentMethodNonce: "fake-valid-nonce",
        });

        expect(response.success).toBe(true);
        expect(response.transaction.id).toBe("fake_txn_id");
    });
});


// Mock Environment Variable for JWT Secret
process.env.JWT_SECRET = "testsecret";

// Define variables
let validToken;
let adminToken;
let deletedUserToken;
let expiredToken;
let testUserId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

    // 1️. Register & Login Test User
    const hashedPassword = await hashPassword("SecurePass123");

    await request(app).post("/api/v1/auth/register").send({
        name: "Auth Test User",
        email: "authtest@example.com",
        password: "SecurePass123",
        phone: "1234567890",
        address: "123 Test Street",
        answer: "Test Answer",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
        email: "authtest@example.com",
        password: "SecurePass123",
    });

    validToken = loginResponse.body.token;
    testUserId = loginResponse.body.user._id;

    if (!validToken) {
        throw new Error("JWT Token not received! Login may have failed.");
    }

    // 2️. Register & Login Admin User
    await request(app).post("/api/v1/auth/register").send({
        name: "Admin User",
        email: "admin@example.com",
        password: "SecurePass123",
        phone: "9876543210",
        address: "Admin Office",
        answer: "Admin Answer",
    });

    await userModel.findOneAndUpdate(
        { email: "admin@example.com" },
        { role: 1 } // Ensure the user is actually set as an admin
    );

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
        email: "admin@example.com",
        password: "SecurePass123",
    });

    adminToken = adminLogin.body.token;
    if (!adminToken) {
        throw new Error("Admin JWT Token not received! Admin login may have failed.");
    }

    // 3️. Register & Delete a User to Simulate Non-Existing User
    await request(app).post("/api/v1/auth/register").send({
        name: "Deleted User",
        email: "deleted@example.com",
        password: "SecurePass123",
        phone: "9876543210",
        address: "456 Fake St",
        answer: "Deleted Answer",
    });

    const deletedUser = await userModel.findOne({ email: "deleted@example.com" });

    if (!deletedUser) {
        throw new Error("Deleted User registration failed.");
    }

    deletedUserToken = JWT.sign({ _id: deletedUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Now delete the user
    await userModel.findByIdAndDelete(deletedUser._id);

    // 4️. Generate Expired Token
    expiredToken = JWT.sign({ _id: testUserId }, process.env.JWT_SECRET, { expiresIn: "-1s" });

});


afterAll(async () => {
    await userModel.deleteMany({});
    await mongoose.connection.close();
});

/** 1️. Verify Access with Valid Token */
test("should allow access to protected route with valid token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/test")
        .set("Authorization", `${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Protected Routes");
});

/** 2️. Verify Access with Missing Token */
test("should deny access to protected route without token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/user-auth");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: No token provided");
});

/** 3️. Verify Access with Invalid Token */
test("should deny access to protected route with invalid token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/user-auth")
        .set("Authorization", "Invalid.Token.String");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: Invalid or expired token");
});

/** 4️. Verify Access with Expired Token */
test("should deny access to protected route with expired token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/user-auth")
        .set("Authorization", `${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: Invalid or expired token");
});

/** 5️. Verify Access with Token of a Deleted User */
test("should deny access to protected route if user no longer exists", async () => {
    const res = await request(app)
        .get("/api/v1/auth/user-auth")
        .set("Authorization", `${deletedUserToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: No user found");
});

/** 6️. Allow Access to Admin Route with Admin Token */
test("should allow access to admin-auth route with valid admin token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth")
        .set("Authorization", `${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
});

/** 7️. Deny Access to Admin Route with Regular User Token */
test("should deny access to admin-auth route with a non-admin token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth")
        .set("Authorization", `${validToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Forbidden: Admin Access Required");
});

/** 8️. Deny Access to Admin Route Without a Token */
test("should deny access to admin-auth route without token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: No token provided");
});

/** 9️. Deny Access to Admin Route with Invalid Token */
test("should deny access to admin-auth route with invalid token", async () => {
    const res = await request(app)
        .get("/api/v1/auth/admin-auth")
        .set("Authorization", "Invalid.Token.String");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: Invalid or expired token");
});
