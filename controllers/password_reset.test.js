import request from "supertest";
import mongoose from "mongoose";
import app from "../server"; // Ensure correct path
import userModel from "../models/userModel";
import { hashPassword } from "../helpers/authHelper";
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

// Define test variables
let testUser;
let newPassword = "NewSecurePass123";
let oldPassword = "OldSecurePass123";

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

    // 1️⃣ Register Test User
    const hashedOldPassword = await hashPassword(oldPassword);
    const hashedAnswer = await hashPassword("TestAnswer");

    testUser = await userModel.create({
        name: "Test User",
        email: "testuser@example.com",
        password: hashedOldPassword,
        phone: "1234567890",
        address: "123 Test Street",
        answer: hashedAnswer
    });
});

afterAll(async () => {
    await userModel.deleteMany({});
    await mongoose.connection.close();
});

/** 1. Request Password Reset Successfully */
test("should allow user to request password reset with correct email and security answer", async () => {
    const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
            email: "testuser@example.com",
            answer: "TestAnswer",
            newPassword
        });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password reset successfully");
});

/** 2. Reject Incorrect Security Answer */
test("should reject password reset with incorrect security answer", async () => {
    const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
            email: "testuser@example.com",
            answer: "WrongAnswer",
            newPassword
        });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wrong email or security answer");
});

/** 3. Reject Non-Existent User */
test("should reject password reset request for a non-existent user", async () => {
    const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
            email: "nonexistent@example.com",
            answer: "TestAnswer",
            newPassword
        });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wrong email or security answer");
});

/** 4. Verify Login with New Password */
test("should allow user to log in with the new password after reset", async () => {
    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "testuser@example.com",
            password: newPassword
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
            password: oldPassword
        });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid password");
});
