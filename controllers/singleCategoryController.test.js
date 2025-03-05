import { singleCategoryController } from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import { jest } from "@jest/globals";

jest.mock("../models/categoryModel.js");

describe("singleCategoryController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
      json: jsonMock,
    };

    req = {
      params: {
        slug: "electronics",
      },
    };

    jest.clearAllMocks();
  });

  test("should return category successfully when found", async () => {
    const mockCategory = {
      _id: "1",
      name: "Electronics",
      slug: "electronics",
    };

    categoryModel.findOne.mockResolvedValueOnce(mockCategory);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Get Single Category Successfully",
      category: mockCategory,
    });
  });

  test("should return 404 if category is not found", async () => {
    categoryModel.findOne.mockResolvedValueOnce(null);

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Category not found",
    });
  });

  test("should return 500 if a database error occurs", async () => {
    categoryModel.findOne.mockRejectedValueOnce(new Error("Database error"));

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single category",
      error: expect.any(Error),
    });
  });
});
