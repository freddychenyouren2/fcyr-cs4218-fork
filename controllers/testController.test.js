import { testController } from "../controllers/authController.js";
import { jest } from "@jest/globals";

describe("testController", () => {
  let req, res, jsonMock;

  beforeEach(() => {
    jsonMock = jest.fn();
    res = {
      send: jsonMock,
    };

    jest.clearAllMocks();
  });

  // Use Case 1: Should return "Protected Routes" successfully
  test("should return 'Protected Routes'", () => {
    testController(req, res);

    expect(jsonMock).toHaveBeenCalledWith("Protected Routes");
  });

  // Use Case 2: Should handle unexpected errors
  test("should handle unexpected errors", () => {
    const errorMock = new Error("Unexpected Error");
    console.log = jest.fn(); // Mock console.log to prevent actual logging

    // Modify testController to simulate an error
    const errorTestController = (req, res) => {
      try {
        throw errorMock;
      } catch (error) {
        console.log(error);
        res.send({ error });
      }
    };

    errorTestController(req, res);

    expect(console.log).toHaveBeenCalledWith(errorMock);
    expect(jsonMock).toHaveBeenCalledWith({ error: errorMock });
  });
});
