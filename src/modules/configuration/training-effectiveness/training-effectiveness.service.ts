import { ITrainingEffectivenessRepository } from "./training-effectiveness.repository.js";
import {
  CreateEffectivenessWeightConfigDto,
  UpdateEffectivenessWeightConfigDto,
  EffectivenessWeightConfigFilterDto,
} from "./training-effectiveness.dto.js";
import {
  ValidationError,
  NotFoundError,
} from "../../../common/errors/http-errors.js";

export class TrainingEffectivenessService {
  constructor(
    private repository: ITrainingEffectivenessRepository,
    private prismaInstance: any
  ) {}

  private validateTotalWeight(
    reaction: number,
    learning: number,
    behavior: number,
    results: number
  ): void {
    const total = reaction + learning + behavior + results;
    if (Math.abs(total - 100) > 0.001) {
      throw new ValidationError(
        `The sum of Kirkpatrick weights must equal exactly 100. Current sum: ${total}`
      );
    }
  }

  async createWeightConfig(
    companyId: number,
    userId: number,
    dto: CreateEffectivenessWeightConfigDto
  ) {
    this.validateTotalWeight(
      dto.reactionWeight,
      dto.learningWeight,
      dto.behaviorWeight,
      dto.resultsWeight
    );

    const shouldBeActive = dto.isActive ?? true;

    if (shouldBeActive) {
      return this.prismaInstance.$transaction(async (tx: any) => {
        await this.repository.deactivateAllActiveConfigs(companyId, tx);
        return this.repository.createWeightConfig(companyId, userId, dto);
      });
    }

    return this.repository.createWeightConfig(companyId, userId, dto);
  }

  async getActiveWeightConfig(companyId: number) {
    const active = await this.repository.findActiveWeightConfig(companyId);
    if (!active) {
      throw new NotFoundError(
        "No active training effectiveness weight configuration found"
      );
    }
    return active;
  }

  async getWeightConfigById(companyId: number, id: number) {
    const config = await this.repository.findWeightConfigById(companyId, id);
    if (!config) {
      throw new NotFoundError(
        `Effectiveness weight config with ID ${id} not found`
      );
    }
    return config;
  }

  async getWeightConfigs(
    companyId: number,
    filter: EffectivenessWeightConfigFilterDto
  ) {
    const [data, total] = await Promise.all([
      this.repository.findWeightConfigs(companyId, filter),
      this.repository.countWeightConfigs(companyId, filter),
    ]);

    const { page, limit } = filter;

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

  async updateWeightConfig(
    companyId: number,
    id: number,
    dto: UpdateEffectivenessWeightConfigDto
  ) {
    const existing = await this.getWeightConfigById(companyId, id);

    const reaction = dto.reactionWeight ?? Number(existing.reactionWeight);
    const learning = dto.learningWeight ?? Number(existing.learningWeight);
    const behavior = dto.behaviorWeight ?? Number(existing.behaviorWeight);
    const results = dto.resultsWeight ?? Number(existing.resultsWeight);

    this.validateTotalWeight(reaction, learning, behavior, results);

    if (dto.isActive === true && !existing.isActive) {
      return this.prismaInstance.$transaction(async (tx: any) => {
        await this.repository.deactivateAllActiveConfigs(companyId, tx);
        return this.repository.updateWeightConfig(companyId, id, dto);
      });
    }

    return this.repository.updateWeightConfig(companyId, id, dto);
  }

  async deactivateWeightConfig(companyId: number, id: number) {
    await this.getWeightConfigById(companyId, id);
    return this.repository.deactivateWeightConfig(companyId, id);
  }
}