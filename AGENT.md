# Titan Base 协作说明

## 结论

- 当前项目是一个基于 NestJS 10 的单体后端基座，核心目标是给多个前端项目提供统一的认证、用户、项目概览和基础设施能力。
- 现有业务模型比较薄，当前唯一持久化核心实体是 `User`，而 `projects` 模块承担的是“前端项目注册中心 + 路由作用域 + 权限隔离”职责。
- 请求链路和基础设施已经比较完整：全局鉴权、角色校验、项目访问控制、统一响应包装、全局异常处理、请求上下文、Swagger、Prisma、缓存、日志都已接入。
- 仓库当前没有自动化测试目录，也没有 README；`dist/` 与 `logs/` 已存在于仓库目录中，后续协作要明确区分源码与构建/运行产物。

## 项目画像

### 技术栈

- Node.js + TypeScript 5，`strict: true`
- NestJS 10
- Prisma 5 + MySQL
- JWT + Passport
- Redis / Memory Cache
- Swagger
- Log4js
- 包管理器：`pnpm@10`

### 目录结构

- `src/main.ts`
  应用入口，负责全局前缀、CORS、参数校验、Swagger、日志接入。
- `src/app.module.ts`
  根模块，挂载全局过滤器、拦截器、守卫和请求上下文中间件。
- `src/modules/auth`
  登录、刷新令牌、退出登录；令牌签发与 refresh token 持久化都在这里。
- `src/modules/users`
  用户创建、查询、实体映射；直接依赖 Prisma。
- `src/modules/projects`
  前端项目注册中心、项目概览、项目作用域控制，目前内置 `admin-console` 和 `user-portal` 两个项目。
- `src/common`
  装饰器、守卫、过滤器、拦截器、通用接口与枚举。
- `src/providers`
  配置、Prisma、缓存、日志、Swagger、请求上下文等基础设施。
- `prisma`
  数据模型、迁移、seed。
- `scripts/run-with-env.mjs`
  Prisma 命令统一通过它加载 `.env` / `.env.{NODE_ENV}`。
- `dist`
  构建产物，不作为日常改动入口。
- `logs`
  运行日志，不作为功能开发入口。

## 当前业务与架构约定

### 认证与权限

- 除 `@Public()` 标记的接口外，默认都受 `JwtAuthGuard` 保护。
- 角色控制通过 `@Roles()` + `RolesGuard` 完成。
- 项目作用域控制通过 `@ProjectScope()` + `ProjectAccessGuard` 完成。
- 若新增“面向某个前端项目”的接口，必须显式声明项目作用域，不能只靠路由前缀约定。
- `refreshToken` 只存哈希，不存明文；禁止把密码、refresh token hash 暴露到响应 DTO。

### 请求链路

- `RequestContextMiddleware` 会为每个请求写入 `requestId`、路径、方法、项目编码，并记录访问日志。
- `TransformResponseInterceptor` 会统一包装成功响应，因此控制器应直接返回业务数据，不要手动返回 `{ code, message, timestamp }`。
- `AllExceptionsFilter` 会统一输出异常结构，因此业务层优先抛 Nest 标准异常。
- 日志会自动带 `requestId` 与 `projectCode`，新增链路日志时优先复用 `AppLoggerService`。

### 项目注册机制

- `src/modules/projects/projects.registry.ts` 是当前前端项目清单的单一事实来源。
- 新增前端项目时，至少要同步检查这些位置：
  - `projects.registry.ts` 中注册项目定义
  - `ProjectsModule` 中挂载对应模块
  - 需要项目概览时复用 `ProjectsOverviewService`
  - 控制器上补 `@ProjectScope('<project-code>')`
- 健康检查接口会返回项目编码列表，因此注册中心改动会直接影响 `/health` 返回值。

### 数据层

- 当前 Prisma 只有 `User` 一张核心表，对应 `users`。
- 用户角色枚举为 `ADMIN` / `USER`，业务代码统一使用项目内 `UserRole` 枚举映射。
- 数据访问主要集中在 `UsersService`，新增用户相关查询时优先复用该服务，不要在多个模块重复直接查询 Prisma。
- 任何 Prisma 模型调整都应同时关注：
  - `prisma/schema.prisma`
  - 对应 migration
  - `prisma/seed.ts`
  - DTO / Entity / Service 选择字段

