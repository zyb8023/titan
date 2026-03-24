# Titan Base 技术文档

## 1. 这是什么项目

`titan-base` 是一个基于 NestJS 10 + Prisma + MySQL + Redis 的后端基座项目。

你可以把它理解成一个“通用后端底盘”：

- 提供统一的用户认证能力
- 提供统一的用户管理能力
- 提供统一的前端项目接入能力
- 提供统一的日志、缓存、Swagger、异常处理、响应格式

当前项目已经内置了两个前端项目接入示例：

- `admin-console`：管理后台
- `user-portal`：用户门户

## 2. 适合谁看这份文档

这份文档是按后端初学者视角写的，目标是让你看完后能回答下面几个问题：

- 这个项目是怎么启动的
- 请求是怎么一步一步处理的
- 目录应该怎么读
- 新功能应该加到哪里
- 环境变量应该怎么配
- 开发、测试、生产环境应该怎么部署

## 3. 技术栈

- Node.js
- TypeScript
- NestJS 10
- Prisma 5
- MySQL 8
- Redis 7
- JWT
- Swagger
- Log4js

## 4. 项目目录怎么理解

```text
titan-base
├── src
│   ├── common              # 通用能力：守卫、过滤器、拦截器、装饰器、异常
│   ├── modules             # 业务模块
│   │   ├── auth            # 登录、刷新 token、退出登录
│   │   ├── users           # 用户管理
│   │   └── projects        # 前端项目注册中心与项目接口
│   ├── providers           # 基础设施：配置、日志、缓存、Prisma、Swagger
│   ├── app.module.ts       # 根模块
│   └── main.ts             # 应用启动入口
├── prisma
│   ├── schema.prisma       # 数据库模型
│   ├── migrations          # 数据库迁移
│   └── seed.ts             # 初始化管理员账号
├── scripts
│   └── run-with-env.mjs    # 运行 Prisma 命令时自动加载环境变量
├── .env.example            # 环境变量示例
├── .env.development        # 开发环境配置
├── .env.production         # 生产环境配置
└── docker-compose.yml      # 本地 MySQL / Redis 依赖
```

## 5. 项目架构图

```mermaid
flowchart TD
    A["客户端 / 前端"] --> B["NestJS Controller"]
    B --> C["Guard 守卫层"]
    C --> D["Service 业务层"]
    D --> E["Prisma 数据访问"]
    E --> F["MySQL"]

    B --> G["Interceptor 响应拦截器"]
    B --> H["Exception Filter 异常过滤器"]
    B --> I["Request Context 请求上下文"]
    D --> J["Cache 缓存层"]
    J --> K["Redis"]
    B --> L["Logger 日志层"]
```

## 6. 一次请求是怎么走的

以 `POST /api/auth/login` 为例：

1. 请求进入 NestJS 应用。
2. `RequestContextMiddleware` 为这次请求生成 `requestId`，并记录基础上下文。
3. 如果接口不是公开接口，会先经过全局守卫：
   - `JwtAuthGuard`：校验 access token
   - `RolesGuard`：校验角色
   - `ProjectAccessGuard`：校验当前账号是否能访问这个前端项目
4. Controller 接收参数，`ValidationPipe` 自动校验 DTO。
5. Service 执行业务逻辑。
6. 如果过程中抛出异常，`AllExceptionsFilter` 统一包装错误响应。
7. 如果执行成功，`TransformResponseInterceptor` 统一包装成功响应。
8. 请求结束后，记录 access log。

## 7. 核心模块说明

### 7.1 `main.ts`

启动应用时主要做了这几件事：

- 创建 Nest 应用
- 打开 CORS
- 设置全局路由前缀
- 注册全局参数校验
- 注册 Swagger
- 启动 HTTP 服务

### 7.2 `app.module.ts`

这是项目的根模块，负责把全局能力挂起来：

- 全局异常过滤器
- 全局响应拦截器
- 全局鉴权守卫
- 全局角色守卫
- 全局项目访问守卫
- 全局请求上下文中间件

### 7.3 `providers`

这一层是“基础设施层”，主要解决通用问题：

- `config`：加载环境变量
- `prisma`：连接数据库
- `cache`：连接 Redis 或使用内存缓存
- `logger`：输出应用日志、错误日志、访问日志
- `swagger`：生成接口文档
- `request-context`：保存本次请求的 `requestId`、项目编码等上下文

### 7.4 `modules/auth`

负责认证相关逻辑：

- 登录
- 刷新 token
- 退出登录
- JWT 解析

这里的设计重点是：

- access token 和 refresh token 分开
- refresh token 只保存哈希，不保存明文
- 登录成功后，返回当前用户可访问的前端项目列表

### 7.5 `modules/users`

负责用户相关能力：

- 创建用户
- 查询当前用户
- 查询用户列表

当前数据库里最核心的业务实体就是 `User`。

### 7.6 `modules/projects`

这个模块不是普通业务模块，而是“前端项目接入层”。

它主要做三件事：

