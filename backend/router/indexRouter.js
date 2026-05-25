import express from "express";
const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "F-Zone Event Management API",
    health: "/health",
  });
});

export default router;
