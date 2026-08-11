import { XStream } from '@ant-design/x-sdk';

// 生成器函数，用于获取聊天流数据
export async function* chatStream(prompt: string, signal?: AbortSignal) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: prompt }),
        signal,
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if(!response.ok) {
            throw new Error(`Failed to fetch chat stream ${response.status}`);
    }
    
    yield* XStream({ readableStream: response.body! });
}
