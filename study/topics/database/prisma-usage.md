# Prisma 使用学习笔记

## 1. Prisma 是什么

- Prisma 是一个 TypeScript 友好的 ORM。
- 它在这个项目里的作用不是“自动帮你做一切”，而是负责三件核心事：
  - 用 `schema.prisma` 定义数据模型
  - 通过 migration 管理数据库结构变更
  - 生成 `PrismaClient`，让业务层用类型安全的方式访问数据库

## 2. 当前项目里 Prisma 的落点

### 目录与文件

- `prisma/schema.prisma`
  当前项目的数据模型单一事实来源。
- `prisma/migrations/*`
  数据库结构演进记录。
- `prisma/seed.ts`
  初始化管理员账号。
- `src/providers/prisma/prisma.service.ts`
  Nest 中真正注入使用的 Prisma 客户端。
- `src/providers/prisma/prisma.module.ts`
  把 Prisma 作为全局模块暴露给业务层。
- `scripts/run-with-env.mjs`
  保证 Prisma CLI 命令能读取 `.env` / `.env.development`。

### package.json 中的 Prisma 命令

- `pnpm prisma:generate`
  生成 Prisma Client。
- `pnpm prisma:migrate`
  开发阶段创建迁移。
- `pnpm prisma:deploy`
  按已有迁移同步数据库。
- `pnpm prisma:seed`
  执行种子数据初始化。

## 3. schema.prisma 怎么看

当前项目的 `schema.prisma` 很典型：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### generator

- `generator client` 表示要生成 Prisma Client。
- `provider = "prisma-client-js"` 表示生成 Node.js / TypeScript 里可直接 import 的客户端。

### datasource

- `provider = "mysql"` 说明当前项目数据库类型是 MySQL。
- `url = env("DATABASE_URL")` 表示 Prisma 连接串来自环境变量，而不是硬编码。

这也是为什么项目里数据库切换主要靠 `.env.development` 里的 `DATABASE_URL`。

## 4. 当前模型设计怎么理解

当前项目只有一个核心模型 `User`：

```prisma
enum UserRole {
  ADMIN
  USER
}

model User {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  password         String
  role             UserRole  @default(USER)
  refreshTokenHash String?   @map("refresh_token_hash")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

### 这几个关键点要记住

- `@id`
  主键。
- `@default(autoincrement())`
  自增主键。
- `@unique`
  唯一约束，例如邮箱不能重复。
- `@default(USER)`
  枚举字段默认值。
- `String?`
  可空字段。
- `@updatedAt`
  每次更新自动刷新时间。
- `@map("refresh_token_hash")`
  Prisma 字段名和数据库列名分离。
- `@@map("users")`
  Prisma 模型名是 `User`，真实表名是 `users`。

### 为什么要用 @map / @@map

- 代码层通常喜欢 camelCase，例如 `refreshTokenHash`
- 数据库层通常更偏 snake_case，例如 `refresh_token_hash`
- 通过 `@map` 可以两边都保持各自习惯，不需要互相妥协

## 5. Prisma Client 在 Nest 里怎么接

当前项目不是在每个 Service 里 `new PrismaClient()`，而是统一通过 `PrismaService` 注入：

```ts
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy
```

### 这样做的好处

- 只有一个统一的数据库客户端入口
- 可以和 Nest 生命周期集成
- 可以集中处理连接策略、日志和环境配置

### 当前项目里的关键实现点

- 连接串来自 `ConfigService`
- `onModuleInit()` 里按 `DATABASE_EAGER_CONNECT` 决定是否启动时立刻连库
- `onModuleDestroy()` 中统一断开连接

### 为什么有 DATABASE_EAGER_CONNECT

- 本地开发时，如果数据库还没起，服务也许仍然想先启动其他模块
- 生产环境一般希望启动时就连库失败并尽早暴露问题
- 所以这个开关本质上是在控制“启动阶段是否强连接数据库”

## 6. 业务层应该怎么使用 Prisma

当前项目的约定是：

- 控制器不要直接查 Prisma
- Prisma 查询集中在 Service 层
- 用户相关查询主要由 `UsersService` 负责

例如当前项目里已经有这些模式：

### 6.1 单条查询

```ts
await this.prismaService.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    password: true,
    role: true,
  },
});
```

要点：

- `findUnique` 适合查唯一键
- `select` 很重要，不要无脑整行取出
- 只查当前业务真正需要的字段

### 6.2 创建数据

```ts
await this.prismaService.user.create({
  data: {
    email,
    password: passwordHash,
    role: UserRole.USER,
  },
});
```

要点：

- Prisma 只负责持久化，不负责业务规则
- 密码哈希、角色限制、唯一性判断这些业务逻辑仍然应该放在 Service 层

### 6.3 更新数据

```ts
await this.prismaService.user.update({
  where: { id: userId },
  data: { refreshTokenHash },
});
```

适合已知目标唯一存在的情况。

### 6.4 事务

```ts
const [users, total] = await this.prismaService.$transaction([
  this.prismaService.user.findMany(...),
  this.prismaService.user.count(),
]);
```

这个项目已经用了最常见的事务场景：列表查询和总数统计一起取，避免两次查询之间数据发生明显漂移。

## 7. 为什么要显式 select，而不是直接返回 Prisma 查询结果

这是这个项目里非常值得记住的一点。

### 原因

- Prisma 查询结果可能带敏感字段
- 直接把整个对象返回给前端很容易泄露密码、refresh token hash 等信息

当前项目里就真实踩过这个坑：

- 登录时因为 `toUserEntity()` 直接复制了带敏感字段的对象
- 导致响应里泄露了 `password` 和 `refreshTokenHash`

后来修复方式是：

- `toUserEntity()` 显式白名单映射
- 只暴露 `id / email / role / createdAt / updatedAt`

### 结论

- Prisma 返回什么，不代表接口就应该返回什么
- 一定要经过 DTO / Entity / 显式映射层

## 8. Migration 的正确理解

Prisma migration 不是“自动同步数据库”的黑盒，而是：

- 你先改 `schema.prisma`
- Prisma 生成结构变更脚本
- 这些脚本被提交到仓库
- 别的环境通过这些脚本按顺序执行变更

### 当前项目的开发流程

1. 修改 `prisma/schema.prisma`
2. 执行：

```bash
pnpm prisma:migrate
```

3. 生成新的 migration
4. 执行：

```bash
pnpm prisma:generate
```

5. 同步检查：
  - `seed.ts`
  - Service 中的 select / create / update 字段
  - DTO / Entity

### 生产或已存在迁移的环境

使用：

```bash
pnpm prisma:deploy
```

它会执行已有迁移，而不是让你在生产环境临时生成迁移。

## 9. Seed 在当前项目里怎么用

当前 `prisma/seed.ts` 会：

- 读取 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`
- 哈希密码
- 用 `upsert` 初始化管理员账号

