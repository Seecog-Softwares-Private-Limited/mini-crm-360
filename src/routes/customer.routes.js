import express from "express";
import multer from "multer";
import { addCustomer, listCustomers, updateCustomer, deleteCustomer, bulkUploadCustomers } from "../controllers/customer.controllers.js";
import { verifyUser } from "../middleware/authMiddleware.js";

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Only accept CSV files
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const customerRouter = express.Router();
customerRouter.post("/", verifyUser, addCustomer);
customerRouter.get("/", verifyUser, listCustomers);
customerRouter.put("/:id", verifyUser, updateCustomer);
customerRouter.delete("/:id", verifyUser, deleteCustomer);
customerRouter.post("/bulk-upload", verifyUser, upload.single('file'), bulkUploadCustomers);
