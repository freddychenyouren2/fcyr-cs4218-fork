import { loginController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { comparePassword } from "../helpers/authHelper.js";
import { jest } from "@jest/globals";
import JWT from "jsonwebtoken";

// Mock Dependencies for other modules
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

// Ensure Jest uses the mock `jsonwebtoken` module
jest.mock("jsonwebtoken");

describe("loginController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
      json: jsonMock,
    };

    req = {
      body: {
        email: "cs4218@test.com",
        password: "cs4218@test.com",
      },
    };

    process.env.JWT_SECRET = "test-secret"; // Ensure JWT_SECRET is set
    jest.clearAllMocks();
  });

  test("should return error if email is missing", async () => {
    req.body.email = "";
    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Email and password are required",
    });
  });

  test("should return error if password is missing", async () => {
    req.body.password = "";
    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Email and password are required",
    });
  });

  test("should return error if user is not registered", async () => {
    userModel.findOne.mockResolvedValueOnce(null);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registered",
    });
  });

  test("should return error if password is incorrect", async () => {
    const mockUser = {
      _id: "67a218decf4efddf1e5358ac",
      email: "cs4218@test.com",
      password: "$2b$10$/wWsN./fEX1WiipH57HG.SAwgKv1MRrPSkpMX38Dy5seOEhCoUy",
    };

    userModel.findOne.mockResolvedValueOnce(mockUser);
    comparePassword.mockResolvedValueOnce(false);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("should log in successfully and return a token", async () => {
    const mockUser = {
      _id: "67a218decf4efddf1e5358ac",
      name: "CS 4218 Test Account",
      email: "cs4218@test.com",
      phone: "81234567",
      address: "1 Computing Drive",
      role: 0,
      password: "cs4218@test.com",
    };
  
    userModel.findOne.mockResolvedValueOnce(mockUser);
    comparePassword.mockResolvedValueOnce(true);
  
    // Add this line: mock JWT.sign to return the string "mock-token"
    JWT.sign.mockReturnValueOnce("mock-token");
  
    await loginController(req, res);
  
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Login successfully",
      user: {
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        address: mockUser.address,
        role: mockUser.role,
      },
      token: "mock-token",
    });
  });
  

  test("should handle unexpected database errors", async () => {
    userModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Error in login",
      error: expect.any(Error),
    });
  });
});