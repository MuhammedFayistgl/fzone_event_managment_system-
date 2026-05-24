import fs from "fs/promises";
import sharp from "sharp";
import mongoose from "mongoose";
import eventModel from "../models/eventModel.js";
import {
  deleteTicketBgFiles,
  ensureTicketBgDir,
  ticketBgFilePath,
  ticketBgPublicUrl,
} from "../utils/ticketBackground.js";

const TARGET_W = 960;
const TARGET_H = 1680;
const MIN_W = 480;
const MIN_H = 840;
const RATIO = MIN_W / MIN_H;

async function validateImageDimensions(filePath) {
  const meta = await sharp(filePath).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  if (w < MIN_W || h < MIN_H) {
    throw new Error(`Image must be at least ${MIN_W}×${MIN_H}px (recommended ${TARGET_W}×${TARGET_H})`);
  }

  const ratio = w / h;
  if (Math.abs(ratio - RATIO) > 0.02) {
    throw new Error("Image aspect ratio must match ticket template (480:840)");
  }

  return { width: w, height: h };
}

export const uploadTicketBackground = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }

    const event = await eventModel.findById(id);
    if (!event) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await validateImageDimensions(req.file.path);
    await ensureTicketBgDir();
    await deleteTicketBgFiles(id);

    const outPath = ticketBgFilePath(id, "webp");
    await sharp(req.file.path)
      .resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" })
      .webp({ quality: 90 })
      .toFile(outPath);

    await fs.unlink(req.file.path).catch(() => {});

    event.ticketDesign = {
      mode: "custom",
      backgroundUrl: ticketBgPublicUrl(id, "webp"),
      textTheme: req.body?.textTheme === "light" ? "light" : "dark",
      uploadedAt: new Date(),
      originalFileName: req.file.originalname,
    };

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Ticket background uploaded",
      data: event.ticketDesign,
    });
  } catch (err) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error("UPLOAD TICKET BG ERROR:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};

export const deleteTicketBackground = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await deleteTicketBgFiles(id);

    event.ticketDesign = {
      mode: "default",
      backgroundUrl: null,
      textTheme: "dark",
      uploadedAt: null,
      originalFileName: null,
    };

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Ticket background removed",
      data: event.ticketDesign,
    });
  } catch (err) {
    console.error("DELETE TICKET BG ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateTicketDesignMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, textTheme } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (mode === "custom" && !event.ticketDesign?.backgroundUrl) {
      return res.status(400).json({
        success: false,
        message: "Upload a background before enabling custom mode",
      });
    }

    if (mode === "default" || mode === "custom") {
      event.ticketDesign = event.ticketDesign || {};
      event.ticketDesign.mode = mode;
    }

    if (textTheme === "light" || textTheme === "dark") {
      event.ticketDesign.textTheme = textTheme;
    }

    await event.save();

    return res.status(200).json({
      success: true,
      data: event.ticketDesign,
    });
  } catch (err) {
    console.error("UPDATE TICKET MODE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
