import httpMocks from "node-mocks-http";
import { getOrdersController } from "./authController.js"; // adjust path if needed
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

describe("getOrdersController", () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    req.user = { _id: "507f1f77bcf86cd799439011" };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 with an empty order list if the user has no orders", async () => {
    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    await getOrdersController(req, res);

    expect(res.statusCode).toBe(200);
    // Because the controller uses `res.json(...)`, use `_getJSONData()`
    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    expect(responseData.orders).toEqual([]);
    expect(responseData.message).toBe("Orders retrieved successfully");
  });

  it("should return 200 and a list of orders", async () => {
    const mockOrders = [
      {
        _id: "orderId1",
        buyer: "507f1f77bcf86cd799439011",
        products: ["productId1", "productId2"],
        status: "Processing",
      },
      {
        _id: "orderId2",
        buyer: "507f1f77bcf86cd799439011",
        products: ["productId3"],
        status: "Shipped",
      },
    ];

    orderModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockOrders),
    });

    await getOrdersController(req, res);

    expect(res.statusCode).toBe(200);
    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    expect(responseData.orders).toHaveLength(2);
    expect(responseData.orders).toEqual(mockOrders);
    expect(responseData.message).toBe("Orders retrieved successfully");
  });

  it("should return 500 if there is a database error", async () => {
    orderModel.find.mockImplementation(() => {
      throw new Error("Database Error");
    });
  
    await getOrdersController(req, res);
  
    expect(res.statusCode).toBe(500);
  
    const responseData = res._getJSONData();
  
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Error while retrieving orders");
    expect(responseData.error).toBeDefined();
  });
  

  it("should return 400 if user ID is missing in the request", async () => {
    req.user = null;

    await getOrdersController(req, res);

    expect(res.statusCode).toBe(400);
    const responseData = res._getJSONData();
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("User authentication required");
  });
});
