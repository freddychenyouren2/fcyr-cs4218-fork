import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

// Mock axios so no real API calls are made
jest.mock("axios");

// Mock toast so we can assert calls without actually showing notifications
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock child components to isolate CreateCategory component
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));
jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="mock-admin-menu"></div>
));

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders and fetches category list on mount", async () => {
    // 1. Mock the response for getAllCategory
    const mockCategories = [
      { _id: "cat1", name: "Electronics" },
      { _id: "cat2", name: "Books" },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // 2. Render the component
    render(<CreateCategory />);

    // 3. Confirm that axios.get was called with the correct endpoint
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");

    // 4. Wait for the categories to be displayed in the table
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  test("creates a new category successfully", async () => {
    // 1. Mock the initial GET for category list
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });

    // 2. Mock a successful POST request
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Category created" },
    });

    render(<CreateCategory />);

    // Wait for header to be visible (ensuring component mounted)
    await screen.findByText("Manage Category");

    // 3. Find the input using its placeholder text
    const input = screen.getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "NewCategory" } });

    // 4. Find and click the submit button within the create form
    // Since the modal is not visible, there's only one "Submit" button.
    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    // 5. Verify that axios.post was called with the correct payload
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/category/create-category",
      { name: "NewCategory" }
    );

    // 6. Confirm that a success toast was triggered
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("NewCategory is created");
    });
  });

  test("handles error on create new category", async () => {
    // Arrange: Mock GET and a failing POST request
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    render(<CreateCategory />);

    // Wait for header to confirm component mount
    await screen.findByText("Manage Category");

    // Find the input and change its value
    const input = screen.getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "FailCategory" } });

    // Instead of getting the form by role (which may not be accessible), click the submit button
    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    // Assert that an error toast is shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somthing went wrong in input form");
    });
  });

  test("updates a category successfully", async () => {
    // Arrange: Mock initial GET to return one category and a successful PUT update
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat1", name: "OldName" }] },
    });
    axios.put.mockResolvedValueOnce({
      data: { success: true, message: "Updated category" },
    });

    render(<CreateCategory />);

    // Wait for the category "OldName" to appear
    await screen.findByText("OldName");

    // Click the Edit button to open the modal (assuming one Edit button exists)
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    // Now the modal is visible and a new CategoryForm is rendered.
    // Get all textboxes; one belongs to the main form and one to the modal.
    const textboxes = screen.getAllByRole("textbox");
    // Find the one with the value "OldName" (modal input)
    const modalInput = textboxes.find((input) => input.value === "OldName");
    expect(modalInput).toBeInTheDocument();

    // Change the modal input value to "NewName"
    fireEvent.change(modalInput, { target: { value: "NewName" } });

    // To submit the update, find the submit button that is inside the modal.
    // We can assume that the modal's submit button is rendered inside an element with class "ant-modal"
    const allSubmitButtons = screen.getAllByRole("button", { name: /submit/i });
    const modalSubmitButton = allSubmitButtons.find((button) =>
      button.closest(".ant-modal")
    );
    expect(modalSubmitButton).toBeInTheDocument();

    // Click the modal's submit button to trigger the update
    fireEvent.click(modalSubmitButton);

    // Verify that axios.put was called with the correct endpoint and payload
    expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/cat1", {
      name: "NewName",
    });

    // Confirm that a success toast was triggered
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("NewName is updated");
    });
  });

  test("deletes a category successfully", async () => {
    // Arrange: Mock GET to return a category and mock DELETE to succeed
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat2", name: "CategoryToDelete" }] },
    });
    axios.delete.mockResolvedValueOnce({
      data: { success: true, message: "category is deleted" },
    });

    render(<CreateCategory />);

    // Wait for the category "CategoryToDelete" to appear
    await screen.findByText("CategoryToDelete");

    // Find and click the Delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    // Verify axios.delete was called with the correct endpoint
    expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/cat2");

    // Confirm a success toast is shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });
});
