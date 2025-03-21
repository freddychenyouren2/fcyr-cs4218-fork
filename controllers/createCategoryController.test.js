import { jest } from "@jest/globals";

import { createCategoryController } from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");

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

  test("should return 400 if name is missing", async () => {
    req.body.name = "";
    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Name is required" });
  });

  test("should return 409 if category already exists", async () => {
    categoryModel.findOne.mockResolvedValueOnce({ name: "Electronics" });

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Category already exists",
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
    const consoleErrorMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    categoryModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in Category",
      })
    );

    consoleErrorMock.mockRestore();
  });
});