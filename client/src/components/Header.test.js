import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from './Header';
import '@testing-library/jest-dom/extend-expect'; // Import the custom matchers
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import useCategory from '../hooks/useCategory';

jest.mock('react-hot-toast');
jest.mock('../context/auth');
jest.mock('../context/cart');
jest.mock('../hooks/useCategory');
jest.mock('./Form/SearchInput', () => () => <div>SearchInput</div>); // Mock SearchInput component

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([{ _id: '1', name: 'Category 1', slug: 'category-1' }]);
    useCart.mockReturnValue([[{}, {}, {}], jest.fn()]); // Mock cart with 3 items
  });

  it('should render the Header component', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('🛒 Virtual Vault')).toBeInTheDocument(); // Check Virtual Vault text on page
  });

  it('should display respective category in the categories dropdown', async () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(queryByText('Category 1')).toBeInTheDocument();
  });

  it('should display user name and dashboard link when logged in', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Test User')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('should call handleLogout and display toast message on logout', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(getByText('Test User'));
    fireEvent.click(getByText('Logout'));

    expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
  });

  it('should display cart count as 3', () => {
    useAuth.mockReturnValue([{ user: { name: 'Test User', role: 0 }, token: 'test-token' }, jest.fn()]);
    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('3')).toBeInTheDocument(); // Check if the cart count is 3
  });

  it('should display login and register links when user is not logged in', () => {
    // Override the mock for useAuth to return null for the user
    useAuth.mockReturnValue([null, jest.fn()]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Login')).toBeInTheDocument();
    expect(getByText('Register')).toBeInTheDocument();
  });
});