import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Op } from "sequelize";
import s3Client, { S3_BUCKET_NAME } from "../config/s3.js";
import Document from "../models/Document.js";
import redis from "../config/redis.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const ALLOWED_FILE_TYPES = ["pdf", "doc", "docx", "txt", "png", "jpg", "jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFile = (file: Express.Multer.File): void => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 10MB limit");
  }

  const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
  if (!fileExtension || !ALLOWED_FILE_TYPES.includes(fileExtension)) {
    throw new Error(`File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`);
  }
};

export const uploadToS3 = async (file: Express.Multer.File, userId: string): Promise<{ key: string; url: string }> => {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured. Please set it in your .env file");
  }

  const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
  const s3Key = `documents/${userId}/${uuidv4()}.${fileExtension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Construct S3 URL - format varies by region
    const region = process.env.AWS_REGION || "us-east-1";
    const url = region === "us-east-1" 
      ? `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`
      : `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

    return { key: s3Key, url };
  } catch (error: any) {
    throw new Error(`Failed to upload file to S3: ${error.message || "Unknown error"}`);
  }
};

export const createDocument = async (
  userId: string,
  name: string,
  s3Key: string,
  s3Url: string,
  fileSize: number,
  fileType: string,
  description?: string,
  category?: string
) => {
  try {
    const document = await Document.create({
      user_id: userId,
      name,
      description,
      category,
      s3_key: s3Key,
      s3_url: s3Url,
      file_size: fileSize,
      file_type: fileType,
    });

    // Cache document in Redis
    try {
      await redis.setex(`document:${document.id}`, 600, JSON.stringify(document.toJSON()));
      
      // Invalidate all document list caches for this user
      const keys = await redis.keys(`documents:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Redis cache failed
    }

    return document;
  } catch (error: any) {
    throw new Error(`Failed to create document: ${error.message || "Unknown error"}`);
  }
};

export const getDocuments = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  category?: string,
  search?: string
) => {
  const offset = (page - 1) * limit;
  const cacheKey = `documents:${userId}:${page}:${limit}:${category || ""}:${search || ""}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    // Redis cache read failed
  }

  const where: any = { user_id: userId };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Document.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  const result = {
    documents: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };

  // Cache result in Redis
  try {
    await redis.setex(cacheKey, 300, JSON.stringify(result));
  } catch (error) {
    // Redis cache write failed
  }

  return result;
};

export const getDocumentById = async (documentId: string, userId: string) => {
  const cacheKey = `document:${documentId}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const document = JSON.parse(cached);
      if (document.user_id === userId) {
        return document;
      }
    }
  } catch (error) {
    // Redis cache read failed
  }

  const document = await Document.findOne({
    where: { id: documentId, user_id: userId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Cache document in Redis
  try {
    await redis.setex(cacheKey, 600, JSON.stringify(document.toJSON()));
  } catch (error) {
    // Redis cache write failed
  }

  return document;
};

export const updateDocument = async (
  documentId: string,
  userId: string,
  updates: { name?: string; description?: string; category?: string }
) => {
  const document = await Document.findOne({
    where: { id: documentId, user_id: userId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await document.update(updates);

  // Invalidate cache
  try {
    await redis.del(`document:${documentId}`);
    const keys = await redis.keys(`documents:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    // Redis cache invalidation failed
  }

  return document;
};

export const deleteDocument = async (documentId: string, userId: string) => {
  const document = await Document.findOne({
    where: { id: documentId, user_id: userId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Delete from S3
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: document.s3_key,
    });
    await s3Client.send(command);
  } catch (error) {
    // S3 delete failed
  }

  // Delete from database
  await document.destroy();

  // Clear Redis cache
  try {
    await redis.del(`document:${documentId}`);
    const keys = await redis.keys(`documents:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    // Redis cache clear failed
  }
};

export const generateShareToken = async (documentId: string, userId: string): Promise<string> => {
  try {
    const document = await Document.findOne({
      where: { id: documentId, user_id: userId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Generate a unique share token
    const shareToken = crypto.randomBytes(32).toString("hex");
    
    await document.update({ share_token: shareToken });

    // Invalidate cache
    try {
      await redis.del(`document:${documentId}`);
    } catch (error) {
      // Redis cache invalidation failed
    }

    return shareToken;
  } catch (error: any) {
    throw new Error(`Failed to generate share token: ${error.message || "Unknown error"}`);
  }
};

export const getDocumentByShareToken = async (shareToken: string) => {
  const document = await Document.findOne({
    where: { share_token: shareToken },
  });

  if (!document) {
    throw new Error("Document not found or share link invalid");
  }

  return document;
};

export const revokeShareToken = async (documentId: string, userId: string) => {
  const document = await Document.findOne({
    where: { id: documentId, user_id: userId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  await document.update({ share_token: undefined as any });

  // Invalidate cache
  try {
    await redis.del(`document:${documentId}`);
  } catch (error) {
    // Redis cache invalidation failed
  }

  return document;
};

export const getDownloadUrl = async (documentId: string, userId: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const document = await Document.findOne({
      where: { id: documentId, user_id: userId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    if (!S3_BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME is not configured");
    }

    if (!document.s3_key) {
      throw new Error("Document S3 key is missing");
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: document.s3_key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error: any) {
    throw new Error(`Failed to generate download URL: ${error.message || "Unknown error"}`);
  }
};

