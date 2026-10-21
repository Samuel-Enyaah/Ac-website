import express from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  listStaff,
  getStaff,
  saveStaff,
} from "../controllers/adminStaffController.js";
const router = express.Router();
router.use(requireAdmin);
const writes = rateLimit({
  windowMs: 60000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
router.get("/", listStaff);
router.get("/:staffId", getStaff);
router.post("/", writes, saveStaff);
router.patch("/:staffId", writes, saveStaff);
export default router;
