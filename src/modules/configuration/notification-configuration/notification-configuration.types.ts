import { z } from "zod";
import {
  idParamSchema,
  createNotificationModuleSchema,
  updateNotificationModuleSchema,
  notificationModuleFilterSchema,
  createNotificationEventSchema,
  updateNotificationEventSchema,
  notificationEventFilterSchema,
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  notificationTemplateFilterSchema,
} from "./notification-configuration.dto.js";

import { $Enums } from "@prisma/client";

export type Channel = $Enums.NotificationChannel;

export type IdParam = z.infer<typeof idParamSchema>;

export type CreateNotificationModuleInput = z.infer<typeof createNotificationModuleSchema>;
export type UpdateNotificationModuleInput = z.infer<typeof updateNotificationModuleSchema>;
export type NotificationModuleFilterInput = z.infer<typeof notificationModuleFilterSchema>;
export interface NotificationModuleFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
  sortBy?: "name" | "slug" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export type CreateNotificationEventInput = z.infer<typeof createNotificationEventSchema>;
export type UpdateNotificationEventInput = z.infer<typeof updateNotificationEventSchema>;
export type NotificationEventFilterInput = z.infer<typeof notificationEventFilterSchema>;
export interface NotificationEventFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  moduleId?: number;
  isActive?: boolean;
  sortBy?: "id" | "code" | "name";
  sortOrder?: "asc" | "desc";
}

export type CreateNotificationTemplateInput = z.infer<typeof createNotificationTemplateSchema>;
export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>;
export type NotificationTemplateFilterInput = z.infer<typeof notificationTemplateFilterSchema>;
export interface NotificationTemplateFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  channel?: Channel;
  eventCode?: string;
  notificationEventId?: number;
  isActive?: boolean;
  sortBy?: "name" | "channel" | "createdAt";
  sortOrder?: "asc" | "desc";
}

import type { Prisma, NotificationModule, NotificationEvent, NotificationTemplate } from "@prisma/client";

export interface INotificationConfigurationRepository {
  createNotificationModule(companyId: number, data: CreateNotificationModuleInput): Promise<NotificationModule>;
  findNotificationModuleById(companyId: number, id: number): Promise<NotificationModule | null>;
  findNotificationModuleByName(companyId: number, name: string): Promise<NotificationModule | null>;
  findNotificationModuleBySlug(companyId: number, slug: string): Promise<NotificationModule | null>;
  findNotificationModules(companyId: number, query: NotificationModuleFilterParams): Promise<{ data: NotificationModule[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  updateNotificationModule(companyId: number, id: number, data: UpdateNotificationModuleInput): Promise<Prisma.BatchPayload>;
  deactivateNotificationModule(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countNotificationModuleUsages(companyId: number, id: number): Promise<number>;

  createNotificationEvent(companyId: number, data: CreateNotificationEventInput): Promise<NotificationEvent>;
  findNotificationEventById(companyId: number, id: number): Promise<NotificationEvent | null>;
  findNotificationEventByCode(companyId: number, code: string): Promise<NotificationEvent | null>;
  findNotificationEvents(companyId: number, query: NotificationEventFilterParams): Promise<{ data: NotificationEvent[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  updateNotificationEvent(companyId: number, id: number, data: UpdateNotificationEventInput): Promise<Prisma.BatchPayload>;
  deactivateNotificationEvent(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countNotificationEventUsages(companyId: number, id: number): Promise<number>;

  createTemplate(companyId: number, userId: number, data: CreateNotificationTemplateInput): Promise<NotificationTemplate>;
  findTemplateById(companyId: number, id: number): Promise<NotificationTemplate | null>;
  findTemplateByName(companyId: number, name: string): Promise<NotificationTemplate | null>;
  findTemplates(companyId: number, query: NotificationTemplateFilterParams): Promise<{ data: NotificationTemplate[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  updateTemplate(companyId: number, id: number, userId: number, data: UpdateNotificationTemplateInput): Promise<Prisma.BatchPayload>;
  softDeleteTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countTemplateUsages(companyId: number, id: number): Promise<number>;
}
