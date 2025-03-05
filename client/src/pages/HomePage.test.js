import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import HomePage from './HomePage';
import { toBeInTheDocument } from '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display categories', async () => {
    // Mock category API call
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [
          { _id: '1', name: 'Category 1' },
          { _id: '2', name: 'Category 2' },
        ],
      },
    });
    // Mock product count API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 2 },
    });
    // Mock initial products API call
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Category 1 Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Category 1')).toBeInTheDocument();
      expect(getByText('Category 2')).toBeInTheDocument();
    });
  });

  it('should fetch and display products', async () => {
    // Mock category API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Category 1' }] },
    });
    // Mock product count API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    // Mock initial products API call
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Test Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should fetch and set total product count', async () => {
    // Mock category API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    // Mock product count API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 10 },
    });
    // Mock initial products API call
    axios.get.mockResolvedValueOnce({
      data: { products: [] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-count');
    });
  });

  it('should load more products', async () => {
    // Mock category API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    // Mock product count API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 4 },
    });
    // Mock initial products API call
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Initial Product',
            price: 100,
            description: 'Description 1',
            slug: 'product-1',
          },
        ],
      },
    });
    // Mock load more products API call
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '2',
            name: 'Loaded Product',
            price: 200,
            description: 'Description 2',
            slug: 'product-2',
          },
        ],
      },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Initial Product')).toBeInTheDocument();
    });

    fireEvent.click(getByText('Loadmore'));

    await waitFor(() => {
      expect(getByText('Loaded Product')).toBeInTheDocument();
    });
  });

  it('should filter products by category', async () => {
    // Mock category API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: '1', name: 'Test Category' }] },
    });
    // Mock product count API call
    axios.get.mockResolvedValueOnce({
      data: { success: true, total: 1 },
    });
    // Mock initial products API call
    axios.get.mockResolvedValueOnce({
      data: { products: [] },
    });
    // Mock filtered products API call
    axios.post.mockResolvedValueOnce({
      data: {
        products: [
          {
            _id: '1',
            name: 'Filtered Product',
            price: 100,
            description: 'Description 1',
            slug: 'filtered-product',
          },
        ],
      },
    });

    const { getByText, getByLabelText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Test Category')).toBeInTheDocument();
    });

    fireEvent.click(getByLabelText('Test Category'));

    await waitFor(() => {
      expect(getByText('Filtered Product')).toBeInTheDocument();
    });
  });
});
