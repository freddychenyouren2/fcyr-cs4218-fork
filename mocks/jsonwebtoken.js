const jwtMock = {
    sign: jest.fn(() => "mock-token"),  // Ensure `sign` is always mocked
    verify: jest.fn((token, secret) => ({ _id: "someUserId" })),
};

export default jwtMock;
  