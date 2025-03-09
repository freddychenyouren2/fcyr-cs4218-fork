import { registerController } from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { jest } from "@jest/globals";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

const testUser = {
  _id: "67a218decf4efddf1e5358ac",
  name: "CS 4218 Test Account",
  email: "cs4218@test.com",
  password: "hashedpassword123",
  phone: "81234567",
  address: "1 Computing Drive",
  answer: "password is cs4218@test.com",
  role: 0,
};

describe("registerController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
    };

    req = {
      body: {
        name: testUser.name,
        email: testUser.email,
        password: "plaintextpassword",
        phone: testUser.phone,
        address: testUser.address,
        answer: testUser.answer,
      },
    };

    jest.clearAllMocks();
  });

  // Missing Required Fields
  test("should return 400 if name is missing", async () => {
    req.body.name = "";
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Name is required",
    });
  });

  test("should return 400 if email is missing", async () => {
    req.body.email = "";
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Email is required",
    });
  });

  test("should return 400 if password is missing", async () => {
    req.body.password = "";
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Password is required",
    });
  });

  test("should return 400 if phone is missing", async () => {
    req.body.phone = "";
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Phone number is required",
    });
  });

  test("should return 400 if address is missing", async () => {
    req.body.address = "";
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Address is required",
    });
  });

  test("should return 400 if security answer is missing", async () => {
    req.body.answer = "";
    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Security answer is required",
    });
  });

  // User Already Exists
  test("should return 409 if user is already registered", async () => {
    userModel.findOne.mockResolvedValueOnce(testUser);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Email already registered. Please log in.",
    });
  });

  // Successful Registration
  test("should successfully register a user", async () => {
    userModel.findOne.mockResolvedValueOnce(null);
    hashPassword.mockResolvedValueOnce("hashedpassword123");
    userModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValueOnce({
        _id: "67a218decf4efddf1e5358ac",
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        address: testUser.address,
        password: "hashedpassword123",
        answer: "hashedsecurityanswer",
      }),
    }));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "User registered successfully",
      user: expect.objectContaining({
        _id: "67a218decf4efddf1e5358ac",
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        address: testUser.address,
      }),
    });
  });

  // Handle Unexpected Errors
  test("should handle unexpected errors", async () => {
    userModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Error in registration",
      error: expect.any(Error),
    });
  });
});
