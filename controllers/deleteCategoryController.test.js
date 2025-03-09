import { jest } from "@jest/globals";
import { deleteCategoryController } from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";

jest.mock("../models/categoryModel.js");

describe("deleteCategoryController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
    };

    req = {
      params: { id: "64a8e8aefb3b3c001f5d8d52" }, // Mock category ID
    };

    jest.clearAllMocks();
  });

  test("should delete category and return 200 when category exists", async () => {
    categoryModel.findByIdAndDelete.mockResolvedValueOnce({ _id: req.params.id });

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("64a8e8aefb3b3c001f5d8d52");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Category Deleted Successfully",
    });
  });

  test("should return 400 if `id` is missing in params", async () => {
    req.params.id = undefined;

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Category ID is required",
    });
  });

  test("should return 404 if category does not exist", async () => {
    categoryModel.findByIdAndDelete.mockResolvedValueOnce(null);

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("64a8e8aefb3b3c001f5d8d52");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Category not found",
    });
  });

  test("should return 500 when database delete operation fails", async () => {
    categoryModel.findByIdAndDelete.mockRejectedValueOnce(new Error("Database error"));

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while deleting category",
      })
    );
  });
});
