import asyncio
import json
import os

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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


class ChatRequest(BaseModel):
    """聊天请求入参，对应前端 useXChat onRequest 传的 message"""

    message: str


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


# ============ SSE 流式聊天接口 ============

# DeepSeek API 配置
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"


def _sse(payload: dict) -> str:
    """格式化 SSE 事件，必须用 \n（不是 \r\n），事件之间用 \n\n 分隔
    这样 @ant-design/x-sdk 的 XStream 才能正确按默认分隔符解析"""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def _deepseek_stream(prompt: str):
    """调用 DeepSeek API（OpenAI 兼容格式）流式输出"""
    if not DEEPSEEK_API_KEY:
        # 密钥缺失，fallback 到 mock 模式
        async for chunk in _mock_stream(prompt):
            yield chunk
        return

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            async with client.stream(
                "POST", DEEPSEEK_API_URL, headers=headers, json=body
            ) as response:
                if response.status_code != 200:
                    err_text = ""
                    async for chunk in response.aiter_text():
                        err_text += chunk
                    yield _sse(
                        {"content": f"[DeepSeek API 错误 {response.status_code}] {err_text[:200]}"}
                    )
                    return

                # 解析 SSE 流：每行以 "data: " 开头，结尾 [DONE] 表示结束
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[len("data:") :].strip()
                    if data == "[DONE]":
                        return
                    try:
                        chunk_json = json.loads(data)
                        delta = chunk_json.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield _sse({"content": content})
                    except (json.JSONDecodeError, IndexError, KeyError):
                        continue
    except httpx.HTTPError as e:
        yield _sse({"content": f"[网络错误] {e}"})


async def _mock_stream(prompt: str):
    """模拟 LLM 逐字流式输出。真实项目里这里调用 OpenAI / 本地模型。"""
    reply = f"你刚才说的是：{prompt}。这是一个模拟的流式回复，用于演示 antd x 的 useXChat。"
    # 按字符切，每个 chunk 间隔 30ms，模拟打字机效果
    for ch in reply:
        payload = json.dumps({"content": ch}, ensure_ascii=False)
        # 必须用 \n（不是 \r\n），事件之间用 \n\n 分隔
        # 这样 @ant-design/x-sdk 的 XStream 才能正确按默认分隔符解析
        yield f"data: {payload}\n\n"
        await asyncio.sleep(0.03)


@app.post("/api/chat", tags=["Chat"])
async def chat(req: ChatRequest):
    """
    SSE 流式聊天接口。
    - 入参：JSON body { "message": "用户输入" }
    - 返回：text/event-stream，每个事件 data 字段是 JSON 字符串 {"content": "一个字"}
    - 前端 @ant-design/x-sdk 的 XRequest 会按 SSE 解析，XStream 输出 SSEOutput 对象
    """
    return StreamingResponse(
        _mock_stream(req.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/chat/deepseek", tags=["Chat"])
async def chat_deepseek(req: ChatRequest):
    """
    SSE 流式聊天接口（DeepSeek）。
    - 入参：JSON body { "message": "用户输入" }
    - 返回：text/event-stream，每个事件 data 字段是 JSON 字符串 {"content": "..."}
    - 调用 DeepSeek API，密钥未设置时 fallback 到 mock
    """
    return StreamingResponse(
        _deepseek_stream(req.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
