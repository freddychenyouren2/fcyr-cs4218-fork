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

describe("isAdmin Middleware", () => {
    let req, res, next;
    beforeEach(() => {
        jest.clearAllMocks();
        req = mockRequest();
        res = mockResponse();
        next = mockNext;
    });

    it("should call next() if user is admin", async () => {
        // Mock userModel to return a user with role 1 (Admin)
        req.user = { _id: "admin_user_id" };
        userModel.findById = jest.fn().mockReturnValue({ role: 1 });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
        expect(next).toHaveBeenCalled();
    })

    it("should return 401 if user is not admin", async () => {
        req.user = { _id: "non_admin_user_id" };

        // Mock userModel to return a user with role 0 (User)
        userModel.findById = jest.fn().mockReturnValue({ role: 0 });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "UnAuthorized Access",
        });
    })

    it("should handle errors in isAdmin Middleware", async () => {
        req.user = { _id: "admin_user_id" };
        
        // Mock userModel.findById to throw an error
        userModel.findById = jest.fn().mockImplementation(() => {
            throw new Error("Error in isAdmin middleware");
        });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith("admin_user_id");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: expect.any(Error),
            message: "Error in admin middleware",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
