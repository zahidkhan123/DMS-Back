import Category from "../models/Category.js";
import redis from "../config/redis.js";

const CACHE_KEY = "categories:all";
const CACHE_TTL = 3600; // 1 hour

export const getAllCategories = async () => {
  // Try Redis cache first
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    // Redis cache read failed
  }

  // Fetch from database
  const categories = await Category.findAll({
    order: [["name", "ASC"]],
    attributes: ["id", "name", "color"],
  });

  const result = { categories };

  // Cache the result
  try {
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
  } catch (error) {
    // Redis cache write failed
  }

  return result;
};

export const createCategory = async (name: string, color: string = "#6366f1") => {
  // Check if category already exists
  const existing = await Category.findOne({ where: { name } });
  if (existing) {
    throw new Error("Category with this name already exists");
  }

  const category = await Category.create({
    name,
    color,
  });

  // Invalidate cache
  try {
    await redis.del(CACHE_KEY);
  } catch (error) {
    // Redis cache invalidation failed
  }

  return category;
};

export const invalidateCategoriesCache = async () => {
  try {
    await redis.del(CACHE_KEY);
  } catch (error) {
    // Redis cache invalidation failed
  }
};