- 注册系统里有哪些前端项目
- 定义每个前端项目可访问的能力
- 结合角色控制当前用户能访问哪些项目

当前注册的前端项目有：

- `admin-console`
- `user-portal`

## 8. 数据库设计

当前 Prisma 模型比较简单，核心只有一张 `users` 表。

```prisma
model User {
  id               Int
  email            String
  password         String
  role             UserRole
  refreshTokenHash String?
  createdAt        DateTime
  updatedAt        DateTime
}
```

字段含义：

- `email`：登录账号
- `password`：密码哈希
- `role`：角色，当前有 `ADMIN` 和 `USER`
- `refreshTokenHash`：refresh token 的哈希值

## 9. 统一响应格式

### 9.1 成功响应

项目所有成功响应都会被统一包装成：

```json
{
  "code": 200,
  "data": {},
  "message": "success",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1711180800000
}
```

### 9.2 失败响应

项目所有失败响应都会被统一包装成：

```json
{
  "code": 401,
  "data": null,
  "message": "Refresh Token 无效",
  "errorCode": "AUTH_INVALID_REFRESH_TOKEN",
  "errors": [],
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1711180800000,
  "path": "/api/auth/refresh"
}
```

说明：

- `code`：HTTP 状态码
- `errorCode`：业务错误码，前端应优先依赖它做判断
- `requestId`：用于排查日志

## 10. 异常处理怎么理解

项目现在已经有一套统一异常体系：

- 业务异常基类：`AppException`
- 常见异常子类：
  - `AuthenticationException`
  - `AuthorizationException`
  - `ConflictBusinessException`
  - `ResourceNotFoundException`
- 全局出口：`AllExceptionsFilter`

你可以这样理解：

- 业务层负责“抛出有意义的异常”
- 全局 filter 负责“把异常变成统一的 HTTP 响应”

这比“到处直接 `throw new UnauthorizedException(...)`”更容易维护。

## 11. 日志怎么理解

日志分三类：

- 应用日志
- 错误日志
- 访问日志

每条日志都会尽量带上：

- `requestId`
- `projectCode`
- `path`
- `method`
- `status`

访问日志还会带：

- `duration`
- `userId`
- `ip`
- `userAgent`
- `referer`
- `contentLength`

你排查问题时，最重要的是先拿到 `requestId`，再去日志里搜。

## 12. 本地开发环境配置

### 12.1 前置要求

- Node.js 20 及以上
- pnpm 10
- Docker / Docker Compose

### 12.2 第一次启动

1. 安装依赖

```bash
pnpm install
```

2. 启动 MySQL 和 Redis

```bash
docker-compose up -d
```

3. 生成 Prisma Client

```bash
pnpm prisma:generate
```

4. 执行数据库迁移

```bash
pnpm prisma:migrate
```

5. 初始化管理员账号

```bash
pnpm prisma:seed
```

6. 启动开发服务

```bash
pnpm start:dev
```

### 12.3 启动后访问地址

