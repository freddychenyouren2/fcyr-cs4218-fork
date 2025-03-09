import mongoose from 'mongoose';
import ProductModel from './productModel';
import CategoryModel from './categoryModel';
import { setupTestDB } from './testSetup';

setupTestDB();

describe('Product Model Test Suite', () => {
  let testCategory;
  let validProduct;

  beforeEach(async () => {
    // Create a test category to use in product tests
    const category = new CategoryModel({ name: 'Test Category' });
    testCategory = await category.save();

    validProduct = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      category: testCategory._id,
      quantity: 100,
      shipping: true,
    };
  });

  it('should create & save product successfully', async () => {
    const product = new ProductModel(validProduct);
    const savedProduct = await product.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe(validProduct.name);
    expect(savedProduct.slug).toBe(validProduct.slug);
    expect(savedProduct.description).toBe(validProduct.description);
    expect(savedProduct.price).toBe(validProduct.price);
    expect(savedProduct.category.toString()).toBe(testCategory._id.toString());
    expect(savedProduct.quantity).toBe(validProduct.quantity);
    expect(savedProduct.shipping).toBe(validProduct.shipping);
    expect(savedProduct.createdAt).toBeDefined();
    expect(savedProduct.updatedAt).toBeDefined();
  });

  it('should fail to save product with missing required fields', async () => {
    const productWithMissingFields = new ProductModel({
      name: 'Test Product',
    });

    await expect(productWithMissingFields.save()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('should save product with photo', async () => {
    const productWithPhoto = {
      ...validProduct,
      photo: {
        data: Buffer.from('test image data'),
        contentType: 'image/jpeg',
      },
    };

    const product = new ProductModel(productWithPhoto);
    const savedProduct = await product.save();

    expect(savedProduct.photo.data).toBeDefined();
    expect(savedProduct.photo.contentType).toBe('image/jpeg');
  });

  it('should save product without optional fields', async () => {
    const productWithoutOptional = {
      ...validProduct,
      shipping: undefined,
      photo: undefined,
    };

    const product = new ProductModel(productWithoutOptional);
    const savedProduct = await product.save();

    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.shipping).toBeUndefined();
    expect(savedProduct.photo.data).toBeUndefined();
    expect(savedProduct.photo.contentType).toBeUndefined();
  });

  it('should populate category field', async () => {
    const product = new ProductModel(validProduct);
    await product.save();

    const populatedProduct = await ProductModel.findById(product._id)
      .populate('category')
      .exec();

    expect(populatedProduct.category).toBeDefined();
    expect(populatedProduct.category.name).toBe('Test Category');
  });
});
