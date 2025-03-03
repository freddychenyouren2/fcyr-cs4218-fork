import React from "react";
import "@testing-library/jest-dom";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useAuth } from "../../context/auth";
import AdminDashboard from "./AdminDashboard";

// Mock Layout & AdminMenu to avoid unnecessary rendering issues
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu"></div>);

// ✅ Mock useAuth() to provide test authentication data
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn()
}));

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    // ✅ Mock auth data returned by useAuth()
    useAuth.mockReturnValue([
      { 
        user: { 
          name: "CS 4218 Test Account", 
          email: "cs4218@test.com", 
          phone: "81234567" 
        }, 
        token: "mock-token" 
      },
      jest.fn() // Mock setAuth function
    ]);
  });

  it("renders the admin's details correctly", async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });

    // Debugging: Check rendered output
    screen.debug();

    // ✅ Wait for UI update
    await waitFor(() => {
      expect(screen.getByText(/Admin Name : CS 4218 Test Account/i)).toBeInTheDocument();
      expect(screen.getByText(/Admin Email : cs4218@test.com/i)).toBeInTheDocument();
      expect(screen.getByText(/Admin Contact : 81234567/i)).toBeInTheDocument();
    });
  });
});
