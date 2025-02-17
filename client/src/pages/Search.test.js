import React from "react";
import { render, screen } from "@testing-library/react";
import { useSearch } from "../context/search";
import Search from "../pages/Search";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";

// Mock useSearch Hook
jest.mock("../context/search", () => ({
    useSearch: jest.fn(),
}));

jest.mock("react-hot-toast");

jest.mock("../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));


const mockSearchContext = (values) => {
    useSearch.mockReturnValue([values, jest.fn()]);
};

describe("Search Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
      });

    test("renders without crashing", () => {
        mockSearchContext({ results: [] });
        render(<MemoryRouter initialEntries={["/search"]}>
            <Routes>
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>);
        expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    });

    test("displays 'No Products Found' when results are empty", () => {
        mockSearchContext({ results: [] });
        render(<MemoryRouter initialEntries={["/search"]}>
            <Routes>
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>);
        expect(screen.getByText(/No Products Found/i)).toBeInTheDocument();
    });

    test("displays correct number of search results", () => {
        const mockProducts = [
            { _id: "1", name: "Product A", description: "Short description", price: 20 },
            { _id: "2", name: "Product B", description: "Another description", price: 30 },
        ];
        mockSearchContext({ results: mockProducts });
        render(<MemoryRouter initialEntries={["/search"]}>
            <Routes>
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>);
        expect(screen.getByText(/Found 2/i)).toBeInTheDocument();
    });

    test("renders product details correctly", () => {
        const mockProducts = [
            { _id: "1", name: "Product A", description: "Short description", price: 20 },
            { _id: "2", name: "Product B", description: "Another description", price: 30 },
        ];
        mockSearchContext({ results: mockProducts });

        render(<MemoryRouter initialEntries={["/search"]}>
            <Routes>
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>);

        // Check product names
        expect(screen.getByText("Product A")).toBeInTheDocument();
        expect(screen.getByText("Product B")).toBeInTheDocument();

        // Check truncated description
        expect(screen.getByText("Short description")).toBeInTheDocument();
        expect(screen.getByText("Another description")).toBeInTheDocument();

        // Check price display
        expect(screen.getByText("$ 20")).toBeInTheDocument();
        expect(screen.getByText("$ 30")).toBeInTheDocument();
    });

    test("renders product images with correct alt text", () => {
        const mockProducts = [{ _id: "1", name: "Product A", description: "Desc", price: 20 }];
        mockSearchContext({ results: mockProducts });

        render(<MemoryRouter initialEntries={["/search"]}>
            <Routes>
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>);

        const image = screen.getByAltText("Product A");
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/1");
    });

    test("renders 'More Details' and 'Add to Cart' buttons", () => {
        const mockProducts = [{ _id: "1", name: "Product A", description: "Desc", price: 20 }];
        mockSearchContext({ results: mockProducts });

        render(<MemoryRouter initialEntries={["/search"]}>
            <Routes>
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>);

        expect(screen.getByText(/More Details/i)).toBeInTheDocument();
        expect(screen.getByText(/ADD TO CART/i)).toBeInTheDocument();
    });
});
