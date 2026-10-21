import { z } from "zod";
import Staff, { staffRoles } from "../models/Staff.js";
import { validId } from "../services/operations.js";
import {
  operationEvent,
  operationalError,
} from "../services/operationEvents.js";
import {
  flushOperations,
  operationHistory,
} from "../services/operationsOutbox.js";

const staffSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).default(""),
    email: z.union([z.email(), z.literal("")]).default(""),
    role: z.enum(staffRoles),
    active: z.boolean().default(true),
    skills: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
    notes: z.string().trim().max(2000).default(""),
  })
  .strict();
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listStaff(req, res, next) {
  try {
    const query = {};
    if (["true", "false"].includes(req.query.active))
      query.active = req.query.active === "true";
    if (staffRoles.includes(req.query.role)) query.role = req.query.role;
    if (req.query.skill)
      query.skills = new RegExp(
        escape(String(req.query.skill).slice(0, 80)),
        "i",
      );
    if (req.query.search) {
      const pattern = new RegExp(
        escape(String(req.query.search).slice(0, 120)),
        "i",
      );
      query.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25),
    );
    const [staff, total] = await Promise.all([
      Staff.find(query)
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Staff.countDocuments(query),
    ]);
    res.json({
      success: true,
      staff,
      pagination: {
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        total,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function getStaff(req, res, next) {
  try {
    validId(req.params.staffId);
    const staff = await Staff.findById(req.params.staffId).lean();
    if (!staff) throw operationalError("Staff member not found.", 404);
    res.json({
      success: true,
      staff,
      ...(await operationHistory("staff", staff._id)),
    });
  } catch (error) {
    next(error);
  }
}
export async function saveStaff(req, res, next) {
  try {
    const creating = !req.params.staffId;
    if (!creating) validId(req.params.staffId);
    const parsed = (creating ? staffSchema : staffSchema.partial()).safeParse(
      req.body,
    );
    // Zod defaults also apply inside optional fields. PATCH must only change
    // explicitly supplied fields, otherwise a contact edit could reactivate staff.
    if (parsed.success && !creating)
      parsed.data = Object.fromEntries(
        Object.entries(parsed.data).filter(([key]) =>
          Object.hasOwn(req.body, key),
        ),
      );
    if (!parsed.success || !Object.keys(parsed.data).length)
      throw operationalError(
        "Check the staff name, role, contact details and skills. Login credentials are not accepted here.",
        400,
      );
    let staff;
    if (creating) {
      const event = operationEvent(
        "created",
        "Staff assignment record created.",
        { admin: req.admin, metadata: { fields: Object.keys(parsed.data) } },
      );
      staff = await Staff.create({ ...parsed.data, eventOutbox: [event] });
    } else {
      for (let n = 0; n < 5; n++) {
        const current = await Staff.findById(req.params.staffId);
        if (!current) throw operationalError("Staff member not found.", 404);
        const fields = Object.keys(parsed.data).filter(
          (k) => JSON.stringify(current[k]) !== JSON.stringify(parsed.data[k]),
        );
        if (!fields.length) {
          staff = current;
          break;
        }
        const action = fields.includes("active")
          ? parsed.data.active
            ? "activated"
            : "deactivated"
          : "updated";
        const event = operationEvent(
          action,
          `Staff assignment record ${action}.`,
          { admin: req.admin, metadata: { fields } },
        );
        staff = await Staff.findOneAndUpdate(
          { _id: current._id, __v: current.__v },
          {
            $set: parsed.data,
            $inc: { __v: 1 },
            $push: { eventOutbox: event },
          },
          { returnDocument: "after", runValidators: true },
        );
        if (staff) break;
      }
    }
    if (!staff)
      throw operationalError("Staff record changed. Refresh and try again.");
    await flushOperations("staff", staff._id);
    const safe = staff.toObject();
    delete safe.eventOutbox;
    delete safe.assignmentVersion;
    res.status(creating ? 201 : 200).json({ success: true, staff: safe });
  } catch (error) {
    next(error);
  }
}
