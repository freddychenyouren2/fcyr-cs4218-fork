import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js"; // Ensure this points to your Express app
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();  // Ensure previous connection is closed
    }
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

beforeEach(async () => {
    await userModel.deleteMany(); // Reset the database
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});


// Registration Tests

// Test 1: Register a user with valid input
test("should successfully register a user with valid input", async () => {
    const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "Test User",
            email: "test@example.com",
            password: "SecurePass123",
            phone: "1234567890",
            address: "123 Test Street",
            answer: "testAnswer",
        });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User registered successfully");

    const user = await userModel.findOne({ email: "test@example.com" });
    expect(user).toBeTruthy();
    expect(user.name).toBe("Test User");
    expect(user.password).not.toBe("SecurePass123"); // Ensure password is hashed
});


// Test 2: Test Duplicate Email Registration
test("should return 409 when registering with an already existing email", async () => {
    await userModel.create({
        name: "Existing User",
        email: "existing@example.com",
        password: await hashPassword("SecurePass123"),
        phone: "1234567890",
        address: "123 Existing Street",
        answer: "testAnswer",
    });

    const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "New User",
            email: "existing@example.com", // Duplicate email
            password: "AnotherPass123",
            phone: "9876543210",
            address: "456 New Street",
            answer: "testAnswer",
        });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already registered. Please log in.");
});

// Test 3: Test Registration with Invalid Email Format
test("should return 400 for invalid email format", async () => {
    const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "New User",
            email: "invalid-email", // Bad format
            password: "SecurePass123",
            phone: "1234567890",
            address: "123 Invalid Street",
            answer: "testAnswer",
        });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid Email Format");
});

// Test 4: Test Registration with Missing Fields
test("should return 400 for missing required fields", async () => {
    const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "User Without Email",
            password: "NoEmailPass123",
            phone: "1234567890",
            address: "No Email Street",
            answer: "testAnswer",
        });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email is required");
});


// Login Tests

// Test 5: Test Login with Correct Credentials
test("should successfully login with correct credentials", async () => {
    await userModel.create({
        name: "Test User",
        email: "testlogin@example.com",
        password: await hashPassword("CorrectPass123"),
        phone: "1234567890",
        address: "123 Test Street",
        answer: "testAnswer",
    });

    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "testlogin@example.com",
            password: "CorrectPass123",
        });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined(); // Ensure token is returned
});


// Test 6: Test Login with Incorrect Password
test("should return 401 for incorrect password", async () => {
    await userModel.create({
        name: "Test User",
        email: "wrongpass@example.com",
        password: await hashPassword("CorrectPass123"),
        phone: "1234567890",
        address: "123 Test Street",
        answer: "testAnswer",
    });

    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "wrongpass@example.com",
            password: "WrongPass456",
        });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid password");
});


// Test 7: Test Login with Non-Existent Email
test("should return 404 for non-existent email", async () => {
    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "nonexistent@example.com",
            password: "SomePass123",
        });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email is not registered");
});


// Token Verification

// Test 8: Verify JWT Contains Correct User Information
test("should return a JWT token containing user ID", async () => {
    // 1. Ensure user is registered before login
    await request(app)
        .post("/api/v1/auth/register")
        .send({
            name: "Test User",
            email: "testlogin@example.com",
            password: "CorrectPass123",
            phone: "1234567890",
            address: "123 Test Street",
            answer: "Test Answer"
        });

    // 2. Login with the same credentials
    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "testlogin@example.com",
            password: "CorrectPass123",
        });

    // 3. Check if token exists and contains user ID
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decodedToken = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64').toString());
    expect(decodedToken).toHaveProperty("_id");
});


