import { Router } from "express";
import { TnaConfigurationController } from "./tna-configuration.controller.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../common/middlewares/validation.middleware.js";
import {
  CreateTnaRequestTypeSchema,
  UpdateTnaRequestTypeSchema,
  TnaRequestTypeFilterSchema,
  CreateFundingTypeSchema,
  UpdateFundingTypeSchema,
  FundingTypeFilterSchema,
  CreateTrainingFormatSchema,
  UpdateTrainingFormatSchema,
  TrainingFormatFilterSchema,
  idParamSchema,
} from "./tna-configuration.dto.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

export function TnaConfigurationRouter(
  controller: TnaConfigurationController
): Router {
  const router = Router();

  // Protect all routes with authentication
  router.use(authenticate);

  // ──────────────────────────────────────────────────────────────
  // 1. TNA Request Type Config Routes
  // ──────────────────────────────────────────────────────────────

  router.post(
    "/request-types",
    requirePermission(Permissions.TNA_REQUEST_TYPE_CREATE),
    validateBody(CreateTnaRequestTypeSchema),
    controller.createRequestType.bind(controller)
  );

  router.get(
    "/request-types",
    requirePermission(Permissions.TNA_REQUEST_TYPE_VIEW),
    validateQuery(TnaRequestTypeFilterSchema),
    controller.listRequestTypes.bind(controller)
  );

  router.get(
    "/request-types/:id",
    requirePermission(Permissions.TNA_REQUEST_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getRequestTypeById.bind(controller)
  );

  router.patch(
    "/request-types/:id",
    requirePermission(Permissions.TNA_REQUEST_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateTnaRequestTypeSchema),
    controller.updateRequestType.bind(controller)
  );

  router.delete(
    "/request-types/:id",
    requirePermission(Permissions.TNA_REQUEST_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteRequestType.bind(controller)
  );

  // ──────────────────────────────────────────────────────────────
  // 2. Funding Type Routes
  // ──────────────────────────────────────────────────────────────

  router.post(
    "/funding-types",
    requirePermission(Permissions.FUNDING_TYPE_CREATE),
    validateBody(CreateFundingTypeSchema),
    controller.createFundingType.bind(controller)
  );

  router.get(
    "/funding-types",
    requirePermission(Permissions.FUNDING_TYPE_VIEW),
    validateQuery(FundingTypeFilterSchema),
    controller.listFundingTypes.bind(controller)
  );

  router.get(
    "/funding-types/:id",
    requirePermission(Permissions.FUNDING_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getFundingTypeById.bind(controller)
  );

  router.patch(
    "/funding-types/:id",
    requirePermission(Permissions.FUNDING_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateFundingTypeSchema),
    controller.updateFundingType.bind(controller)
  );

  router.delete(
    "/funding-types/:id",
    requirePermission(Permissions.FUNDING_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteFundingType.bind(controller)
  );

  // ──────────────────────────────────────────────────────────────
  // 3. Training Format Routes
  // ──────────────────────────────────────────────────────────────

  router.post(
    "/training-formats",
    requirePermission(Permissions.TRAINING_FORMAT_CREATE),
    validateBody(CreateTrainingFormatSchema),
    controller.createTrainingFormat.bind(controller)
  );

  router.get(
    "/training-formats",
    requirePermission(Permissions.TRAINING_FORMAT_VIEW),
    validateQuery(TrainingFormatFilterSchema),
    controller.listTrainingFormats.bind(controller)
  );

  router.get(
    "/training-formats/:id",
    requirePermission(Permissions.TRAINING_FORMAT_VIEW),
    validateParams(idParamSchema),
    controller.getTrainingFormatById.bind(controller)
  );

  router.patch(
    "/training-formats/:id",
    requirePermission(Permissions.TRAINING_FORMAT_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateTrainingFormatSchema),
    controller.updateTrainingFormat.bind(controller)
  );

  router.delete(
    "/training-formats/:id",
    requirePermission(Permissions.TRAINING_FORMAT_DELETE),
    validateParams(idParamSchema),
    controller.deleteTrainingFormat.bind(controller)
  );

  return router;
}