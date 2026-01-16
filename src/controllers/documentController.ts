import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { useSuccessResponse, useErrorResponse } from "../utils/apiResponse.js";
import {
  validateFile,
  uploadToS3,
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  generateShareToken,
  getDocumentByShareToken,
  revokeShareToken,
  getDownloadUrl,
} from "../services/documentService.js";
import { emitDocumentUploaded, emitDocumentUpdated, emitDocumentDeleted, emitNotification } from "../services/socketService.js";
import { createNotification } from "../services/notificationService.js";

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const file = req.file;
  if (!file) {
    useErrorResponse(res, "No file provided", 400);
    return;
  }

  validateFile(file);

  const { name, description, category } = req.body;

  if (!name) {
    useErrorResponse(res, "Document name is required", 400);
    return;
  }

  const { key, url } = await uploadToS3(file, req.user.id);
  const document = await createDocument(
    req.user.id,
    name,
    key,
    url,
    file.size,
    file.mimetype,
    description,
    category
  );

  // Create notification
  const notification = await createNotification(
    req.user.id,
    "document_uploaded",
    "Document Uploaded",
    `Your document "${name}" has been successfully uploaded.`
  );

  // Emit socket events
  await emitDocumentUploaded(document.toJSON(), req.user.id);
  await emitNotification(notification.toJSON(), req.user.id);
  
  useSuccessResponse(res, "Document uploaded successfully", { document }, 201);
};

export const getAllDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const category = req.query.category as string;
  const search = req.query.search as string;

  const result = await getDocuments(req.user.id, page, limit, category, search);
  useSuccessResponse(res, "Documents retrieved successfully", result, 200);
};

export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const { id } = req.params;
  const document = await getDocumentById(id, req.user.id);
  useSuccessResponse(res, "Document retrieved successfully", { document }, 200);
};

export const updateDocumentMetadata = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const { id } = req.params;
  const { name, description, category } = req.body;

  const updates: any = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;

  const document = await updateDocument(id, req.user.id, updates);
  
  // Create notification
  const notification = await createNotification(
    req.user.id,
    "document_updated",
    "Document Updated",
    `Your document "${document.name}" has been updated.`
  );

  // Emit socket events
  await emitDocumentUpdated(document.toJSON(), req.user.id);
  await emitNotification(notification.toJSON(), req.user.id);
  
  useSuccessResponse(res, "Document updated successfully", { document }, 200);
};

export const removeDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const { id } = req.params;
  
  // Get document name before deletion for notification
  let documentName = "Document";
  try {
    const document = await getDocumentById(id, req.user.id);
    documentName = document.name;
  } catch (error) {
    // Document might not exist, use default name
  }
  
  await deleteDocument(id, req.user.id);
  
  // Create notification
  const notification = await createNotification(
    req.user.id,
    "document_deleted",
    "Document Deleted",
    `Your document "${documentName}" has been deleted.`
  );

  // Emit socket events
  await emitDocumentDeleted(id, req.user.id);
  await emitNotification(notification.toJSON(), req.user.id);
  
  useSuccessResponse(res, "Document deleted successfully", {}, 200);
};

export const shareDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  try {
    const { id } = req.params;
    const shareToken = await generateShareToken(id, req.user.id);
    const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";
    const shareUrl = `${frontendUrl}/share/${shareToken}`;

    useSuccessResponse(res, "Share link generated successfully", { shareToken, shareUrl }, 200);
  } catch (error: any) {
    useErrorResponse(res, error.message || "Failed to generate share link", 500);
  }
};

export const getSharedDocument = async (req: any, res: Response): Promise<void> => {
  const { token } = req.params;
  const document = await getDocumentByShareToken(token);
  useSuccessResponse(res, "Shared document retrieved successfully", { document }, 200);
};

export const revokeShare = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const { id } = req.params;
  await revokeShareToken(id, req.user.id);
  useSuccessResponse(res, "Share link revoked successfully", {}, 200);
};

export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  try {
    const { id } = req.params;
    const downloadUrl = await getDownloadUrl(id, req.user.id);
    useSuccessResponse(res, "Download URL generated successfully", { downloadUrl }, 200);
  } catch (error: any) {
    useErrorResponse(res, error.message || "Failed to generate download URL", 500);
  }
};

