# TaskPlatform

TaskPlatform é um projeto backend de uma API REST para uma plataforma de tarefas. Utilizo diversas tecnologias novas do mercado alem de utilizar clean architcture.

### Tecnologias de Desenvolvimento

- NodeJS (Typescript)
- NestJS
- Docker

### Banco de Dados
- SQLite
- InMemory (for jest)

### Obeservabilidade
- Sentry

### Documentação
- Swagger
- Jeager

## Como usar

1. Baixe o arquivo de imagem

2. Faça o load da imagem  
```bash
docker load -i TaskPlatform.tar
```

3. Execute o container
```bash
docker run -d -p 8080:80 task_platform
```

Para acessar a documentação: http://127.0.0.1:3000/api-docs/v1

Para acessar o sentry: http://127.0.0.1:3000/sentry/v1