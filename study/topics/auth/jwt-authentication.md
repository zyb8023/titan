# JWT 鉴权学习笔记

## 1. 什么是 JWT

- JWT 是一种自包含的令牌格式，服务端签发后，客户端在后续请求中携带它来证明身份。
- 这个项目里 JWT 分成两类：
  - `accessToken`：用于访问受保护接口，生命周期较短。
  - `refreshToken`：用于刷新 access token，生命周期较长。

## 2. 为什么要做双 Token

- 只使用一个长效 token，泄露后的风险很高。
- 只使用一个短效 token，用户体验会很差，需要频繁重新登录。
- 因此常见做法是：
  - access token 短期有效，降低泄露风险
  - refresh token 长期有效，用来续期 access token

## 3. 当前项目里的 JWT 结构

- JWT 载荷定义在 `src/common/interfaces/jwt-payload.interface.ts`。
- 当前载荷包含：
  - `sub`：用户 ID
  - `email`
  - `role`
  - `tokenType`
- `tokenType` 很关键，因为它能明确区分这是 access token 还是 refresh token，避免拿错令牌还能通过校验。

## 4. Token 在当前项目中的流转

### 登录 / 注册

- 登录或注册成功后，`AuthService` 会签发一对 token。
- `refreshToken` 不会明文保存，而是哈希后写进数据库。

### 访问受保护接口

- 前端把 access token 放到 `Authorization: Bearer <token>`。
- `JwtAuthGuard` 会拦截请求并触发 `JwtStrategy` 验证。
- 验证通过后，用户信息会挂到 `request.user` 上，控制器可通过 `@CurrentUser()` 获取。

### 刷新 token

- 当前项目的 `/auth/refresh` 使用 `RefreshTokenGuard` + `RefreshTokenStrategy`。
- 这个链路会校验：
  - refresh token 是否存在
  - token 类型是否为 `refresh`
  - 数据库中的 refresh token 哈希是否匹配

### 退出登录

- `/auth/logout` 会清空数据库里的 `refreshTokenHash`。
- 这样旧的 refresh token 即使还没过期，也无法再用于刷新。

## 5. Guard、Strategy、Decorator 各自负责什么

### Strategy

- `JwtStrategy`：负责校验 access token。
- `RefreshTokenStrategy`：负责校验 refresh token。
- Strategy 解决的是“这个 token 合不合法”。

### Guard

- `JwtAuthGuard`：默认保护所有非 `@Public()` 接口。
- `RefreshTokenGuard`：保护刷新接口。
- `RolesGuard`：补充角色维度的权限判断。
- `ProjectAccessGuard`：补充项目维度的权限判断。
- Guard 解决的是“这个请求能不能继续往下走”。

### Decorator

- `@Public()`：标记无需登录的接口。
- `@Roles()`：标记角色权限要求。
- `@ProjectScope()`：标记项目作用域要求。
- `@CurrentUser()`：从请求上下文中提取登录用户。

## 6. 为什么 refresh token 要存哈希

- 如果数据库泄露，明文 refresh token 会被直接拿去续期 access token。
- 把 refresh token 哈希后存库，相当于把它当成“长期凭证”的密码处理。
- 这样即使数据库泄露，攻击者也不能直接复用 refresh token。

## 7. JWT 方案的优点与边界

### 优点

- 服务端无状态，适合横向扩展。
- 前后端分离场景中使用简单。
- 载荷里可携带必要的身份信息，例如用户 ID、角色、token 类型。

### 边界

- JWT 不是“拿来就安全”，过期策略、签名密钥、refresh token 存储方式都很关键。
- access token 一旦签发，通常不能像 session 那样实时失效，因此短有效期很重要。
- 如果系统需要更细粒度的即时失效控制，往往还要配合黑名单、版本号或设备会话管理。

## 8. 当前项目里最值得记住的设计点

- 通过 `tokenType` 区分 access / refresh，是这套 JWT 设计的关键安全点。
- 通过 `JwtStrategy` 和 `RefreshTokenStrategy` 分治不同令牌类型，可以让职责更清晰。
- 通过 `JwtAuthGuard + RolesGuard + ProjectAccessGuard` 叠加，实现了“登录态 + 角色 + 项目作用域”的多层权限模型。
- 登录、注册、刷新统一复用 `AuthService` 中的 token 签发逻辑，减少了行为漂移风险。
