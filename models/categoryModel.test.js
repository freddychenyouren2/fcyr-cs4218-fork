import mongoose from 'mongoose';
import CategoryModel from './categoryModel';
import { setupTestDB } from '../testSetup';

setupTestDB();

describe('Category Model Test Suite', () => {
  const validCategory = {
    name: 'Electronics',
    slug: 'electronics',
  };

  it('should create & save category successfully', async () => {
    const category = new CategoryModel(validCategory);
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(validCategory.name);
    expect(savedCategory.slug).toBe(validCategory.slug);
  }, 15000);

  it('should fail to save category without name', async () => {
    const categoryWithoutName = new CategoryModel({
      slug: 'test-category',
    });

    await expect(categoryWithoutName.save()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  }, 15000);

  it('should fail to save category with duplicate name', async () => {
    // First ensure the collection is empty
    await CategoryModel.deleteMany({});

    // Save the first category
    const firstCategory = await new CategoryModel(validCategory).save();
    expect(firstCategory).toBeDefined();

    // Try to save another category with the same name
    const duplicateCategory = new CategoryModel({
      name: validCategory.name,
      slug: 'test-category-2',
    });

    let error;
    try {
      await duplicateCategory.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('MongoServerError');
    expect(error.code).toBe(11000);
    expect(error.message).toContain('duplicate key error');
  }, 15000);

  it('should convert slug to lowercase', async () => {
    const category = new CategoryModel({
      name: 'Test Category New', // Use different name to avoid conflicts
      slug: 'TEST-CATEGORY',
    });

    const savedCategory = await category.save();
    expect(savedCategory.slug).toBe('test-category');
  }, 15000);

  it('should save category without slug', async () => {
    const category = new CategoryModel({
      name: 'Test Category Final', // Use different name to avoid conflicts
    });

    const savedCategory = await category.save();
    expect(savedCategory.name).toBe('Test Category Final');
    expect(savedCategory.slug).toBeUndefined();
  }, 15000);
}, 30000);