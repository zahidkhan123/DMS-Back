import bcrypt from "bcrypt";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import redis from "../config/redis.js";

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: string = "user",
  user_type: string = "user"
) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password_hash,
    name,
    role,
    user_type,
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Use user_type if available, otherwise use role
  const userType = user.user_type || user.role;
  
  const token = generateToken(
    { id: user.id, role: user.role, user_type: userType },
    process.env.JWT_EXPIRES_IN || "7d"
  );

  // Store session in Redis
  try {
    await redis.setex(`session:${user.id}`, 7 * 24 * 60 * 60, token);
  } catch (error) {
    // Redis session storage failed
  }

  return { user, token };
};

