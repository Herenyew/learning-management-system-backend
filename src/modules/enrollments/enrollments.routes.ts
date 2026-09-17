import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { enrollmentsController } from "./enrollments.controller.js";

export const enrollmentsRouter = Router();
export const learningSessionsRouter = Router();

enrollmentsRouter.use(authenticate);
learningSessionsRouter.use(authenticate);

enrollmentsRouter.get("/my", (req, res, next) => {
  enrollmentsController.listMine(req, res).catch(next);
});

enrollmentsRouter.get("/my/programs", (req, res, next) => {
  enrollmentsController.listMyPrograms(req, res).catch(next);
});

enrollmentsRouter.get("/:enrollmentId/progress", (req, res, next) => {
  enrollmentsController.getProgress(req, res).catch(next);
});

enrollmentsRouter.put("/:enrollmentId/progress/content/:contentId", (req, res, next) => {
  enrollmentsController.updateContentProgress(req, res).catch(next);
});

enrollmentsRouter.post("/:enrollmentId/sessions", (req, res, next) => {
  enrollmentsController.startSession(req, res).catch(next);
});

learningSessionsRouter.patch("/:sessionId", (req, res, next) => {
  enrollmentsController.endSession(req, res).catch(next);
});

enrollmentsRouter.post("/course", (req, res, next) => {
  enrollmentsController.enrollCourse(req, res).catch(next);
});

enrollmentsRouter.post("/program", (req, res, next) => {
  enrollmentsController.enrollProgram(req, res).catch(next);
});

enrollmentsRouter.post("/program/:enrollmentId/evaluate", (req, res, next) => {
  enrollmentsController.reevaluateProgram(req, res).catch(next);
});

// Compatibility endpoint: performs a server-side re-evaluation only.
// Client-provided scores, pass flags, and certificate templates are rejected.
enrollmentsRouter.post("/course/:enrollmentId/complete", (req, res, next) => {
  enrollmentsController.completeCourse(req, res).catch(next);
});
