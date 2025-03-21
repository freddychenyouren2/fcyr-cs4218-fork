import request from "supertest";
import app from "../app";
import userModel from "../models/userModel";
import * as authHelper from "../helpers/authHelper";
import JWT from "jsonwebtoken";
import braintree from "braintree";

jest.mock("braintree");
jest.mock("../models/userModel");

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

let testUser;
let newPassword = "NewSecurePass123";
let oldPassword = "OldSecurePass123";

beforeAll(async () => {
  jest.spyOn(authHelper, "comparePassword");
  jest.spyOn(authHelper, "hashPassword");

  testUser = {
    _id: "testUserId",
    name: "Test User",
    email: "testuser@example.com",
    password: `hashed_${oldPassword}`,
    phone: "1234567890",
    address: "123 Test Street",
    answer: `hashed_TestAnswer`,
    role: 0,
  };

  userModel.findOne = jest.fn(async (query) => {
    if (query.email === testUser.email) return testUser;
    return null;
  });

  userModel.findByIdAndUpdate = jest.fn(async (id, update) => {
    if (id === testUser._id) {
      testUser = { ...testUser, ...update };
      return testUser;
    }
    return null;
  });

  authHelper.hashPassword.mockImplementation(async (pw) => `hashed_${pw}`);

  authHelper.comparePassword.mockImplementation(async (input, hashed) => {
    return (
      (input === oldPassword && hashed === `hashed_${oldPassword}`) ||
      (input === newPassword && hashed === `hashed_${newPassword}`) ||
      (input === "TestAnswer" && hashed === `hashed_TestAnswer`)
    );
  });
});

afterAll(() => {
  jest.clearAllMocks();
});

/** 1. Request Password Reset Successfully */
test("should allow user to request password reset with correct email and security answer", async () => {
  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({
      email: testUser.email,
      answer: "TestAnswer",
      newPassword,
    });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBe("Password reset successfully");
});

/** 2. Reject Incorrect Security Answer */
test("should reject password reset with incorrect security answer", async () => {
  authHelper.comparePassword.mockImplementationOnce(async () => false);

  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({
      email: testUser.email,
      answer: "WrongAnswer",
      newPassword,
    });

  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Wrong email or security answer");
});

/** 3. Reject Non-Existent User */
test("should reject password reset request for a non-existent user", async () => {
  userModel.findOne.mockImplementationOnce(async () => null);

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
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: testUser.email,
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
      email: testUser.email,
      password: oldPassword,
    });

  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBe("Invalid password");
});
