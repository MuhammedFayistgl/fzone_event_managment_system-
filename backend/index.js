import * as dotenv from "dotenv";
dotenv.config();

import express from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import indexRouter from './router/indexRouter.js';
import adminRouter from './router/adminRouter.js';
import userRouter from './router/userRouter.js';
import { ConnectionDB } from './server/server.js';
import cors from "cors";
import { startPaymentCleanupJob } from "./utils/crone.js";

const app = express();

// ================= MIDDLEWARE =================
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({
  credentials: true,
  origin: ["http://localhost:5173", "http://localhost:5174","http://192.168.1.73:5173"]
}));

// ================= ROUTES =================
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);

// ================= SERVER START =================
ConnectionDB().then(() => {

  console.log("DB connected ✅");

  // 🔥 START CRON AFTER DB CONNECT
  startPaymentCleanupJob();

  app.listen(process.env.PORT || 8000,"0.0.0.0", () => {
    console.log(`Node server running on port ${process.env.PORT || 8000}`);
  });

}).catch((err) => {
  console.error("DB connection failed ❌", err);
});