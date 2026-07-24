export class HealthService {
  getHealthStatus() {
    return {
      success: true,
      message: "LMS API is running.",
      timestamp: new Date().toISOString(),
    };
  }
}

export default new HealthService();