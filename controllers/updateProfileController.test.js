import mongoose from "mongoose";
import httpMocks from "node-mocks-http";
import { updateProfileController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

jest.mock("mongoose", () => {
  const originalMongoose = jest.requireActual("mongoose");
  return {
    ...originalMongoose,
    Types: {
      ...originalMongoose.Types,
      ObjectId: {
        isValid: jest.fn(),
      },
    },
  };
});

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js", () => ({
  hashPassword: jest.fn(),
}));

describe("updateProfileController", () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();

    // By default, assume the user is logged in and has some valid _id
    req.user = { _id: "507f1f77bcf86cd799439011" }; // typical valid MongoDB ObjectId
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 1) No fields provided
  it("should return 400 if no fields are provided", async () => {
    // Make sure no fields are in req.body
    req.body = {};

    // Return true for isValid check
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    await updateProfileController(req, res);

    expect(res.statusCode).toBe(400);
    const responseData = res._getData();
    expect(responseData).toHaveProperty("success", false);
    expect(responseData).toHaveProperty(
      "message",
      "At least one field is required to update the profile."
    );
  });

  // 2) Invalid user ID
  it("should return 400 if user._id is invalid", async () => {
    req.body = { name: "New Name" };

    // Force isValid to return false
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    await updateProfileController(req, res);

    expect(res.statusCode).toBe(400);
    const responseData = res._getData();
    expect(responseData).toHaveProperty("success", false);
    expect(responseData).toHaveProperty("message", "Invalid user ID format");
  });

  // 3) User not found
  it("should return 404 if user does not exist in DB", async () => {
    req.body = { email: "newemail@example.com" };

    // Valid userId
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    // Mock findById to return null (user not found)
    userModel.findById.mockResolvedValue(null);

    await updateProfileController(req, res);

    expect(res.statusCode).toBe(404);
    const responseData = res._getData();
    expect(responseData).toHaveProperty("success", false);
    expect(responseData).toHaveProperty("message", "User not found");
  });

  // 4) Successful update
  it("should update user and return 200 on success", async () => {
    req.body = {
      name: "Updated Name",
      email: "updated@example.com",
      phone: "1234567890",
      address: "123 Updated Street",
    };

    // If password is included, we should test hashing as well:
    // req.body.password = "newpassword";

    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    // Mock the user found in the DB
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      name: "Old Name",
      email: "old@example.com",
      phone: "0987654321",
      address: "321 Old Street",
    };

    // findById should return the existing user
    userModel.findById.mockResolvedValue(mockUser);

    // If password is provided, the controller calls hashPassword.
    // For demonstration, let's assume no password was provided in this test.

    // findByIdAndUpdate should return the updated user
    const updatedUser = {
      ...mockUser,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(res.statusCode).toBe(200);
    const responseData = res._getData();

    expect(responseData).toHaveProperty("success", true);
    expect(responseData).toHaveProperty("message", "Profile updated successfully");
    // Check the updatedUser object
    expect(responseData.updatedUser).toEqual(updatedUser);

    // Make sure findById was called with the correct user ID
    expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
    // Make sure findByIdAndUpdate was called with correct data
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockUser._id,
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          // No password because we didn't pass one in
        },
      },
      { new: true }
    );
  });

  // 5) Database or unexpected error
  it("should return 500 if there is an error while updating", async () => {
    // Provide some valid body fields
    req.body = { name: "Any Field" };
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);

    // Mock user found
    userModel.findById.mockResolvedValue({ _id: "someid" });

    // Mock the error thrown by findByIdAndUpdate
    userModel.findByIdAndUpdate.mockRejectedValue(new Error("DB Error"));

    await updateProfileController(req, res);

    expect(res.statusCode).toBe(500);
    const responseData = res._getData();
    expect(responseData).toHaveProperty("success", false);
    expect(responseData).toHaveProperty(
      "message",
      "Internal server error while updating profile"
    );
    expect(responseData).toHaveProperty("error", "DB Error");
  });
});
