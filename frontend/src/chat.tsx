import { useState } from 'react';
import { Bubble, Sender } from '@ant-design/x';
import { chatStream } from './streamApi';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface StreamChunk {
    content?: string;
    choices?: Array<{ delta?: { content?: string } }>;
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (content: string) => {
        const text = content.trim();
        if (!text || loading) return;

        // 先插入 assistant 占位，等待服务器响应再更新内容
        setMessages((prev) => [
            ...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: '' },
        ]);
        setInput('');
        setLoading(true);

        try {
            let acc = '';
            for await (const chunk of chatStream(text)) {
                const c = chunk as StreamChunk;
                const delta = c?.content ?? c?.choices?.[0]?.delta?.content ?? '';
                acc += delta;
                setMessages((prev) => {
                    const next = [...prev];
                    next[next.length - 1] = { role: 'assistant', content: acc };
                    return next;
                });
            }
        } catch (err) {
            setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                    role: 'assistant',
                    content: `出错: ${err instanceof Error ? err.message : String(err)}`,
                };
                return next;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {messages.length === 0 ? (
                    <div style={{ color: '#999', textAlign: 'center', marginTop: 48 }}>
                        发送一条消息开始对话
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <Bubble
                            key={idx}
                            placement={msg.role === 'user' ? 'start' : 'end'}
                            content={msg.content}
                        />
                    ))
                )}
            </div>
            <Sender
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                loading={loading}
                placeholder="输入消息，回车发送"
            />
        </div>
    );
}
