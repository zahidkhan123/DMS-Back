import { Router } from "express";
import { catchAsync } from "../utils/catch-async.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadDocument, getAllDocuments, getDocument, updateDocumentMetadata, removeDocument, shareDocument, getSharedDocument, revokeShare, downloadDocument } from "../controllers/documentController.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createDocumentSchema, updateDocumentSchema } from "../validators/documentValidator.js";

const router = Router();

// Public route for shared documents (must be before authMiddleware and before any :id routes)
router.get("/share/:token", catchAsync(getSharedDocument));

// Protected routes
router.use(authMiddleware);

router.post("/upload", upload.single("file"), validate(createDocumentSchema), catchAsync(uploadDocument));
router.get("/", catchAsync(getAllDocuments));
// Specific routes before generic :id route
router.get("/:id/download", catchAsync(downloadDocument));
router.post("/:id/share", catchAsync(shareDocument));
router.delete("/:id/share", catchAsync(revokeShare));
// Generic :id route must be last
router.get("/:id", catchAsync(getDocument));
router.put("/:id", validate(updateDocumentSchema), catchAsync(updateDocumentMetadata));
router.delete("/:id", catchAsync(removeDocument));

export default router;

