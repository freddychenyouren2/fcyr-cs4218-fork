import { jest } from "@jest/globals"; // ✅ Explicitly import Jest in ESM

import { createCategoryController } from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

// ✅ Mock Dependencies
jest.mock("../models/categoryModel.js");

// ✅ Mock `slugify`
jest.mock("slugify", () => jest.fn((name) => `${name}-slug`));

describe("createCategoryController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
    };

    req = {
      body: {
        name: "Electronics",
      },
    };

    jest.clearAllMocks();
  });

  test("should return 401 if name is missing", async () => {
    req.body.name = "";
    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Name is required" });
  });

  test("should return 200 if category already exists", async () => {
    categoryModel.findOne.mockResolvedValueOnce({ name: "Electronics" });

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exisits",
    });
  });

  test("should create a new category", async () => {
    categoryModel.findOne.mockResolvedValueOnce(null);
    categoryModel.prototype.save = jest.fn().mockResolvedValueOnce({
      name: "Electronics",
      slug: "electronics-slug",
    });

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "New category created",
      category: {
        name: "Electronics",
        slug: "electronics-slug",
      },
    });
  });

  test("should return 500 on server error", async () => {
    categoryModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in Category",
      })
    );
  });
});
