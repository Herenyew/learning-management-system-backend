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

// Mark a course enrollment as complete and automatically:
//   - create a CourseCompletion record
//   - issue a certificate if certificateTemplateId is provided
//   - auto-complete any related program enrollments where all courses are done
enrollmentsRouter.post("/course/:enrollmentId/complete", (req, res, next) => {
  enrollmentsController.completeCourse(req, res).catch(next);
});
