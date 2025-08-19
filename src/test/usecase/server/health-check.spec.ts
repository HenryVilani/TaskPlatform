/**
 * Health Check UseCase Tests
 * 
 * Tests cover:
 * - Should return server health information
 * - Should return valid timestamp and uptime
 */

import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckUseCase } from "src/application/use-cases/server/health-check.use-case";
import { ServerHealthDTO } from "src/application/dtos/server.dto";

describe('Health Check UseCase', () => {

	let healthCheckUseCase: HealthCheckUseCase;

	beforeEach(async () => {

		const app: TestingModule = await Test.createTestingModule({
			providers: [HealthCheckUseCase]
		}).compile();

		healthCheckUseCase = app.get<HealthCheckUseCase>(HealthCheckUseCase);

	});

	it('should return server health information', async () => {

		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		expect(result).toHaveProperty('timestamp');
		expect(result).toHaveProperty('uptime');
		expect(typeof result.timestamp).toBe('number');
		expect(typeof result.uptime).toBe('number');

	});

	it('should return valid timestamp and uptime', async () => {

		const startTime = Date.now();
		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		// Timestamp should be close to current time
		expect(result.timestamp).toBeGreaterThanOrEqual(startTime);
		expect(result.timestamp).toBeLessThanOrEqual(Date.now());

		// Uptime should be positive
		expect(result.uptime).toBeGreaterThanOrEqual(0);

	});

});