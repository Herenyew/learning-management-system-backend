/**
 * EMS HTTP Client
 * Communicates with the Employee Management System (EMS) microservice so the
 * Access Control UI can show real EMS role names in a searchable dropdown.
 *
 * The admin's own bearer token is forwarded to EMS. EMS's `protect` middleware
 * validates the token (same JWT issuer as the authentication system) so the
 * request is authorized as the logged-in admin.
 *
 * Failures are never fatal: if EMS is down, unreachable or misconfigured the
 * caller simply receives an empty list and the UI falls back to manual entry.
 */
import axios from "axios";
import logger from "../../config/logger.js";
import { env } from "../../config/env.js";

export interface EmsRoleDto {
  id: number;
  name: string;
  description?: string | null;
}

const BASE_URL = (env.ems?.serviceUrl ?? "").replace(/\/+$/, "");

/**
 * Fetch the EMS company roles for the admin's company.
 * Forward the admin's bearer token so EMS can authorize the request.
 */
export async function fetchEmsCompanyRoles(
  accessToken: string,
): Promise<EmsRoleDto[]> {
  if (!BASE_URL) {
    logger.warn(
      "[EmsHttpClient] EMS_SERVICE_URL is not configured — EMS role picker unavailable.",
    );
    return [];
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/api/roles`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 8000,
    });

    // EMS responds with { status: "success", data: [{ id, name, ... }] }.
    // Also tolerate a bare array for resiliency.
    const roles = Array.isArray(data) ? data : data?.data;

    if (!Array.isArray(roles)) {
      logger.warn("[EmsHttpClient] Unexpected EMS roles response shape.");
      return [];
    }

    return roles.map((role: Record<string, unknown>) => ({
      id: Number(role.id),
      name: String(role.name ?? ""),
      description: role.description ? String(role.description) : undefined,
    }));
  } catch (error) {
    logger.warn(
      `[EmsHttpClient] Failed to fetch EMS roles: ${(error as Error).message}`,
    );
    return [];
  }
}