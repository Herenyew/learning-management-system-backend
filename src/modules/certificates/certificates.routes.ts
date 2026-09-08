import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { certificatesController } from "./certificates.controller.js";

export const certificatesRouter = Router();

certificatesRouter.use(authenticate);

// Issuing a certificate is a privileged action (HR/Admin per the default profile).
certificatesRouter.post(
  "/issue",
  requirePermission(Permissions.CERTIFICATE_ISSUE),
  (req, res, next) => {
    certificatesController.issue(req, res).catch(next);
  }
);

// Learner-facing: returns only the caller's own certificates (user-scoped).
certificatesRouter.get("/my", (req, res, next) => {
  certificatesController.listOwn(req, res).catch(next);
});

// Expiry sweep affects the whole company — privileged action only.
certificatesRouter.post(
  "/process-expiry",
  requirePermission(Permissions.CERTIFICATE_ISSUE),
  (req, res, next) => {
    certificatesController.processExpiry(req, res).catch(next);
  }
);
