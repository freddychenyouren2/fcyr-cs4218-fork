import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CategoryModel from './categoryModel';

let mongoServer;

// Connect to the in-memory database before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and close the server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Category Model Test Suite', () => {
  it('should create & save category successfully', async () => {
    const validCategory = {
      name: 'Electronics',
      slug: 'electronics',
    };

    const category = new CategoryModel(validCategory);
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(validCategory.name);
    expect(savedCategory.slug).toBe(validCategory.slug);
  });

  it('should convert slug to lowercase', async () => {
    const category = new CategoryModel({
      name: 'Test Category',
      slug: 'TEST-CATEGORY',
    });

    const savedCategory = await category.save();
    expect(savedCategory.slug).toBe('test-category');
  });

  it('should save category without slug', async () => {
    const category = new CategoryModel({
      name: 'Test Category',
    });

    const savedCategory = await category.save();
    expect(savedCategory.name).toBe('Test Category');
    expect(savedCategory.slug).toBeUndefined();
  });
});
