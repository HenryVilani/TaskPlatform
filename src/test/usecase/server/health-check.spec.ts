/**
 * Health Check UseCase Tests
 * 
 * Tests cover:
 * - Should return server health information
 * - Should return valid timestamp and uptime
 * - Should include service health status
 */

import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckUseCase } from "src/application/use-cases/server/health-check.use-case";
import { ServerHealthDTO } from "src/application/dtos/server.dto";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";

describe('Health Check UseCase', () => {

	let healthCheckUseCase: HealthCheckUseCase;
	let mockHealthCheckService: jest.Mocked<HealthCheckService>;

	beforeEach(async () => {

		// Create a mock for HealthCheckService
		mockHealthCheckService = {
			checkAllServices: jest.fn(),
			getCachedStatus: jest.fn(),
			getHealthSummary: jest.fn(),
			register: jest.fn(),
			remove: jest.fn(),
			getService: jest.fn(),
			checkServiceWithTimeout: jest.fn(),
			scheduleReconnection: jest.fn(),
			stopBackgroundMonitor: jest.fn(),
			waitServices: jest.fn(),
		} as any;

		const app: TestingModule = await Test.createTestingModule({
			providers: [
				HealthCheckUseCase,
				{
					provide: HealthCheckService,
					useValue: mockHealthCheckService
				}
			]
		}).compile();

		healthCheckUseCase = app.get<HealthCheckUseCase>(HealthCheckUseCase);
	
	})

	it('should call checkAllServices from health service', async () => {

		// Mock the checkAllServices method
		mockHealthCheckService.checkAllServices.mockResolvedValue([]);

		await healthCheckUseCase.execute();

		expect(mockHealthCheckService.checkAllServices).toHaveBeenCalledTimes(1);

	});

	it('should return server health information', async () => {

		// Mock the checkAllServices method
		mockHealthCheckService.checkAllServices.mockResolvedValue([]);

		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		expect(result).toHaveProperty('timestamp');
		expect(result).toHaveProperty('uptime');
		expect(result).toHaveProperty('services');
		expect(typeof result.timestamp).toBe('number');
		expect(typeof result.uptime).toBe('number');
		expect(Array.isArray(result.services)).toBe(true);

	});

	it('should return valid timestamp and uptime', async () => {

		// Mock the checkAllServices method
		mockHealthCheckService.checkAllServices.mockResolvedValue([]);

		const startTime = Date.now();
		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		// Timestamp should be close to current time
		expect(result.timestamp).toBeGreaterThanOrEqual(startTime);
		expect(result.timestamp).toBeLessThanOrEqual(Date.now());

		// Uptime should be positive
		expect(result.uptime).toBeGreaterThanOrEqual(0);

	});

	it('should include services array with correct structure', async () => {

		// Mock the checkAllServices method with sample services
		const mockServices = [
			{ name: 'database', status: 'Health' as const, lastCheck: new Date(), consecutiveFailures: 0, nextCheckAt: new Date(), service: {} as any },
			{ name: 'redis', status: 'UnHealth' as const, lastCheck: new Date(), consecutiveFailures: 1, nextCheckAt: new Date(), service: {} as any }
		];
		
		mockHealthCheckService.checkAllServices.mockResolvedValue(mockServices);

		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		expect(result.services).toBeDefined();
		expect(Array.isArray(result.services)).toBe(true);
		expect(result.services).toHaveLength(2);

		// Each service should have name and status properties
		result.services.forEach(service => {
			expect(service).toHaveProperty('name');
			expect(service).toHaveProperty('status');
			expect(typeof service.name).toBe('string');
			expect(['Health', 'UnHealth']).toContain(service.status);
		});

	});

	it('should handle empty services list', async () => {

		// Mock empty services list
		mockHealthCheckService.checkAllServices.mockResolvedValue([]);

		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		expect(result.services).toHaveLength(0);

	});

	it('should return consistent data structure', async () => {

		// Mock the checkAllServices method
		mockHealthCheckService.checkAllServices.mockResolvedValue([]);

		const result: ServerHealthDTO = await healthCheckUseCase.execute();

		// Verify required properties exist
		const requiredProps = ['timestamp', 'uptime', 'services'];
		requiredProps.forEach(prop => {
			expect(result).toHaveProperty(prop);
		});

	});

	}
);