import jwt from "jsonwebtoken";
import { IUser } from "../types/user.types.js";

const JWT_SECRET = process.env.JWT_SECRET || "zor-secret-key";

interface TokenPayload {
  id: string;
  user_type: string;
  iat: number;
  exp: number;
}

interface TokenUser {
  id: string;
  role: string;
  user_type?: string;
}

export const generateToken = (user: IUser | TokenUser, expiresIn: string): string => {
  // Use user_type if available, otherwise fall back to role
  // This ensures admin users are properly identified
  const userType = user.user_type || user.role;
  const token = jwt.sign(
    { id: user.id, role: user.role, user_type: userType },
    JWT_SECRET as unknown as jwt.Secret, 
    { expiresIn: expiresIn as unknown as string } as jwt.SignOptions
  ) as string;
  return token;
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  return decoded;
};

