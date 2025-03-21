import request from "supertest";
import app from "../app"; // Ensure correct path
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";
import braintree from "braintree";

jest.mock("braintree"); // Ensure mock is used
jest.mock("../models/userModel"); // Mock the database model

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

// Define test variables
let userToken;
let adminToken;

beforeAll(async () => {
    // Mock userModel.findById() to return user details based on token
    userModel.findById = jest.fn(async (id) => {
        if (id === "adminId") {
            return { _id: "adminId", role: 1 }; // Admin
        } else if (id === "userId") {
            return { _id: "userId", role: 0 }; // Regular user
        }
        return null;
    });

    // Mock user registration
    userModel.create.mockImplementation(async (userData) => ({
        _id: userData.email.includes("admin") ? "adminId" : "userId",
        ...userData,
    }));

    // Mock user login response
    userModel.findOne.mockImplementation(async (query) => {
        if (query.email === "admin@example.com") {
            return { _id: "adminId", role: 1, password: await hashPassword("AdminPass123") };
        } else if (query.email === "testuser@example.com") {
            return { _id: "userId", role: 0, password: await hashPassword("UserPass123") };
        }
        return null;
    });

    // Generate JWT Tokens (simulating login)
    adminToken = JWT.sign({ _id: "adminId" }, process.env.JWT_SECRET || "testsecret", {
        expiresIn: "7d",
    });

    userToken = JWT.sign({ _id: "userId" }, process.env.JWT_SECRET || "testsecret", {
        expiresIn: "7d",
    });

    if (!adminToken || !userToken) {
        throw new Error("JWT Token not generated properly!");
    }
});


afterAll(() => {
    jest.clearAllMocks(); // Ensure all mocks are reset
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
