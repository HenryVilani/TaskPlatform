import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import * as http from 'http';
import * as https from 'https';

/**
 * Interface para definir o resultado de um health check
 */
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  timestamp: Date;
}

/**
 * Interface para configuração de retry
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Serviço responsável por verificar a saúde de todos os serviços externos
 * antes da aplicação iniciar completamente
 */
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 30, // 30 tentativas
    initialDelay: 2000, // 2 segundos
    maxDelay: 30000, // 30 segundos máximo
    backoffMultiplier: 1.5
  };

  /**
   * Verifica a conectividade com o Redis
   */
  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100,
    });

    try {
      await redis.connect();
      await redis.ping();
      await redis.disconnect();
      
      return {
        service: 'Redis',
        status: 'healthy',
        message: 'Successfully connected to Redis',
        timestamp: new Date()
      };
    } catch (error) {
      await redis.disconnect();
      return {
        service: 'Redis',
        status: 'unhealthy',
        message: `Failed to connect to Redis: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Verifica a conectividade com o PostgreSQL
   */
  private async checkPostgreSQLHealth(): Promise<HealthCheckResult> {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || '123',
      database: process.env.POSTGRES_DB || 'main-db',
      connectTimeoutMS: 5000,
      entities: [],
      synchronize: false,
      logging: false,
    });

    try {
      await dataSource.initialize();
      await dataSource.query('SELECT 1');
      await dataSource.destroy();
      
      return {
        service: 'PostgreSQL',
        status: 'healthy',
        message: 'Successfully connected to PostgreSQL',
        timestamp: new Date()
      };
    } catch (error) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      return {
        service: 'PostgreSQL',
        status: 'unhealthy',
        message: `Failed to connect to PostgreSQL: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Verifica a conectividade com o Prometheus
   */
  private async checkPrometheusHealth(): Promise<HealthCheckResult> {
    const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';
    
    return new Promise<HealthCheckResult>((resolve) => {
      const url = new URL(`${prometheusUrl}/-/healthy`);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: 'GET',
        timeout: 5000,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({
              service: 'Prometheus',
              status: 'healthy',
              message: 'Successfully connected to Prometheus',
              timestamp: new Date()
            });
          } else {
            resolve({
              service: 'Prometheus',
              status: 'unhealthy',
              message: `Prometheus returned status ${res.statusCode}`,
              timestamp: new Date()
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          service: 'Prometheus',
          status: 'unhealthy',
          message: `Failed to connect to Prometheus: ${error.message}`,
          timestamp: new Date()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          service: 'Prometheus',
          status: 'unhealthy',
          message: 'Prometheus health check timed out',
          timestamp: new Date()
        });
      });

      req.end();
    });
  }

  /**
   * Verifica a conectividade com o Loki
   */
  private async checkLokiHealth(): Promise<HealthCheckResult> {
    const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
    
    return new Promise<HealthCheckResult>((resolve) => {
      const url = new URL(`${lokiUrl}/ready`);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: 'GET',
        timeout: 5000,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({
              service: 'Loki',
              status: 'healthy',
              message: 'Successfully connected to Loki',
              timestamp: new Date()
            });
          } else {
            resolve({
              service: 'Loki',
              status: 'unhealthy',
              message: `Loki returned status ${res.statusCode}`,
              timestamp: new Date()
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          service: 'Loki',
          status: 'unhealthy',
          message: `Failed to connect to Loki: ${error.message}`,
          timestamp: new Date()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          service: 'Loki',
          status: 'unhealthy',
          message: 'Loki health check timed out',
          timestamp: new Date()
        });
      });

      req.end();
    });
  }

  /**
   * Executa health check para todos os serviços
   */
  private async checkAllServices(): Promise<HealthCheckResult[]> {
    const checks = await Promise.all([
      this.checkRedisHealth(),
      this.checkPostgreSQLHealth(),
      this.checkPrometheusHealth(),
      this.checkLokiHealth()
    ]);

    return checks;
  }

  /**
   * Implementa delay com backoff exponencial
   */
  private async delay(attempt: number, config: RetryConfig): Promise<void> {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );
    
    this.logger.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Aguarda até que todos os serviços estejam saudáveis
   * Implementa retry com backoff exponencial
   */
  async waitForAllServicesHealthy(retryConfig?: Partial<RetryConfig>): Promise<void> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let attempt = 1;

    this.logger.log('🔍 Iniciando verificação de saúde dos serviços...');
    this.logger.log(`📋 Serviços a verificar: Redis, PostgreSQL, Prometheus, Loki`);
    this.logger.log(`⚙️ Configuração: ${config.maxAttempts} tentativas máximas, delay inicial ${config.initialDelay}ms`);

    while (attempt <= config.maxAttempts) {
      this.logger.log(`\n🔄 Tentativa ${attempt}/${config.maxAttempts}`);
      
      const results = await this.checkAllServices();
      const unhealthyServices = results.filter(r => r.status === 'unhealthy');
      
      // Log dos resultados
      results.forEach(result => {
        const icon = result.status === 'healthy' ? '✅' : '❌';
        this.logger.log(`${icon} ${result.service}: ${result.message}`);
      });

      if (unhealthyServices.length === 0) {
        this.logger.log('\n🎉 Todos os serviços estão saudáveis! Iniciando aplicação...');
        return;
      }

      if (attempt === config.maxAttempts) {
        const unhealthyNames = unhealthyServices.map(s => s.service).join(', ');
        const errorMessage = `❌ Falha ao conectar com os serviços após ${config.maxAttempts} tentativas. Serviços não saudáveis: ${unhealthyNames}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const unhealthyNames = unhealthyServices.map(s => s.service).join(', ');
      this.logger.warn(`⚠️ Serviços ainda não saudáveis: ${unhealthyNames}`);
      
      await this.delay(attempt, config);
      attempt++;
    }
  }

  /**
   * Executa um health check único (sem retry)
   * Útil para endpoints de health check da aplicação
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: HealthCheckResult[];
    timestamp: Date;
  }> {
    const services = await this.checkAllServices();
    const allHealthy = services.every(s => s.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      services,
      timestamp: new Date()
    };
  }
}