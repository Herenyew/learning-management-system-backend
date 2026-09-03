import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { enrollmentsController } from "./enrollments.controller.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.use(authenticate);

enrollmentsRouter.post("/course", (req, res, next) => {
  enrollmentsController.enrollCourse(req, res).catch(next);
});

enrollmentsRouter.post("/program", (req, res, next) => {
  enrollmentsController.enrollProgram(req, res).catch(next);
});
