import { jest } from "@jest/globals";
import { TextEncoder, TextDecoder } from "util";

// Mock `TextEncoder` and `TextDecoder` globally
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Use unstable_mockModule in an async top-level context
jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(() => "mock-token"),
    verify: jest.fn((token, secret) => ({ _id: "someUserId" })),
  }));
  