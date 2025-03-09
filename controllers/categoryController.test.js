import { categoryController } from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import { jest } from "@jest/globals";

jest.mock("../models/categoryModel.js");

describe("categoryController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      status: jest.fn(() => ({ send: jsonMock })),
      send: jsonMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  test("should retrieve all categories successfully", async () => {
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Fashion", slug: "fashion" },
    ];

    categoryModel.find.mockResolvedValueOnce(mockCategories);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: mockCategories,
    });
  });

  test("should return 500 if database error occurs", async () => {
    categoryModel.find.mockRejectedValueOnce(new Error("Database error"));

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting all categories",
      error: expect.any(Error),
    });
  });
});
