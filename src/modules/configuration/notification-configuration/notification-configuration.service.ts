import type { INotificationConfigurationRepository } from "./notification-configuration.types.js";
import type {
  CreateNotificationModuleInput,
  UpdateNotificationModuleInput,
  NotificationModuleFilterInput,
  CreateNotificationEventInput,
  UpdateNotificationEventInput,
  NotificationEventFilterInput,
} from "./notification-configuration.types.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../../common/errors/index.js";

export class NotificationConfigurationService {
  constructor(
    private repository: INotificationConfigurationRepository
  ) {}

  // ==========================================
  // 1. NotificationModule Service Methods
  // ==========================================

  async createNotificationModule(
    companyId: number,
    dto: CreateNotificationModuleInput
  ) {
    const existingByName = await this.repository.findNotificationModuleByName(
      companyId,
      dto.name
    );
    if (existingByName) {
      throw new ConflictError(
        `Notification module with name '${dto.name}' already exists`
      );
    }

    const existingBySlug = await this.repository.findNotificationModuleBySlug(
      companyId,
      dto.slug
    );
    if (existingBySlug) {
      throw new ConflictError(
        `Notification module with slug '${dto.slug}' already exists`
      );
    }

    return this.repository.createNotificationModule(companyId, dto);
  }

  async listNotificationModules(
    companyId: number,
    query: NotificationModuleFilterInput
  ) {
    return this.repository.findNotificationModules(companyId, query);
  }

  async getNotificationModuleById(companyId: number, id: number) {
    const module = await this.repository.findNotificationModuleById(
      companyId,
      id
    );
    if (!module) {
      throw new NotFoundError("Notification module not found");
    }
    return module;
  }

  async updateNotificationModule(
    companyId: number,
    id: number,
    dto: UpdateNotificationModuleInput
  ) {
    const module = await this.getNotificationModuleById(companyId, id);

    if (module.isSystem) {
      throw new ValidationError(
        "System-defined notification modules cannot be modified"
      );
    }

    if (dto.name && dto.name !== module.name) {
      const existingByName = await this.repository.findNotificationModuleByName(
        companyId,
        dto.name
      );
      if (existingByName && existingByName.id !== id) {
        throw new ConflictError(
          `Notification module with name '${dto.name}' already exists`
        );
      }
    }

    if (dto.slug && dto.slug !== module.slug) {
      const existingBySlug = await this.repository.findNotificationModuleBySlug(
        companyId,
        dto.slug
      );
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictError(
          `Notification module with slug '${dto.slug}' already exists`
        );
      }
    }

    const result = await this.repository.updateNotificationModule(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new NotFoundError("Notification module not found or update failed");
    }

    return this.getNotificationModuleById(companyId, id);
  }

  async deactivateNotificationModule(companyId: number, id: number) {
    const module = await this.getNotificationModuleById(companyId, id);

    if (module.isSystem) {
      throw new ValidationError(
        "System-defined notification modules cannot be deactivated"
      );
    }

    const usages = await this.repository.countNotificationModuleUsages(
      companyId,
      id
    );
    if (usages > 0) {
      throw new ValidationError(
        `Cannot deactivate notification module. It is currently referenced by ${usages} event(s)`
      );
    }

    const result = await this.repository.deactivateNotificationModule(
      companyId,
      id
    );
    if (result.count === 0) {
      throw new NotFoundError(
        "Notification module not found or deactivation failed"
      );
    }

    return { message: "Notification module deactivated successfully" };
  }

  // ==========================================
  // 2. NotificationEvent Service Methods
  // ==========================================

  async createNotificationEvent(
    companyId: number,
    dto: CreateNotificationEventInput
  ) {
    const module = await this.repository.findNotificationModuleById(
      companyId,
      dto.moduleId
    );
    if (!module) {
      throw new NotFoundError(
        `Notification module with ID ${dto.moduleId} not found`
      );
    }

    const existingCode = await this.repository.findNotificationEventByCode(
      companyId,
      dto.code
    );
    if (existingCode) {
      throw new ConflictError(
        `Notification event with code '${dto.code}' already exists`
      );
    }

    return this.repository.createNotificationEvent(companyId, dto);
  }

  async listNotificationEvents(
    companyId: number,
    query: NotificationEventFilterInput
  ) {
    return this.repository.findNotificationEvents(companyId, query);
  }

  async getNotificationEventById(companyId: number, id: number) {
    const event = await this.repository.findNotificationEventById(
      companyId,
      id
    );
    if (!event) {
      throw new NotFoundError("Notification event not found");
    }
    return event;
  }

  async updateNotificationEvent(
    companyId: number,
    id: number,
    dto: UpdateNotificationEventInput
  ) {
    const event = await this.getNotificationEventById(companyId, id);

    if (dto.moduleId && dto.moduleId !== event.moduleId) {
      const module = await this.repository.findNotificationModuleById(
        companyId,
        dto.moduleId
      );
      if (!module) {
        throw new NotFoundError(
          `Notification module with ID ${dto.moduleId} not found`
        );
      }
    }

    if (dto.code && dto.code !== event.code) {
      const existingCode = await this.repository.findNotificationEventByCode(
        companyId,
        dto.code
      );
      if (existingCode && existingCode.id !== id) {
        throw new ConflictError(
          `Notification event with code '${dto.code}' already exists`
        );
      }
    }

    const result = await this.repository.updateNotificationEvent(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new NotFoundError("Notification event not found or update failed");
    }

    return this.getNotificationEventById(companyId, id);
  }

  async deactivateNotificationEvent(companyId: number, id: number) {
    await this.getNotificationEventById(companyId, id);

    const usages = await this.repository.countNotificationEventUsages(
      companyId,
      id
    );
    if (usages > 0) {
      throw new ValidationError(
        `Cannot deactivate notification event. It is currently referenced by ${usages} template(s)`
      );
    }

    const result = await this.repository.deactivateNotificationEvent(
      companyId,
      id
    );
    if (result.count === 0) {
      throw new NotFoundError(
        "Notification event not found or deactivation failed"
      );
    }

    return { message: "Notification event deactivated successfully" };
  }
}
