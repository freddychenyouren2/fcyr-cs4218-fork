import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from './models/userModel';
import CategoryModel from './models/categoryModel';

let mongoServer;

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.disconnect(); // Ensure no existing connections
    await mongoose.connect(mongoUri);

    // Drop existing collections and indexes
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
      await collection.dropIndexes().catch(() => {});
    }

    // Create indexes and wait for them to be ready
    await UserModel.createCollection();
    await CategoryModel.createCollection();
    await UserModel.syncIndexes();
    await CategoryModel.syncIndexes();
  }, 30000);

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.dropIndexes().catch(() => {});
      }
      await mongoose.disconnect();
    }
    await mongoServer.stop();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure cleanup
  }, 30000);
};
