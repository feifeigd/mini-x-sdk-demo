import { useEffect, useState } from 'react'
import './App.css'

interface Item {
  id: number
  name: string
  description: string | null
}

interface HelloResponse {
  message: string
  version: string
}

function App() {
  const [apiInfo, setApiInfo] = useState<HelloResponse | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 调用后端根接口
      const rootRes = await fetch('/api/health').catch(() => null)
      if (rootRes?.ok) {
        // health 接口返回的结构不同，这里用 items 接口
      }

      const helloRes = await fetch('http://localhost:8000/')
      if (helloRes.ok) {
        const data = await helloRes.json()
        setApiInfo(data)
      }

      // 调用后端 items 接口
      const itemsRes = await fetch('http://localhost:8000/api/items')
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setItems(itemsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接后端服务失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div>
        <h1>Mini X SDK Demo</h1>
        <p>
          前后端分离项目 - FastAPI + React + TypeScript
        </p>
      </div>

      <div className="card">
        <h2>后端 API 状态</h2>
        {loading ? (
          <p>正在连接后端服务...</p>
        ) : error ? (
          <p className="status-error">
            连接失败: {error}
            <br />
            <small>请确保已启动后端服务 (http://localhost:8000)</small>
          </p>
        ) : (
          <div>
            {apiInfo && (
              <p className="status-ok">
                {apiInfo.message} (v{apiInfo.version})
              </p>
            )}
            <p>
              后端地址:{' '}
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
              >
                http://localhost:8000/docs (Swagger)
              </a>
            </p>
          </div>
        )}
        <button onClick={fetchData} style={{ marginTop: '1em' }}>
          刷新数据
        </button>
      </div>

      <div className="card">
        <h2>项目列表 ({items.length})</h2>
        {items.length > 0 ? (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id}>
                <h3>
                  #{item.id} - {item.name}
                </h3>
                <p>{item.description ?? '暂无描述'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无数据</p>
        )}
      </div>

      <div className="card">
        <h2>F5 调试说明</h2>
        <ol style={{ textAlign: 'left' }}>
          <li>
            <strong>仅调试后端</strong>: 选择 &quot;Python: FastAPI (uv run)&quot; 配置，按 F5
          </li>
          <li>
            <strong>仅调试前端</strong>: 选择 &quot;Frontend: React (Vite)&quot; 配置，先手动运行{' '}
            <code>npm run dev</code>，再按 F5
          </li>
          <li>
            <strong>同时调试前后端 (推荐)</strong>: 选择 &quot;Full Stack (Backend + Frontend)&quot;
            配置，按 F5 一键启动
          </li>
        </ol>
        <p style={{ marginTop: '1em', color: '#646cff' }}>
          ✨ 当前版本: React 19 + Vite 7 + TypeScript 5.8 + ESLint 9 (Flat Config)
        </p>
      </div>
    </div>
  )
}

export default App
