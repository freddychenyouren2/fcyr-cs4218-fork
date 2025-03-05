import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import dotenv from "dotenv";

dotenv.config()

jest.setTimeout(30000);

describe("Category Model", () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  test("should require a name field", async () => {
    const category = new Category({ slug: "test-category" });

    await expect(category.save()).rejects.toThrow(
      /Category validation failed: name: Path `name` is required/
    );
  });

  test("should enforce uniqueness of name", async () => {
    const category1 = new Category({ name: "Electronics", slug: "electronics" });
    await category1.save();

    const category2 = new Category({ name: "Electronics", slug: "electronics-2" });

    await expect(category2.save()).rejects.toThrow(/duplicate key error/);
  });

  test("should automatically lowercase slug", async () => {
    const category = new Category({ name: "Sports", slug: "SPORTS-SLUG" });
    await category.save();

    const foundCategory = await Category.findOne({ name: "Sports" });
    expect(foundCategory.slug).toBe("sports-slug");
  });

  test("should allow creating a valid category", async () => {
    const category = new Category({ name: "Books", slug: "books" });
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe("Books");
    expect(savedCategory.slug).toBe("books");
  });

  test("should prevent saving if slug is missing", async () => {
    const category = new Category({ name: "Missing Slug" });
    let err;
    try {
      await category.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.slug).toBeDefined();
  });
});
