import { SystemSettingRepository } from './system-setting.repository.js';

export class SystemSettingService {
  constructor(private repo: SystemSettingRepository) {}

  create(companyId: number, userId: number, data: any) {
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

  update(companyId: number, id: number, userId: number, data: any) {
    return this.repo.update(companyId, id, userId, data);
  }

  delete(companyId: number, id: number) {
    return this.repo.delete(companyId, id);
  }
}
