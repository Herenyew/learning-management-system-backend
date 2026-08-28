import { Prisma } from "@prisma/client";
import type {
  PrismaClient,
  NotificationModule,
  NotificationEvent,
  NotificationTemplate,
} from "@prisma/client";
import type {
  CreateNotificationModuleInput,
  UpdateNotificationModuleInput,
  NotificationModuleFilterParams,
  CreateNotificationEventInput,
  UpdateNotificationEventInput,
  NotificationEventFilterParams,
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  NotificationTemplateFilterParams,
} from "./notification-configuration.types.js";

import type { INotificationConfigurationRepository } from "./notification-configuration.types.js";

export class NotificationConfigurationRepository
  implements INotificationConfigurationRepository
{
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. NotificationModule Methods
  // ==========================================

  async createNotificationModule(
    companyId: number,
    data: CreateNotificationModuleInput
  ): Promise<NotificationModule> {
    return this.prisma.notificationModule.create({
      data: {
        companyId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async findNotificationModuleById(
    companyId: number,
    id: number
  ): Promise<NotificationModule | null> {
    return this.prisma.notificationModule.findFirst({
      where: { id, companyId },
    });
  }

  async findNotificationModuleByName(
    companyId: number,
    name: string
  ): Promise<NotificationModule | null> {
    return this.prisma.notificationModule.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findNotificationModuleBySlug(
    companyId: number,
    slug: string
  ): Promise<NotificationModule | null> {
    return this.prisma.notificationModule.findFirst({
      where: {
        companyId,
        slug,
      },
    });
  }

  async findNotificationModules(
    companyId: number,
    query: NotificationModuleFilterParams
  ) {
    const { search, isActive, isSystem, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationModuleWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.notificationModule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notificationModule.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateNotificationModule(
    companyId: number,
    id: number,
    data: UpdateNotificationModuleInput
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationModule.updateMany({
      where: { id, companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isSystem !== undefined && { isSystem: data.isSystem }),
      },
    });
  }

  async deactivateNotificationModule(
    companyId: number,
    id: number
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationModule.updateMany({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  async countNotificationModuleUsages(
    companyId: number,
    id: number
  ): Promise<number> {
    return this.prisma.notificationEvent.count({
      where: { companyId, moduleId: id },
    });
  }

  // ==========================================
  // 2. NotificationEvent Methods
  // ==========================================

  async createNotificationEvent(
    companyId: number,
    data: CreateNotificationEventInput
  ): Promise<NotificationEvent> {
    return this.prisma.notificationEvent.create({
      data: {
        companyId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        moduleId: data.moduleId,
      },
    });
  }

  async findNotificationEventById(
    companyId: number,
    id: number
  ): Promise<NotificationEvent | null> {
    return this.prisma.notificationEvent.findFirst({
      where: { id, companyId },
      include: { module: true },
    });
  }

  async findNotificationEventByCode(
    companyId: number,
    code: string
  ): Promise<NotificationEvent | null> {
    return this.prisma.notificationEvent.findFirst({
      where: { companyId, code },
      include: { module: true },
    });
  }

  async findNotificationEvents(
    companyId: number,
    query: NotificationEventFilterParams
  ) {
    const { search, moduleId, isActive, page = 1, limit = 10, sortBy = "id", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationEventWhereInput = {
      companyId,
      ...(moduleId && { moduleId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // NotificationEvent has no createdAt column — guard against invalid sorts
    const allowedSortFields = ["id", "code", "name"] as string[];
    const sortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : "id";

    const [data, total] = await Promise.all([
      this.prisma.notificationEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        include: { module: true },
      }),
      this.prisma.notificationEvent.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateNotificationEvent(
    companyId: number,
    id: number,
    data: UpdateNotificationEventInput
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationEvent.updateMany({
      where: { id, companyId },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.moduleId !== undefined && { moduleId: data.moduleId }),
      },
    });
  }

  async deactivateNotificationEvent(
    companyId: number,
    id: number
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationEvent.updateMany({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  async countNotificationEventUsages(
    companyId: number,
    id: number
  ): Promise<number> {
    return this.prisma.notificationTemplate.count({
      where: { companyId, notificationEventId: id, deletedAt: null },
    });
  }

  // ==========================================
  // 3. NotificationTemplate Methods
  // ==========================================

  async createTemplate(
    companyId: number,
    userId: number,
    data: CreateNotificationTemplateInput
  ): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.create({
      data: {
        companyId,
        createdBy: userId,
        name: data.name,
        description: data.description ?? null,
        channel: data.channel,
        eventCode: data.eventCode,
        notificationEventId: data.notificationEventId ?? null,
        subject: data.subject ?? null,
        body: data.body,
        variables: data.variables
          ? (data.variables as Prisma.InputJsonValue)
          : Prisma.DbNull,
        language: data.language ?? "en",
        senderName: data.senderName ?? null,
        replyToEmail: data.replyToEmail ?? null,
      },
    });
  }

  async findTemplateById(
    companyId: number,
    id: number
  ): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { notificationEvent: true },
    });
  }

  async findTemplateByName(
    companyId: number,
    name: string
  ): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findTemplates(
    companyId: number,
    query: NotificationTemplateFilterParams
  ) {
    const {
      search,
      channel,
      eventCode,
      notificationEventId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(channel && { channel }),
      ...(eventCode && { eventCode }),
      ...(notificationEventId && { notificationEventId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
          { body: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { notificationEvent: true },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateNotificationTemplateInput
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: {
        updatedBy: userId,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.eventCode !== undefined && { eventCode: data.eventCode }),
        ...(data.notificationEventId !== undefined && {
          notificationEventId: data.notificationEventId,
        }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.variables !== undefined && {
          variables: data.variables
            ? (data.variables as Prisma.InputJsonValue)
            : Prisma.DbNull,
        }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.senderName !== undefined && { senderName: data.senderName }),
        ...(data.replyToEmail !== undefined && { replyToEmail: data.replyToEmail }),
      },
    });
  }

  async softDeleteTemplate(
    companyId: number,
    id: number
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async countTemplateUsages(
    companyId: number,
    id: number
  ): Promise<number> {
    // Ownership boundary check: EMS owns actual Notification dispatch records.
    // Return 0 if no direct LMS child relations exist.
    return 0;
  }
}
