import fs from "node:fs/promises";
import path from "node:path";

import { Router, type Request, type Response } from "express";
import multer from "multer";

import { FindParcelService } from "../services/FindParcelService";
const uploadsDir = "/shared/uploads";
const upload = multer({ storage: multer.memoryStorage() });

const sanitizeFilename = (name: string): string => {
  const baseName = path.basename(name);
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

export const buildLoadParcelRouter = (): Router => {
  const router = Router();

  router.post("/loadParcel/upload", (req: Request, res: Response): void => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error("Upload handler failed", err);
        res.status(400).json({ error: "Unable to process the upload." });
        return;
      }

      const file = req.file;
      if (!file || file.size === 0) {
        res.status(400).json({ error: "A file is required." });
        return;
      }

      try {
        await fs.mkdir(uploadsDir, { recursive: true });

        const safeName = sanitizeFilename(file.originalname || "upload.bin");
        const filename = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.writeFile(filePath, file.buffer);

        res.status(200).json({ ok: true, filename });
      } catch (error) {
        console.error("Upload handler failed", error);
        res.status(500).json({ error: "Unable to save the upload." });
      }
    });
  });

  router.get(
    "/loadParcel/uploads/:filename",
    async (req: Request, res: Response): Promise<void> => {
      const rawName = Array.isArray(req.params.filename)
        ? req.params.filename[0] ?? ""
        : req.params.filename ?? "";
      const safeName = sanitizeFilename(rawName);

      if (!safeName || safeName !== rawName) {
        res.status(400).json({ error: "Invalid filename." });
        return;
      }

      try {
        const filePath = path.join(uploadsDir, safeName);
        await fs.stat(filePath);
        res.sendFile(safeName, { root: uploadsDir });
      } catch (error) {
        res.status(404).json({ error: "File not found." });
      }
    }
  );

  router.post(
    "/loadParcel/process",
    async (req: Request, res: Response): Promise<void> => {
      const { filename, x, y } = req.body ?? {};

      if (typeof filename !== "string" || !Number.isFinite(x) || !Number.isFinite(y)) {
        res.status(400).json({ error: "Invalid payload." });
        return;
      }

      const safeName = sanitizeFilename(filename);
      if (!safeName || safeName !== filename) {
        res.status(400).json({ error: "Invalid filename." });
        return;
      }

      try {
        const result = await FindParcelService.highlightParcel(safeName, x, y);
        const outputUrl = `/api/backapi/loadParcel/uploads/${encodeURIComponent(
          result.outputFilename
        )}`;
        res.status(200).json({ ...result, outputUrl });
      } catch (error) {
        console.error("Confirm handler failed", error);
        res.status(500).json({ error: "Unable to run parcel highlight." });
      }
    }
  );

  return router;
};