- 应用地址：[http://localhost:3000](http://localhost:3000)
- 健康检查：[http://localhost:3000/api/health](http://localhost:3000/api/health)
- Swagger 文档：[http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## 13. 环境变量说明

### 13.1 环境文件加载规则

项目启动时会优先加载：

1. `.env.${NODE_ENV}`
2. `.env`

比如：

- `NODE_ENV=development` 时优先加载 `.env.development`
- `NODE_ENV=production` 时优先加载 `.env.production`

### 13.2 核心环境变量

| 变量名 | 作用 | 开发环境示例 |
| --- | --- | --- |
| `NODE_ENV` | 运行环境 | `development` |
| `APP_NAME` | 服务名 | `titan-base` |
| `PORT` | 端口 | `3000` |
| `API_PREFIX` | 接口前缀 | `api` |
| `DATABASE_URL` | MySQL 连接串 | `mysql://titan:titan123@127.0.0.1:3306/titan` |
| `DATABASE_EAGER_CONNECT` | 是否启动时立即连库 | `true` |
| `JWT_ACCESS_SECRET` | access token 密钥 | `dev-access-secret` |
| `JWT_REFRESH_SECRET` | refresh token 密钥 | `dev-refresh-secret` |
| `SWAGGER_ENABLED` | 是否开启 Swagger | `true` |
| `LOG_LEVEL` | 日志级别 | `debug` |
| `CACHE_ENABLED` | 是否启用缓存 | `true` |
| `CACHE_DRIVER` | 缓存驱动 | `redis` |
| `REDIS_HOST` | Redis 主机 | `127.0.0.1` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | `redis123` |
| `ADMIN_EMAIL` | seed 创建的管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | seed 创建的管理员密码 | `ChangeMe123!` |

### 13.3 初学者最容易踩的坑

1. MySQL 数据库名必须和 `docker-compose.yml` 保持一致。当前应该使用 `titan`。
2. 如果你使用 `docker-compose` 启动 Redis，本地开发密码应该是 `redis123`。
3. 生产环境一定要替换 JWT 密钥，不能直接用示例值。

## 14. 常用命令

```bash
pnpm start:dev      # 开发模式启动
pnpm build          # 构建
pnpm start          # 运行 dist/main.js
pnpm lint           # 代码检查
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm prisma:seed
```

## 15. 开发指引

### 15.1 新增一个普通业务接口时怎么做

建议顺序：

1. 先想清楚这个接口属于哪个模块。
2. 先写 DTO，明确入参。
3. 在 Controller 定义路由。
4. 在 Service 写业务逻辑。
5. 如果要访问数据库，优先放在对应 Service 中统一处理。
6. 给接口补上 Swagger 注解。
7. 如果接口需要登录，默认会走全局鉴权。
8. 如果接口只允许管理员访问，补 `@Roles(UserRole.ADMIN)`。
9. 如果接口属于某个前端项目，补 `@ProjectScope('xxx')`。

### 15.2 新增一个前端项目时怎么做

至少要改这些地方：

1. 在 `src/modules/projects/projects.registry.ts` 里注册项目。
2. 新建这个项目自己的 module / controller / service。
3. 在 `ProjectsModule` 里把这个模块引入进来。
4. 在 controller 上标记 `@ProjectScope('项目编码')`。

### 15.3 什么时候该改 `common`

只有当一个能力会被多个模块复用时，才应该放进 `common`。

例如：

- 通用异常
- 通用守卫
- 通用装饰器
- 通用响应格式

不要一开始就把所有东西都抽成 `common`，否则会越来越难读。

## 16. 多环境部署说明

### 16.1 当前项目支持哪些环境

当前代码里正式支持这三个环境值：

- `development`
- `test`
- `production`

说明：

- 目前没有专门的 `staging` 配置
- 如果以后要加 `staging`，需要同步修改环境变量校验逻辑

### 16.2 开发环境

用途：

- 本地开发
- 调试接口
- 看 Swagger

建议配置：

- `NODE_ENV=development`
- `SWAGGER_ENABLED=true`
- `LOG_LEVEL=debug`
- 使用本地 MySQL / Redis

### 16.3 测试环境

用途：

- 接口联调
- 自测
- 回归测试

建议配置：

- `NODE_ENV=test`
- 使用独立数据库和 Redis
- 可以保留 Swagger
- 日志级别建议 `info`

注意：

- 测试环境不要和开发环境共用数据库

### 16.4 生产环境

用途：

- 正式对外服务

建议配置：

- `NODE_ENV=production`
- `SWAGGER_ENABLED=false`
- 使用正式 MySQL 和 Redis
- 替换所有密钥
- 日志目录和磁盘容量要提前规划

### 16.5 生产部署步骤

当前仓库没有 Dockerfile，也没有 Kubernetes 配置。

所以这里先按“Node.js 进程部署”的方式说明。这个方案最容易理解，也最适合初学者先落地。

#### 步骤 1：准备服务器

- 安装 Node.js
- 安装 pnpm
- 安装 MySQL / Redis，或者使用独立数据库服务

#### 步骤 2：上传代码并安装依赖

```bash
pnpm install --frozen-lockfile
```

#### 步骤 3：准备生产环境变量

至少确认这些值已替换：

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_PASSWORD`
- `ADMIN_PASSWORD`

#### 步骤 4：构建

```bash
pnpm build
```

#### 步骤 5：执行 Prisma 部署迁移

```bash
NODE_ENV=production pnpm prisma:deploy
```

#### 步骤 6：首次初始化管理员账号

```bash
NODE_ENV=production pnpm prisma:seed
```

#### 步骤 7：启动服务

```bash
NODE_ENV=production pnpm start
```

建议：

- 生产环境不要直接用前台命令保活
- 建议用 `systemd`、`pm2` 或容器编排工具托管进程

### 16.6 推荐的多环境策略

对于当前项目，最简单可用的策略是：

- 开发环境：本机 + `docker-compose`
- 测试环境：独立服务器或独立容器
- 生产环境：独立服务器或容器平台

重要原则：

- 每个环境用自己的数据库
- 每个环境用自己的 Redis
- 每个环境用自己的 JWT 密钥
- 生产环境关闭 Swagger

## 17. 常见排障

### 问题 1：服务启动时报数据库连接错误

先检查：

- MySQL 是否启动
- `DATABASE_URL` 是否正确
- 数据库名是否是 `titan`

### 问题 2：Redis 连接失败

先检查：

- Redis 是否启动
- `REDIS_HOST` / `REDIS_PORT` 是否正确
- 如果是本地 `docker-compose`，密码是否是 `redis123`

### 问题 3：接口返回 401

先检查：

- 是否带了 access token
- token 是否过期
- access token 和 refresh token 是否混用了

### 问题 4：接口返回 403

先检查：

- 当前用户角色是否有权限
- 当前接口是否设置了 `@ProjectScope`
- 当前账号是否能访问这个前端项目

## 18. 你后面可以继续补的文档

如果后面项目继续演进，建议再补三份文档：

1. 接口文档
2. 数据库设计文档
3. 发布与回滚文档

当前这份 README 先解决“看懂项目”和“跑起来”的问题。
