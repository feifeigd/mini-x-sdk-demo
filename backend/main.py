from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Mini X SDK Demo Backend")

# CORS 配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HelloResponse(BaseModel):
    message: str
    version: str


class Item(BaseModel):
    id: int
    name: str
    description: str | None = None


# 模拟数据库
fake_db: list[Item] = [
    Item(id=1, name="Item 1", description="First item"),
    Item(id=2, name="Item 2", description="Second item"),
]


@app.get("/", response_model=HelloResponse, tags=["Root"])
def read_root() -> HelloResponse:
    """根路径 - 返回服务信息"""
    return HelloResponse(
        message="Welcome to Mini X SDK Demo API",
        version="1.0.0",
    )


@app.get("/api/items", response_model=list[Item], tags=["Items"])
def get_items() -> list[Item]:
    """获取所有项目列表"""
    return fake_db


@app.get("/api/items/{item_id}", response_model=Item, tags=["Items"])
def get_item(item_id: int) -> Item:
    """根据 ID 获取单个项目"""
    for item in fake_db:
        if item.id == item_id:
            return item
    # 实际项目中应抛出 HTTPException，这里为了简化示例
    return Item(id=0, name="Not Found", description="Item not found")


@app.post("/api/items", response_model=Item, tags=["Items"])
def create_item(item: Item) -> Item:
    """创建新项目"""
    fake_db.append(item)
    return item


@app.get("/api/health", tags=["Health"])
def health_check() -> dict:
    """健康检查接口"""
    return {"status": "ok", "service": "mini-x-sdk-demo-backend"}
