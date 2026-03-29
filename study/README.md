# Study 目录说明

## 目的

- 该目录用于沉淀“接口背后的后端知识”，不是简单重复接口文档。
- 从当前时点开始，后续每新增一个接口，都需要同步补充对应学习资料。
- 若已有接口发生行为、参数、鉴权、响应或数据模型变化，也要同步更新对应资料。

## 推荐目录结构

```text
study
├── README.md
├── topics
│   └── <主题分类>
│       └── <知识主题>.md
├── templates
│   └── interface-study-template.md
└── interfaces
    └── <模块名>
        └── <接口名>.md
```

## 命名建议

- 模块名优先与 `src/modules` 内模块语义保持一致，例如：
  - `study/interfaces/auth`
  - `study/interfaces/projects`
  - `study/interfaces/users`
- 通用知识主题可放在 `study/topics` 下，例如：
  - `study/topics/auth/jwt-authentication.md`
  - `study/topics/database/prisma-usage.md`
- 接口名建议使用“方法 + 语义”的方式，例如：
  - `post-login.md`
  - `post-refresh-token.md`
  - `get-admin-console-overview.md`

## 每篇接口学习文档至少应包含

- 接口用途
- 路由、请求方法、调用入口
- DTO 与参数校验知识点
- 鉴权、角色、项目作用域控制知识点
- Service 层处理流程
- 数据层 / Prisma / 缓存 / 事务相关知识点
- 异常处理与统一响应知识点
- Swagger 或调试方式
- 本接口最值得学习的后端设计点

## 当前约束

- 新增接口时，`study/` 文档未同步补齐，视为任务未完成。
- 若只是微调文案且不影响接口行为，可不新增文档；但只要影响参数、权限、数据流或响应结构，就要更新文档。
- 文档应以“帮助理解后端知识”为目标，避免只复制控制器代码。
