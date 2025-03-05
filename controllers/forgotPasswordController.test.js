import { forgotPasswordController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { jest } from "@jest/globals";

// Mock Dependencies
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

describe("forgotPasswordController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
    };

    req = {
      body: {
        email: "cs4218@test.com",
        answer: "blue",
        newPassword: "newSecurePassword",
      },
    };

    jest.clearAllMocks();
  });

  // Use Case 1: Missing Required Fields
  test("should return error if email is missing", async () => {
    req.body.email = "";
    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Emai is required" });
  });

  test("should return error if answer is missing", async () => {
    req.body.answer = "";
    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "answer is required" });
  });

  test("should return error if new password is missing", async () => {
    req.body.newPassword = "";
    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "New Password is required" });
  });

  // Use Case 2: User Not Found
  test("should return error if user is not found", async () => {
    userModel.findOne.mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Wrong Email Or Answer",
    });
  });

  // Use Case 3: Successfully Resets Password
  test("should successfully reset password", async () => {
    const mockUser = {
      _id: "67a218decf4efddf1e5358ac",
      email: "cs4218@test.com",
      answer: "blue",
    };

    userModel.findOne.mockResolvedValueOnce(mockUser);
    hashPassword.mockResolvedValueOnce("hashedNewPassword");
    userModel.findByIdAndUpdate.mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, {
      password: "hashedNewPassword",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });
  });

  // Use Case 4: Handles Unexpected Errors
  test("should handle unexpected errors", async () => {
    userModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
      error: expect.any(Error),
    });
  });
});
