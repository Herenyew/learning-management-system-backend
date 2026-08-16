import { ITnaConfigurationRepository } from "./tna-configuration.repository.js";
import {
  CreateTnaRequestTypeDto,
  UpdateTnaRequestTypeDto,
  TnaRequestTypeFilterDto,
  CreateFundingTypeDto,
  UpdateFundingTypeDto,
  FundingTypeFilterDto,
  CreateTrainingFormatDto,
  UpdateTrainingFormatDto,
  TrainingFormatFilterDto,
  slugify,
} from "./tna-configuration.dto.js";
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../../../common/errors/http-errors.js";

export class TnaConfigurationService {
  constructor(private repository: ITnaConfigurationRepository) {}

  // ==========================================
  // 1. TnaRequestTypeConfig Services
  // ==========================================

  async createRequestType(companyId: number, dto: CreateTnaRequestTypeDto) {
    const existing = await this.repository.findRequestTypeByName(
      companyId,
      dto.name
    );
    if (existing) {
      throw new ConflictError(
        `TNA Request Type with name "${dto.name}" already exists`
      );
    }
    return this.repository.createRequestType(companyId, dto);
  }

  async getRequestTypes(companyId: number, filter: TnaRequestTypeFilterDto) {
    const [data, total] = await Promise.all([
      this.repository.findRequestTypes(companyId, filter),
      this.repository.countRequestTypes(companyId, filter),
    ]);

    const page = filter.page || 1;
    const limit = filter.limit || 10;

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

  async getRequestTypeById(companyId: number, id: number) {
    const item = await this.repository.findRequestTypeById(companyId, id);
    if (!item) {
      throw new NotFoundError(`TNA Request Type with ID ${id} not found`);
    }
    return item;
  }

  async updateRequestType(
    companyId: number,
    id: number,
    dto: UpdateTnaRequestTypeDto
  ) {
    await this.getRequestTypeById(companyId, id);

    if (dto.name) {
      const existing = await this.repository.findRequestTypeByName(
        companyId,
        dto.name
      );
      if (existing && existing.id !== id) {
        throw new ConflictError(
          `TNA Request Type with name "${dto.name}" already exists`
        );
      }
    }

    return this.repository.updateRequestType(companyId, id, dto);
  }

  async deleteRequestType(companyId: number, id: number) {
    await this.getRequestTypeById(companyId, id);

    const usages = await this.repository.countRequestTypeUsages(
      companyId,
      id
    );

    if (usages > 0) {
      return this.repository.softDeleteRequestType(companyId, id);
    }

    return this.repository.softDeleteRequestType(companyId, id);
  }

  // ==========================================
  // 2. FundingType Services
  // ==========================================

  async createFundingType(companyId: number, dto: CreateFundingTypeDto) {
    const existingName = await this.repository.findFundingTypeByName(
      companyId,
      dto.name
    );
    if (existingName) {
      throw new ConflictError(
        `Funding Type with name "${dto.name}" already exists`
      );
    }

    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const existingSlug = await this.repository.findFundingTypeBySlug(
      companyId,
      slug
    );
    if (existingSlug) {
      throw new ConflictError(
        `Funding Type with slug "${slug}" already exists`
      );
    }

    return this.repository.createFundingType(companyId, { ...dto, slug });
  }

  async getFundingTypes(companyId: number, filter: FundingTypeFilterDto) {
    const [data, total] = await Promise.all([
      this.repository.findFundingTypes(companyId, filter),
      this.repository.countFundingTypes(companyId, filter),
    ]);

    const page = filter.page || 1;
    const limit = filter.limit || 10;

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

  async getFundingTypeById(companyId: number, id: number) {
    const item = await this.repository.findFundingTypeById(companyId, id);
    if (!item) {
      throw new NotFoundError(`Funding Type with ID ${id} not found`);
    }
    return item;
  }

  async updateFundingType(
    companyId: number,
    id: number,
    dto: UpdateFundingTypeDto
  ) {
    const existing = await this.getFundingTypeById(companyId, id);

    if (existing.isSystem) {
      throw new ForbiddenError("System Funding Types cannot be modified");
    }

    if (dto.name) {
      const existingName = await this.repository.findFundingTypeByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictError(
          `Funding Type with name "${dto.name}" already exists`
        );
      }
    }

    let slug: string | undefined;
    if (dto.slug || dto.name) {
      slug = dto.slug ? slugify(dto.slug) : slugify(dto.name!);
      const existingSlug = await this.repository.findFundingTypeBySlug(
        companyId,
        slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(
          `Funding Type with slug "${slug}" already exists`
        );
      }
    }

    return this.repository.updateFundingType(companyId, id, { ...dto, slug });
  }

  async deleteFundingType(companyId: number, id: number) {
    const existing = await this.getFundingTypeById(companyId, id);

    if (existing.isSystem) {
      throw new ForbiddenError("System Funding Types cannot be deleted");
    }

    return this.repository.softDeleteFundingType(companyId, id);
  }

  // ==========================================
  // 3. TrainingFormat Services
  // ==========================================

  async createTrainingFormat(companyId: number, dto: CreateTrainingFormatDto) {
    const existingName = await this.repository.findTrainingFormatByName(
      companyId,
      dto.name
    );
    if (existingName) {
      throw new ConflictError(
        `Training Format with name "${dto.name}" already exists`
      );
    }

    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const existingSlug = await this.repository.findTrainingFormatBySlug(
      companyId,
      slug
    );
    if (existingSlug) {
      throw new ConflictError(
        `Training Format with slug "${slug}" already exists`
      );
    }

    return this.repository.createTrainingFormat(companyId, { ...dto, slug });
  }

  async getTrainingFormats(
    companyId: number,
    filter: TrainingFormatFilterDto
  ) {
    const [data, total] = await Promise.all([
      this.repository.findTrainingFormats(companyId, filter),
      this.repository.countTrainingFormats(companyId, filter),
    ]);

    const page = filter.page || 1;
    const limit = filter.limit || 10;

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

  async getTrainingFormatById(companyId: number, id: number) {
    const item = await this.repository.findTrainingFormatById(companyId, id);
    if (!item) {
      throw new NotFoundError(`Training Format with ID ${id} not found`);
    }
    return item;
  }

  async updateTrainingFormat(
    companyId: number,
    id: number,
    dto: UpdateTrainingFormatDto
  ) {
    const existing = await this.getTrainingFormatById(companyId, id);

    if (existing.isSystem) {
      throw new ForbiddenError("System Training Formats cannot be modified");
    }

    if (dto.name) {
      const existingName = await this.repository.findTrainingFormatByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictError(
          `Training Format with name "${dto.name}" already exists`
        );
      }
    }

    let slug: string | undefined;
    if (dto.slug || dto.name) {
      slug = dto.slug ? slugify(dto.slug) : slugify(dto.name!);
      const existingSlug = await this.repository.findTrainingFormatBySlug(
        companyId,
        slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(
          `Training Format with slug "${slug}" already exists`
        );
      }
    }

    return this.repository.updateTrainingFormat(companyId, id, { ...dto, slug });
  }

  async deleteTrainingFormat(companyId: number, id: number) {
    const existing = await this.getTrainingFormatById(companyId, id);

    if (existing.isSystem) {
      throw new ForbiddenError("System Training Formats cannot be deleted");
    }

    return this.repository.softDeleteTrainingFormat(companyId, id);
  }
}