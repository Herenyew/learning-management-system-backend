import { Prisma, PrismaClient, AudienceGroupRule, RuleOperator, Employee, AppUser } from "@prisma/client";
import { NotFoundError } from "../../../common/errors/http-errors.js";
import { IAudienceRepository } from "./audience.repository.js";

export interface MemberFilter {
  search?: string;
}

type EmployeeWithAppUsers = Employee & { appUsers: AppUser[] };

export class AudienceMatchingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audienceRepository: IAudienceRepository,
  ) {}

  /**
   * Checks if a specific employee matches an audience group.
   */
  async matchesEmployee(
    employeeId: string,
    audienceGroupId: number,
    companyId: number,
  ): Promise<boolean> {
    const group = await this.audienceRepository.findById(audienceGroupId, companyId);
    if (!group || !group.isActive) return false;

    const rules = await this.audienceRepository.findRules(audienceGroupId, companyId);
    if (rules.length === 0) return false;

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { appUsers: true },
    });
    if (!employee) return false;

    return this.evaluateRules(employee, rules);
  }

  /**
   * Resolves members directly using DB-level Prisma query building
   * to eliminate Node.js in-memory pagination bottlenecks.
   */
  async resolveMembers(
    audienceGroupId: number,
    companyId: number,
    page: number,
    pageSize: number,
    filter: MemberFilter = {},
  ) {
    const group = await this.audienceRepository.findById(audienceGroupId, companyId);
    if (!group) throw new NotFoundError("Audience group");
    
    // Fail fast if audience group is disabled or has no rules
    if (!group.isActive) {
      return { data: [], totalRecords: 0 };
    }

    const rules = await this.audienceRepository.findRules(audienceGroupId, companyId);
    if (rules.length === 0) {
      return { data: [], totalRecords: 0 };
    }

    // Separate inclusion rules and exclusion rules
    const inclusionRules = rules.filter((r) => !r.isExclusion);
    const exclusionRules = rules.filter((r) => r.isExclusion);

    // Build typed dynamic conditions
    const inclusionConditions = inclusionRules.map((rule) => this.buildPrismaRuleWhere(rule));
    const exclusionConditions = exclusionRules.map((rule) => this.buildPrismaRuleWhere(rule));

    const whereClause: Prisma.EmployeeWhereInput = {
      companyId,
      isActive: true,
      AND: [
        // Search Filter
        ...(filter.search
          ? [
              {
                OR: [
                  { fullName: { contains: filter.search, mode: Prisma.QueryMode.insensitive } },
                  { id: { contains: filter.search, mode: Prisma.QueryMode.insensitive } },
                ],
              },
            ]
          : []),
        // INCLUSION MATCHING
        ...(inclusionConditions.length > 0 ? [{ OR: inclusionConditions }] : []),
        // EXCLUSION MATCHING (NOT ANY)
        ...(exclusionConditions.length > 0 ? [{ NOT: { OR: exclusionConditions } }] : []),
      ],
    };

    const skip = (page - 1) * pageSize;

    const [data, totalRecords] = await Promise.all([
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { fullName: "asc" },
      }),
      this.prisma.employee.count({ where: whereClause }),
    ]);

    return { data, totalRecords };
  }

  // ==========================================
  // Core Evaluation (In-memory single employee logic)
  // ==========================================

  private evaluateRules(employee: EmployeeWithAppUsers, rules: AudienceGroupRule[]): boolean {
    const inclusionRules = rules.filter((r) => !r.isExclusion);
    const exclusionRules = rules.filter((r) => r.isExclusion);

    if (inclusionRules.length === 0) return false;

    // 1. Evaluate Inclusion Rules
    let isIncluded = false;

    for (let i = 0; i < inclusionRules.length; i++) {
      const rule = inclusionRules[i];
      const ruleMatch = this.employeeMatchesRule(employee, rule);

      if (i === 0) {
        isIncluded = ruleMatch;
      } else if (rule.operator === RuleOperator.AND) {
        isIncluded = isIncluded && ruleMatch;
      } else {
        isIncluded = isIncluded || ruleMatch;
      }
    }

    if (!isIncluded) return false;

    // 2. Evaluate Exclusion Rules
    for (const rule of exclusionRules) {
      if (this.employeeMatchesRule(employee, rule)) {
        return false;
      }
    }

    return true;
  }

  private employeeMatchesRule(employee: EmployeeWithAppUsers, rule: AudienceGroupRule): boolean {
    if (rule.departmentId != null && employee.departmentId !== rule.departmentId) {
      return false;
    }

    if (rule.jobTitleId != null && employee.jobTitleId !== rule.jobTitleId) {
      return false;
    }

    if (rule.jobLevelId != null && employee.jobLevelId !== rule.jobLevelId) {
      return false;
    }

    if (rule.employmentTypeId != null && employee.employmentTypeId !== rule.employmentTypeId) {
      return false;
    }

    if (rule.appRoleId != null) {
      const activeAppUser = employee.appUsers?.find((u) => u.isActive);
      if (!activeAppUser || activeAppUser.roleId !== rule.appRoleId) {
        return false;
      }
    }

    if (rule.hireWithinDays != null) {
      if (!employee.startDate) return false;
      const days = (Date.now() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24);
      if (days > rule.hireWithinDays) return false;
    }

    return true;
  }

  /**
   * Maps an AudienceGroupRule entity to a strongly typed Prisma condition query
   */
  private buildPrismaRuleWhere(rule: AudienceGroupRule): Prisma.EmployeeWhereInput {
    const conditions: Prisma.EmployeeWhereInput = {};

    if (rule.departmentId != null) conditions.departmentId = rule.departmentId;
    if (rule.jobTitleId != null) conditions.jobTitleId = rule.jobTitleId;
    if (rule.jobLevelId != null) conditions.jobLevelId = rule.jobLevelId;
    if (rule.employmentTypeId != null) conditions.employmentTypeId = rule.employmentTypeId;

    if (rule.appRoleId != null) {
      conditions.appUsers = {
        some: {
          roleId: rule.appRoleId,
          isActive: true,
        },
      };
    }

    if (rule.hireWithinDays != null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rule.hireWithinDays);
      conditions.startDate = { gte: cutoffDate };
    }

    return conditions;
  }
}