### 为什么用 upsert

- 已存在就更新
- 不存在就创建
- 适合初始化默认管理员这种“希望幂等执行”的场景

### 当前 seed 的学习点

- 种子脚本不是只在第一次建库用
- 它应该支持重复执行
- 初始化账号这类数据，最适合用 `upsert`

## 10. 环境变量和 Prisma CLI 的真实坑点

这个项目里有一个很实战的坑：

- Nest 启动时会自动读 `.env.development`
- 但 Prisma CLI 默认并不会自动按 Nest 的规则读这个文件

所以项目里专门加了 `scripts/run-with-env.mjs`，让这些命令：

- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:deploy`
- `pnpm prisma:seed`

都先加载 `.env` 和 `.env.{NODE_ENV}` 再执行 Prisma 命令。

### 这说明什么

- 框架运行时配置和 CLI 工具配置经常不是同一套逻辑
- 真正做项目时，要主动把这些“环境加载规则”统一起来

## 11. pnpm 与 Prisma 的另一个坑

这个项目还处理过一个 `pnpm 10` 相关问题：

- `pnpm install` 后，Prisma 的 build scripts 可能被跳过
- 结果就是 `@prisma/client` 类型不完整，编译时报 `PrismaClient`、`UserRole` 等导出不存在

所以当前 `package.json` 里有：

```json
"pnpm": {
  "onlyBuiltDependencies": [
    "@prisma/client",
    "@prisma/engines",
    "prisma"
  ]
}
```

### 这类问题的本质

- Prisma 不只是一个普通 npm 包
- 它有生成步骤、引擎、类型产物和环境依赖
- 包管理器策略变化时，最容易影响 Prisma 这种“安装后还要生成内容”的工具链

## 12. 新增模型时，应该按什么步骤做

假设未来要新增一个 `Article` 模型，推荐流程是：

1. 在 `prisma/schema.prisma` 中新增模型和关系
2. 执行 `pnpm prisma:migrate`
3. 执行 `pnpm prisma:generate`
4. 按需要更新 `seed.ts`
5. 新增对应模块的 DTO / Entity / Service
6. 在 Service 中用 Prisma 写查询和写入逻辑
7. 不要把 Prisma 查询结果直接返回给前端
8. 如果新增了接口，记得同步补 `study/` 学习资料

## 13. 当前项目中使用 Prisma 的实践原则

- 查询字段要最小化，优先 `select`
- 敏感字段绝不直接透传
- Prisma 只负责数据访问，业务规则放在 Service
- 控制器不直接写 Prisma
- 模型变更必须联动 migration、seed、DTO、Entity、Service
- 本地命令要通过统一环境加载脚本执行
- 列表 + 统计这类需要一致性的读取，可优先考虑 `$transaction`

## 14. 常见错误与排查思路

### 14.1 `Environment variable not found: DATABASE_URL`

说明 Prisma CLI 没读到环境变量。

优先检查：

- 是否通过 `pnpm prisma:*` 命令执行
- `.env.development` 是否存在
- `scripts/run-with-env.mjs` 是否正常加载

### 14.2 `User xxx was denied access on the database`

说明数据库账号权限不足。

优先检查：

- `DATABASE_URL` 中的库名是否正确
- MySQL 用户是否对该库有权限
- host 是否匹配 `127.0.0.1` / `localhost`

### 14.3 `Module '@prisma/client' has no exported member`

通常说明 Prisma Client 没正确生成或安装后脚本没跑。

优先检查：

- 是否执行过 `pnpm prisma:generate`
- `pnpm.onlyBuiltDependencies` 是否配置好了

### 14.4 返回值里带出敏感字段

说明响应层没有和 Prisma 查询结果做隔离。

优先检查：

- 是否直接把 Prisma 查询对象返回给前端
- `Entity` 或映射函数是否做了白名单字段筛选

## 15. 这份 Prisma 知识里最值得记住的几点

- Prisma 不只是“查数据库”，它是一整套模型、迁移、生成客户端的工作流。
- `schema.prisma` 是模型真相源，但 migration 才是数据库演进记录。
- 在 Nest 项目里应通过 `PrismaService` 统一注入，不要到处 `new PrismaClient()`。
- `select` 和白名单映射是避免敏感字段泄露的关键。
- Prisma CLI 的环境变量加载和应用运行时环境不是一回事，真实项目里必须统一处理。
