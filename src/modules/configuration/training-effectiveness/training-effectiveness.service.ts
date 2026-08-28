import type { ITrainingEffectivenessRepository } from "./training-effectiveness.types.js";
import type {
  CreateEffectivenessWeightConfigInput,
  UpdateEffectivenessWeightConfigInput,
  EffectivenessWeightConfigFilterInput,
} from "./training-effectiveness.types.js";
import {
  ValidationError,
  NotFoundError,
} from "../../../common/errors/http-errors.js";

export class TrainingEffectivenessService {
  constructor(
    private repository: ITrainingEffectivenessRepository,
    private prismaInstance: any
  ) {}

  /**
   * Prisma Decimal columns serialize to strings over JSON ("30.00"), which
   * broke frontend arithmetic ("0104020" style totals). Normalize every
   * weight to a JS number before returning data to clients.
   */
  private serialize(config: any) {
    if (!config) return config;
    return {
      ...config,
      reactionWeight: Number(config.reactionWeight),
      learningWeight: Number(config.learningWeight),
      behaviorWeight: Number(config.behaviorWeight),
      resultsWeight: Number(config.resultsWeight),
    };
  }

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
    dto: CreateEffectivenessWeightConfigInput
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
        return this.serialize(await this.repository.createWeightConfig(companyId, userId, dto));
      });
    }

    return this.serialize(await this.repository.createWeightConfig(companyId, userId, dto));
  }

  async getActiveWeightConfig(companyId: number) {
    const active = await this.repository.findActiveWeightConfig(companyId);
    if (!active) {
      throw new NotFoundError(
        "No active training effectiveness weight configuration found"
      );
    }
    return this.serialize(active);
  }

  async getWeightConfigById(companyId: number, id: number) {
    const config = await this.repository.findWeightConfigById(companyId, id);
    if (!config) {
      throw new NotFoundError(
        `Effectiveness weight config with ID ${id} not found`
      );
    }
    return this.serialize(config);
  }

  async getWeightConfigs(
    companyId: number,
    filter: EffectivenessWeightConfigFilterInput
  ) {
    const [data, total] = await Promise.all([
      this.repository.findWeightConfigs(companyId, filter),
      this.repository.countWeightConfigs(companyId, filter),
    ]);

    const { page, limit } = filter;

    return {
      data: data.map((c) => this.serialize(c)),
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
    dto: UpdateEffectivenessWeightConfigInput
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
        return this.serialize(await this.repository.updateWeightConfig(companyId, id, dto));
      });
    }

    return this.serialize(await this.repository.updateWeightConfig(companyId, id, dto));
  }

  async deactivateWeightConfig(companyId: number, id: number) {
    await this.getWeightConfigById(companyId, id);
    return this.serialize(await this.repository.deactivateWeightConfig(companyId, id));
  }

  async deleteWeightConfig(companyId: number, id: number) {
    const existing = await this.getWeightConfigById(companyId, id);
    // Keep at least one active configuration alive at all times.
    if (existing.isActive) {
      const activeCount = await this.repository.countWeightConfigs(companyId, { isActive: true } as any);
      if (activeCount <= 1) {
        throw new ValidationError(
          "Cannot delete the only active configuration. Create or activate another one first, or deactivate this one."
        );
      }
    }
    await this.repository.deleteWeightConfig(companyId, id);
    return { message: "Training effectiveness configuration deleted successfully" };
  }
}
