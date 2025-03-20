import mongoose from 'mongoose';
import UserModel from './userModel';
import { setupTestDB } from '../testSetup';

setupTestDB();

describe('User Model Test Suite', () => {
  const validUser = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'password123',
    phone: '1234567890',
    address: {
      street: '123 Main St',
      city: 'Test City',
      country: 'Test Country',
    },
    answer: 'blue',
    role: 0,
  };

  it('should create & save user successfully', async () => {
    const user = new UserModel(validUser);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUser.name);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.password).toBe(validUser.password);
    expect(savedUser.phone).toBe(validUser.phone);
    expect(savedUser.address).toEqual(validUser.address);
    expect(savedUser.answer).toBe(validUser.answer);
    expect(savedUser.role).toBe(validUser.role);
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  }, 15000);

  it('should fail to save user with missing required fields', async () => {
    const userWithMissingFields = new UserModel({
      name: 'John Doe',
    });

    await expect(userWithMissingFields.save()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  }, 15000);

  it('should fail to save user with duplicate email', async () => {
    // First ensure the collection is empty
    await UserModel.deleteMany({});

    // Save the first user
    const firstUser = await new UserModel(validUser).save();
    expect(firstUser).toBeDefined();

    // Try to save another user with the same email
    const duplicateUser = new UserModel({
      ...validUser,
      name: 'Jane Doe', // Different name but same email
    });

    let error;
    try {
      await duplicateUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('MongoServerError');
    expect(error.code).toBe(11000);
    expect(error.message).toContain('duplicate key error');
  }, 15000);

  it('should save user with default role value', async () => {
    const userWithoutRole = {
      ...validUser,
      email: 'different@example.com', // Use different email to avoid conflicts
      role: undefined,
    };

    const user = new UserModel(userWithoutRole);
    const savedUser = await user.save();

    expect(savedUser.role).toBe(0);
  }, 15000);

  it('should trim whitespace from name field', async () => {
    const userWithWhitespace = {
      ...validUser,
      email: 'whitespace@example.com', // Use different email to avoid conflicts
      name: '  John Doe  ',
    };

    const user = new UserModel(userWithWhitespace);
    const savedUser = await user.save();

    expect(savedUser.name).toBe('John Doe');
  }, 15000);

  it('should include timestamps in the document', async () => {
    const user = new UserModel({
      ...validUser,
      email: 'timestamps@example.com', // Use different email to avoid conflicts
    });
    const savedUser = await user.save();

    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  }, 15000);
}, 30000);