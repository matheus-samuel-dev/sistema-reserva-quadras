# PlaySpace — Reservas de Quadras

PlaySpace é uma plataforma web full-stack para gestão de reservas de quadras esportivas, pensada como vitrine de portfólio com visual SaaS premium, tema escuro, verde neon, agenda semanal, dashboards, comunidade esportiva, pagamentos demo e autenticação por perfil.

## Stack

- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS, Recharts, Lucide Icons.
- Backend: Java, Spring Boot, Spring Security, JWT, JPA/Hibernate, Bean Validation, PostgreSQL, Swagger/OpenAPI.
- Infra: Docker, Docker Compose, PostgreSQL, Nginx.
- Testes: Vitest + Testing Library no frontend; JUnit/Spring Boot no backend.

## Funcionalidades

- Landing page premium com hero visual, estatísticas, depoimentos, quadras, campeonatos, FAQ e CTA.
- Login demo persistido por perfil.
- Admin: dashboard, agenda semanal, CRUD de quadras, reservas, pagamentos, usuários, relatórios, configurações, comunidade e status do sistema.
- Cliente: minhas reservas, nova reserva, agenda, quadras, pagamentos, perfil esportivo, estatísticas, ranking, parceiros, campeonatos e PlaySpace AI demo.
- Regras: conflito de horário, bloqueio de passado, quadra em manutenção, cancelamento com antecedência, pagamento aprovado confirma reserva.
- Gamificação: conquistas, progresso, ranking e feed da comunidade.
- Notificações inteligentes com contador, dropdown, leitura e limpeza.
- Exportação demo de PDF/CSV, busca global, tema claro/escuro e tour inicial.

## Credenciais Demo

Admin:

```text
admin@playspace.com
Admin@123
```

Cliente:

```text
cliente@playspace.com
Cliente@123
```

## Como Rodar Localmente

Backend:

```bash
cd backend
mvn test
mvn package
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Acesse:

- Frontend local: http://localhost:5173
- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Acesse:

- Frontend Docker: http://localhost:8088
- Backend Docker: http://localhost:28080 por padrão externo (`BACKEND_HOST_PORT`), mantendo `8080` dentro da rede Docker
- PostgreSQL: localhost:5433 por padrão externo (`POSTGRES_HOST_PORT`), mantendo `5432` dentro da rede Docker

## Scripts de Validação

```bash
cd frontend
npm run build
npm run test:run

cd ../backend
mvn test
mvn package
```

## Endpoints Principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/courts`
- `POST /api/courts`
- `GET /api/reservations`
- `GET /api/reservations/my`
- `POST /api/reservations`
- `PUT /api/reservations/{id}/cancel`
- `POST /api/payments/demo`
- `GET /api/dashboard/admin`
- `GET /api/dashboard/client`
- `GET /api/community/feed`
- `GET /api/reports`
- `POST /api/ai/ask`

## Estrutura

```text
.
├── backend
│   ├── src/main/java/com/playspace/api
│   │   ├── config
│   │   ├── security
│   │   ├── court
│   │   ├── reservation
│   │   ├── payment
│   │   ├── notification
│   │   ├── community
│   │   └── report
│   └── src/test/java/com/playspace/api
├── frontend
│   ├── src/components
│   ├── src/contexts
│   ├── src/features
│   ├── src/lib
│   └── src/test
└── docker-compose.yml
```

## Próximos Passos

- Conectar o frontend integralmente aos endpoints da API em vez do repositório demo local.
- Adicionar refresh token, recuperação de senha e upload real de imagens.
- Trocar exportação CSV demo por XLSX real.
- Adicionar observabilidade com métricas, tracing e logs centralizados.
- Resolver vulnerabilidades transitivas indicadas por `npm audit` sem usar `--force`.
