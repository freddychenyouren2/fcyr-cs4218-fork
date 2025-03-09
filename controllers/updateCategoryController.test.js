import { jest } from "@jest/globals";

import { updateCategoryController } from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");
jest.mock("slugify", () =>
    jest.fn((name, options) =>
      options?.lower ? `${name.toLowerCase().replace(/\s+/g, "-")}-slug` : `${name.replace(/\s+/g, "-")}-slug`
    )
);

describe("updateCategoryController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
    };

    req = {
      params: { id: "64a8e8aefb3b3c001f5d8d52" },
      body: { name: "Updated Category" },
    };

    jest.clearAllMocks();
  });

  test("should update category and return 200", async () => {
    const mockUpdatedCategory = {
      _id: "64a8e8aefb3b3c001f5d8d52",
      name: "Updated Category",
      slug: "updated-category-slug",
    };

    categoryModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedCategory);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "64a8e8aefb3b3c001f5d8d52",
      { name: "Updated Category", slug: "updated-category-slug" },
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      messsage: "Category Updated Successfully",
      category: mockUpdatedCategory,
    });
  });

  test("should return 500 when database update fails", async () => {
    categoryModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("Database error"));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while updating category",
      })
    );
  });

  test("should return 500 when `id` is missing in params", async () => {
    req.params.id = undefined;

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Category ID is required",
      })
    );
  });

  test("should return 500 when `name` is missing in body", async () => {
    req.body.name = undefined;

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Category name is required",
      })
    );
  });
});
