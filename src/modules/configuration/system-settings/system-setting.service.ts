import {
  ConflictError,
  NotFoundError,
} from '../../../common/errors/index.js';
import { SystemSettingRepository } from './system-setting.repository.js';

export class SystemSettingService {
  constructor(private repo: SystemSettingRepository) {}

  async create(companyId: number, userId: number, data: any) {
    // Setting keys are unique per company — reject duplicates with a friendly 409
    const existing = await this.repo.findByKey(companyId, data.settingKey);
    if (existing) {
      throw new ConflictError(
        `A system setting with key "${data.settingKey}" already exists.`
      );
    }
    return this.repo.create(companyId, userId, data);
  }

  findById(companyId: number, id: number) {
    return this.repo.findById(companyId, id);
  }

  findByKey(companyId: number, key: string) {
    return this.repo.findByKey(companyId, key);
  }

  findMany(companyId: number, query: any) {
    return this.repo.findMany(companyId, query);
  }

  async update(companyId: number, id: number, userId: number, data: any) {
    const existing = await this.repo.findById(companyId, id);
    if (!existing) {
      throw new NotFoundError('System setting');
    }
    return this.repo.update(companyId, id, userId, data);
  }

  async delete(companyId: number, id: number) {
    const existing = await this.repo.findById(companyId, id);
    if (!existing) {
      throw new NotFoundError('System setting');
    }
    return this.repo.delete(companyId, id);
  }
}
