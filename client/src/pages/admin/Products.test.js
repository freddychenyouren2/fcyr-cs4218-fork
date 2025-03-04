import React from "react";
import { render, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Products from "./Products";
import toast from "react-hot-toast";

jest.mock("axios");
jest.mock("react-hot-toast");

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Fetch and display products
  it("should fetch and display products", async () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Sample Product",
        slug: "sample-product",
        description: "This is a sample product description.",
        price: 9.99,
        category: {
          _id: "cat1", // Generalized ID
          name: "Sample Category",
          slug: "sample-category",
          __v: 0
        },
        quantity: 100,
        shipping: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        __v: 0
      },
      {
        _id: "2",
        name: "Sample Product 2",
        slug: "sample-product-2",
        description: "This is a sample product description 2.",
        price: 19.99,
        category: {
          _id: "cat2",
          name: "Sample Category",
          slug: "sample-category",
          __v: 0
        },
        quantity: 50,
        shipping: false,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
        __v: 0
      }
    ];

    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    const { getByText, getAllByRole } = render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

    mockProducts.forEach((product) => {
      expect(getByText(product.name)).toBeInTheDocument();
      expect(getByText(product.description)).toBeInTheDocument();
    });

    // Render product cards
    const productCards = getAllByRole("listitem");
    expect(productCards).toHaveLength(mockProducts.length);

    // Navigation should have correct URL
    const links = getAllByRole("link");
    expect(links).toHaveLength(mockProducts.length);
    links.forEach((link, index) => {
      expect(link).toHaveAttribute("href", `/dashboard/admin/product/${mockProducts[index].slug}`);
    });
  })

  // Error handling (toast error)
  it("should display error when failed fetching products", async () => {
    axios.get.mockRejectedValue(new Error("Failed to fetch products"));

    const { getByText } = render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));
    expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
  });

  // Empty product list
  it("should handle empty product list gracefully", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    const { queryByRole } = render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

    const cards = queryByRole("link");
    expect(cards).toBeNull();
  });
})