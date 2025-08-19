import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService } from './health-check.service';

/**
 * Controller para endpoints de health check
 */
@ApiTags('Health Check')
@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * Endpoint para verificar a saúde de todos os serviços
   */
  @Get()
  @ApiOperation({ 
    summary: 'Verifica a saúde de todos os serviços',
    description: 'Retorna o status de conectividade com Redis, PostgreSQL, Prometheus e Loki'
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos serviços',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy'],
          description: 'Status geral da aplicação'
        },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string', description: 'Nome do serviço' },
              status: { type: 'string', enum: ['healthy', 'unhealthy'] },
              message: { type: 'string', description: 'Mensagem detalhada' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getHealth() {
    return await this.healthCheckService.performHealthCheck();
  }

  /**
   * Endpoint para verificar se a aplicação está pronta (readiness probe)
   */
  @Get('ready')
  @ApiOperation({
    summary: 'Verifica se a aplicação está pronta',
    description: 'Endpoint para readiness probe - verifica se todos os serviços estão funcionais'
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação está pronta'
  })
  @ApiResponse({
    status: 503,
    description: 'Aplicação não está pronta'
  })
  async getReadiness() {
    const health = await this.healthCheckService.performHealthCheck();
    
    if (health.status === 'healthy') {
      return { status: 'ready', message: 'Application is ready' };
    } else {
      const unhealthyServices = health.services
        .filter(s => s.status === 'unhealthy')
        .map(s => s.service);
      
      throw new Error(`Application not ready. Unhealthy services: ${unhealthyServices.join(', ')}`);
    }
  }

  /**
   * Endpoint para verificar se a aplicação está viva (liveness probe)
   */
  @Get('live')
  @ApiOperation({
    summary: 'Verifica se a aplicação está viva',
    description: 'Endpoint para liveness probe - verifica se a aplicação está respondendo'
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação está viva'
  })
  async getLiveness() {
    return { 
      status: 'alive', 
      message: 'Application is alive',
      timestamp: new Date(),
      uptime: process.uptime()
    };
  }
}