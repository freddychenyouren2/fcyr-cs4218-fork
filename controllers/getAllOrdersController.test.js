import httpMocks from "node-mocks-http";
import { getAllOrdersController } from "../controllers/authController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

describe("getAllOrdersController", () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 1) Orders exist
  it("should return 200 and all orders", async () => {
    const mockOrders = [
      { _id: "orderId1", buyer: "507f1f77bcf86cd799439011", status: "Processing" },
      { _id: "orderId2", buyer: "507f1f77bcf86cd799439012", status: "Shipped" },
    ];

    // Mock the chain: .find({}).populate().populate().sort()
    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockOrders),
    });

    await getAllOrdersController(req, res);

    expect(res.statusCode).toBe(200);

    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    expect(responseData.orders).toHaveLength(2);
    expect(responseData.orders).toEqual(mockOrders);
    expect(responseData.message).toBe("All orders retrieved successfully");
  });

  // 2) No orders exist
  it("should return 200 with an empty array if there are no orders", async () => {
    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    await getAllOrdersController(req, res);

    expect(res.statusCode).toBe(200);

    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    expect(responseData.orders).toEqual([]);
    expect(responseData.message).toBe("All orders retrieved successfully");
  });

  // 3) Database error
  it("should return 500 if there is a database error", async () => {
    orderModel.find.mockImplementation(() => {
      throw new Error("Database Error");
    });

    await getAllOrdersController(req, res);

    expect(res.statusCode).toBe(500);

    const responseData = res._getJSONData();
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Error while retrieving orders");
    expect(responseData.error).toBeDefined();
  });
});