## 环境与运行

### 必要环境变量

- `APP_NAME`
- `PORT`
- `API_PREFIX`
- `DATABASE_URL`
- `DATABASE_EAGER_CONNECT`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `SWAGGER_ENABLED`
- `SWAGGER_TITLE`
- `SWAGGER_DESCRIPTION`
- `SWAGGER_VERSION`
- `LOG_LEVEL`
- `LOG_DIR`
- `CACHE_ENABLED`
- `CACHE_DRIVER`
- `CACHE_TTL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- 可选 seed 变量：`ADMIN_EMAIL`、`ADMIN_PASSWORD`

### 常用命令

- 安装依赖：`pnpm install`
- 开发启动：`pnpm start:dev`
- 构建：`pnpm build`
- 生产启动：`pnpm start`
- Lint：`pnpm lint`
- Prisma Client：`pnpm prisma:generate`
- 开发迁移：`pnpm prisma:migrate`
- 部署迁移：`pnpm prisma:deploy`
- 初始化管理员：`pnpm prisma:seed`
- 本地依赖服务：`docker-compose up -d`

## 修改代码时的硬约定

### 应该遵守

- 默认在 `src/` 与 `prisma/` 下做最小必要改动，避免碰 `dist/` 和 `logs/`。
- 保持现有 Nest 模块边界，不把控制器、服务、基础设施逻辑混在一起。
- 新增接口时，同时补齐：
  - DTO 校验
  - Swagger 标注
  - 权限装饰器
  - 必要的中文注释
- 控制器返回 DTO 对应的数据结构，统一响应包装交给全局拦截器处理。
- 复用已有公共能力：`ProjectsRegistryService`、`ProjectsOverviewService`、`UsersService`、`AppLoggerService`、`RequestContextService`。
- 修改认证逻辑时，同时检查 access token、refresh token、用户权限和项目可访问列表是否一致。
- 修改配置项时，同时更新 `configuration.ts` 和 `env.validation.ts`。

### 不应该做

- 不要手工编辑 `dist/` 产物。
- 不要绕过全局响应/异常约定，在局部接口返回不同包裹格式。
- 不要在控制器里直接写 Prisma 查询，除非当前模块没有合理复用点且范围非常小。
- 不要把项目访问权限判断散落在业务代码中，优先通过注册中心 + 守卫统一处理。
- 不要无故新增依赖、重排目录或做大范围风格清理。

## 高风险改动提示

### 认证相关

- 影响范围：`auth.service.ts`、JWT strategy、guards、用户 refresh token 字段。
- 风险点：登录后项目列表不一致、refresh 失效、登出后 token 仍可使用。
- 验证建议：至少手动验证 `login`、`refresh`、`logout` 三条链路。

### 项目注册与权限相关

- 影响范围：`projects.registry.ts`、`ProjectAccessGuard`、各项目控制器。
- 风险点：路由前缀与项目编码不一致导致越权或误拦截。
- 验证建议：分别用 `ADMIN`、`USER` 账号访问两个项目接口。

### Prisma 数据模型相关

- 影响范围：schema、migration、seed、service 查询字段、DTO 输出字段。
- 风险点：迁移与代码字段不一致、敏感字段泄露、seed 失效。
- 验证建议：执行 `pnpm prisma:generate`、必要时执行迁移和 seed。

## 验证优先级

- 首选：`pnpm lint`
- 次选：`pnpm build`
- 涉及数据库：`pnpm prisma:generate`
- 涉及认证或权限：手动验证登录、刷新、项目访问
- 涉及配置：至少验证应用可正常启动

## 待补充认知

- 当前仓库未发现自动化测试文件，默认按“待验证”处理测试覆盖情况。
- 当前工作目录未检测到 `.git` 元数据，若后续需要提交、比对或生成变更记录，应先确认真实仓库根目录。
- 当前未发现 README、接口示例或部署文档，后续若补充文档，建议优先从启动方式、环境变量和权限模型开始。
