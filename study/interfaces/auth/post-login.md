# 登录接口学习笔记

## 1. 接口用途

- 登录接口用于校验用户邮箱和密码，并在校验通过后返回一组 JWT 令牌。
- 当前项目的登录成功后会直接返回 `accessToken`、`refreshToken`、当前用户信息以及该用户可访问的前端项目列表。

## 2. 基本信息

- 路由：`POST /api/auth/login`
- 请求方法：`POST`
- 控制器入口：`src/modules/auth/auth.controller.ts` 中的 `login`
- Service 入口：`src/modules/auth/auth.service.ts` 中的 `login`

## 3. 请求链路

- 请求先进入 `AuthController.login`。
- `LoginDto` 负责做邮箱和密码的基础格式校验。
- `AuthService.login` 先调用 `UsersService.findByEmailWithSecrets` 查询用户与哈希密码。
- 之后使用 `bcrypt.compare` 校验明文密码与数据库中的哈希密码。
- 校验通过后，会进入统一的 `buildAuthPayload` 流程生成 token、持久化 refresh token 哈希，并组装响应数据。

## 4. DTO 与参数校验知识点

- `LoginDto` 使用了 `class-validator`：
  - `@IsEmail()` 保证邮箱格式正确。
  - `@MinLength(8)` 保证密码至少满足基础长度要求。
- 这些校验最终依赖全局 `ValidationPipe` 生效，因此控制器层不需要重复手写参数判断。

## 5. 鉴权与权限知识点

- 登录接口使用了 `@Public()`，表示它不需要先携带 access token。
- 登录接口本身不走 `@Roles()` 和 `@ProjectScope()`，因为它属于认证入口，不属于具体业务项目模块。
- 登录成功后，系统会根据用户角色动态返回可访问的前端项目列表，这一步由 `ProjectsRegistryService` 完成。

## 6. 数据层知识点

- 登录接口会读取 `users` 表中的 `email`、`password`、`role`、`refreshTokenHash` 等字段。
- 密码校验时不会把数据库中的哈希密码返回给前端。
- refresh token 不会明文存库，而是通过 `bcrypt.hash` 处理后写入 `refreshTokenHash` 字段。

## 7. 响应与异常处理知识点

- 控制器实际返回的是认证业务数据，真正的统一响应格式由全局 `TransformResponseInterceptor` 包装。
- 如果邮箱不存在或密码错误，`AuthService` 会抛出 `AuthenticationException`。
- 全局异常过滤器会把异常统一整理为标准 JSON 响应，并附带 `errorCode`、`requestId` 等字段。

## 8. Swagger 与调试方式

- 可在 `/api/docs` 中直接调试该接口。
- 推荐先使用 `seed` 写入的管理员账号验证登录链路是否通畅。

## 9. 本接口值得学习的后端设计点

- 登录接口不直接暴露数据库字段，而是通过 DTO 与 Entity 控制输出。
- 密码比较采用哈希校验，而不是明文比对。
- token 签发与响应组装被收敛到统一方法里，避免登录与刷新逻辑重复。
- 登录结果里包含可访问项目列表，适合多前端项目共用一套认证底座的场景。
