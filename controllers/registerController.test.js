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
  password: "$2b$10$//wWsN./fEXiWiipH57HG.SAwgKv1MRrPSkpM3BDy5seOEhCoUy",
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

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // Use Case 1: Missing Required Fields
  test("should return error if name is missing", async () => {
    req.body.name = "";
    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  test("should return error if email is missing", async () => {
    req.body.email = "";
    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
  });

  test("should return error if password is missing", async () => {
    req.body.password = "";
    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
  });

  test("should return error if phone is missing", async () => {
    req.body.phone = "";
    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
  });

  test("should return error if address is missing", async () => {
    req.body.address = "";
    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
  });

  test("should return error if answer is missing", async () => {
    req.body.answer = "";
    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
  });

  // Use Case 2: User Already Exists
  test("should return error if user is already registered", async () => {
    userModel.findOne.mockResolvedValueOnce(testUser);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Already Register please login",
    });
  });

  // Use Case 3: Successfully Registers User
  test("should successfully register a user", async () => {
    userModel.findOne.mockResolvedValueOnce(null); // No existing user
    hashPassword.mockResolvedValueOnce("hashedpassword123");
    userModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValueOnce({
        _id: "67a218decf4efddf1e5358ac",
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        address: testUser.address,
        password: "hashedpassword123",
        answer: testUser.answer,
      }),
    }));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "User Register Successfully",
      user: expect.objectContaining({
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        address: testUser.address,
      }),
    });
  });

  // Use Case 4: Handles Unexpected Errors
  test("should handle unexpected errors", async () => {
    userModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Errro in Registeration",
      error: expect.any(Error),
    });
  });
});
