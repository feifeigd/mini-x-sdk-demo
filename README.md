# mini-x-sdk-demo

Mini X SDK Demo 是一个前后端分离的全栈示例项目，用于演示现代 Web 应用的开发架构。

## 技术栈

### 后端

- **Web 框架**: FastAPI 0.115.0
- **Python 版本**: >= 3.10
- **ASGI 服务器**: Uvicorn 0.30.6
- **数据验证**: Pydantic 2.9.2
- **包管理器**: [uv](https://github.com/astral-sh/uv)
- **代码检查**: Ruff
- **测试框架**: pytest + pytest-asyncio

### 前端

- **UI 框架**: React 19.2.1
- **开发语言**: TypeScript 5.8
- **构建工具**: Vite 7.1.2
- **包管理器**: [pnpm](https://pnpm.io)
- **代码检查**: ESLint 9.33

## 目录结构

```
mini-x-sdk-demo/
├── .vscode/                  # VSCode 配置
│   ├── launch.json          # 调试配置
│   ├── settings.json        # 编辑器设置
│   └── tasks.json           # 任务配置
├── backend/                  # 后端 (FastAPI)
│   ├── .venv/               # Python 虚拟环境 (需手动创建)
│   ├── main.py              # 后端主入口
│   └── pyproject.toml       # 项目配置与依赖
├── frontend/                 # 前端 (React + Vite)
│   ├── src/                 # 源代码
│   │   ├── App.tsx          # 主应用组件
│   │   ├── main.tsx         # 前端入口
│   │   └── ...
│   ├── package.json         # 依赖配置
│   ├── pnpm-lock.yaml       # pnpm 锁文件
│   ├── pnpm-workspace.yaml  # pnpm 配置
│   ├── vite.config.ts       # Vite 配置
│   └── tsconfig.json        # TypeScript 配置
├── .gitignore
├── README.md
└── mini-x-sdk-demo.code-workspace  # VSCode 工作区文件
```

## 环境要求

- Python >= 3.10
- Node.js >= 18
- [uv](https://github.com/astral-sh/uv) (Python 包管理器)
- [pnpm](https://pnpm.io) (前端包管理器)

## 安装与配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd mini-x-sdk-demo
```

### 2. 后端设置

后端使用 `uv` 进行依赖和虚拟环境管理。

```bash
# 进入后端目录
cd backend

# 创建虚拟环境 (自动在 backend/.venv 创建)
uv venv

# 同步依赖 (安装生产和开发依赖)
uv sync

# 返回项目根目录
cd ..
```

### 3. 前端设置

前端使用 `pnpm` 进行依赖管理。

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 返回项目根目录
cd ..
```

## 启动方式

### 方式一：分别启动（推荐开发调试）

**启动后端** (端口 8000)：

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**启动前端** (端口 5173)：

```bash
cd frontend
pnpm run dev
```

### 方式二：使用 VSCode 一键启动（推荐）

1. 使用 VSCode 打开 `mini-x-sdk-demo.code-workspace` 工作区文件
2. 按 `F5` 或在「运行和调试」面板选择 **Full Stack (Backend + Frontend)**
3. 自动启动后端和前端，并打开 Chrome 调试窗口

前端通过 Vite 代理将 `/api/*` 请求转发到 `http://localhost:8000`。

## API 文档

启动后端后，访问以下地址查看交互式 API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 接口列表

| 方法 | 路径                   | 描述                  |
| ---- | ---------------------- | --------------------- |
| GET  | `/`                    | 根路径 - 返回服务信息 |
| GET  | `/api/health`          | 健康检查              |
| GET  | `/api/items`           | 获取所有项目列表      |
| GET  | `/api/items/{item_id}` | 根据 ID 获取单个项目  |
| POST | `/api/items`           | 创建新项目            |

### 请求示例

**获取所有项目：**

```bash
curl http://localhost:8000/api/items
```

**创建新项目：**

```bash
curl -X POST http://localhost:8000/api/items \
  -H "Content-Type: application/json" \
  -d '{"id": 3, "name": "Item 3", "description": "Third item"}'
```

## VSCode 调试指南

### 调试配置

在「运行和调试」面板提供以下配置：

| 配置名称                            | 描述                                   |
| ----------------------------------- | -------------------------------------- |
| **Python: FastAPI (uv run)**        | 仅调试后端，使用 uv 虚拟环境           |
| **Frontend: React (Vite)**          | 仅调试前端，启动新 Chrome 实例         |
| **Frontend: Attach to Chrome**      | 附加到已启动的 Chrome (需开启调试端口) |
| **Full Stack (Backend + Frontend)** | 同时调试前后端（推荐）                 |

### VSCode 任务

在「终端 → 运行任务」中提供以下快捷任务：

| 任务名称                          | 描述                   |
| --------------------------------- | ---------------------- |
| Start Frontend Dev Server         | 启动前端开发服务器     |
| Start Backend (uv run, non-debug) | 启动后端（非调试模式） |
| Build Frontend                    | 构建前端生产版本       |
| uv: Sync Backend Dependencies     | 同步后端依赖           |
| uv: Create Backend Venv           | 创建后端虚拟环境       |
| uv: Install Backend Package (Add) | 添加新的 Python 包     |
| Install Frontend Dependencies     | 安装前端依赖           |

## 常用命令

### 后端 (backend/)

```bash
# 创建虚拟环境
uv venv

# 同步所有依赖
uv sync

# 添加生产依赖
uv add <package-name>

# 添加开发依赖
uv add --dev <package-name>

# 启动服务
uv run uvicorn main:app --reload

# 代码检查
uv run ruff check .

# 运行测试
uv run pytest
```

### 前端 (frontend/)

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 类型检查 + 构建生产版本
pnpm run build

# 本地预览构建产物
pnpm run preview

# 代码检查
pnpm run lint
```

## 开发说明

### CORS 配置

后端已配置 CORS 允许以下来源访问：

- `http://localhost:5173`
- `http://127.0.0.1:5173`

配置位于 [backend/main.py](backend/main.py)。

### 前端代理

Vite 开发服务器已配置代理，所有 `/api/*` 请求会被转发到后端 `http://localhost:8000`。前端代码中可以直接使用相对路径 `/api/...` 进行请求，无需关心跨域问题。

配置位于 [frontend/vite.config.ts](frontend/vite.config.ts)。
