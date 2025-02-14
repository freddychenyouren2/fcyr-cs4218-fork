import jwt from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware";
import userModel from "../models/userModel";
// Mock jsonwebtoken and userModel to isolate middleware logic

// Mock userModel
jest.mock("../models/userModel");

// Mock request, response, and next
const mockRequest = (headers = {}, body = {}, params = {}) => ({
    headers,
    body,
    params,
    user: {}, // Add user object for isAdmin middleware
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = jest.fn();

describe("requireSignIn Middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should call next() if token is valid", async () => {
        const req = mockRequest({
            authorization: "valid_token",
        });
        const res = mockResponse();
        const next = mockNext;

        // Mock JWT verify to return a decoded token
        jwt.verify = jest.fn().mockReturnValue({ _id: "user_id" });

        await requireSignIn(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("valid_token", process.env.JWT_SECRET);
        expect(req.user).toEqual({ _id: "user_id" });
        expect(next).toHaveBeenCalled();
    });

    it("should handle invalid token", async () => {
        const req = mockRequest({
            authorization: "invalid_token",
        });
        const res = mockResponse();
        const next = mockNext;

        // Mock JWT verify to throw an error
        jwt.verify = jest.fn().mockImplementation(() => {
            throw new Error("Invalid token");
        });

        await requireSignIn(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("invalid_token", process.env.JWT_SECRET);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401); // Ensure error handling is proper
        // Original Code does not give 401 response. Have to modify.
    });
});
