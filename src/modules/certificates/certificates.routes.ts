import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { certificatesController } from "./certificates.controller.js";

export const certificatesRouter = Router();

certificatesRouter.use(authenticate);

certificatesRouter.post("/issue", (req, res, next) => {
  certificatesController.issue(req, res).catch(next);
});

certificatesRouter.get("/my", (req, res, next) => {
  certificatesController.listOwn(req, res).catch(next);
});

certificatesRouter.post("/process-expiry", (req, res, next) => {
  certificatesController.processExpiry(req, res).catch(next);
});
