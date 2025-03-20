import request from "supertest";
import app from "../server"; // Ensure correct path
import userModel from "../models/userModel";
import { hashPassword, comparePassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";
import braintree from "braintree";

jest.mock("braintree"); // Ensure mock is used
jest.mock("../models/userModel"); // Mock the database model
jest.mock("../helpers/authHelper"); // Mock hashing functions

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
let testUser;
let newPassword = "NewSecurePass123";
let oldPassword = "OldSecurePass123";

beforeAll(async () => {
    // Mock user creation
    testUser = {
        _id: "testUserId",
        name: "Test User",
        email: "testuser@example.com",
        password: await hashPassword(oldPassword),
        phone: "1234567890",
        address: "123 Test Street",
        answer: await hashPassword("TestAnswer"),
    };

    userModel.findOne = jest.fn(async (query) => {
        if (query.email === "testuser@example.com") return testUser;
        return null;
    });

    userModel.findByIdAndUpdate = jest.fn(async (id, update) => {
        if (id === "testUserId") {
            testUser.password = update.password; // Simulate password update
            return testUser;
        }
        return null;
    });

    comparePassword.mockImplementation(async (inputPassword, storedPassword) => {
        return inputPassword === "TestAnswer"; // Mock correct answer check
    });

    hashPassword.mockImplementation(async (password) => {
        return `hashed_${password}`; // Simulate hashing
    });
});

afterAll(() => {
    jest.clearAllMocks(); // Ensure all mocks are reset
});

/** 1. Request Password Reset Successfully */
test("should allow user to request password reset with correct email and security answer", async () => {
    const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
            email: "testuser@example.com",
            answer: "TestAnswer",
            newPassword,
        });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password reset successfully");
});

/** 2. Reject Incorrect Security Answer */
test("should reject password reset with incorrect security answer", async () => {
    comparePassword.mockImplementationOnce(async (inputAnswer, storedAnswer) => false); // Simulate wrong answer

    const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
            email: "testuser@example.com",
            answer: "WrongAnswer",
            newPassword,
        });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wrong email or security answer");
});

/** 3. Reject Non-Existent User */
test("should reject password reset request for a non-existent user", async () => {
    userModel.findOne.mockImplementationOnce(async (query) => null); // Simulate no user found

    const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
            email: "nonexistent@example.com",
            answer: "TestAnswer",
            newPassword,
        });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wrong email or security answer");
});

/** 4. Verify Login with New Password */
test("should allow user to log in with the new password after reset", async () => {
    comparePassword.mockImplementationOnce(async (inputPassword, storedPassword) => {
        return inputPassword === newPassword; // Simulate successful login with new password
    });

    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "testuser@example.com",
            password: newPassword,
        });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
});

/** 5. Ensure Old Password No Longer Works */
test("should reject login with old password after password reset", async () => {
    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "testuser@example.com",
            password: oldPassword,
        });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid password");
});
