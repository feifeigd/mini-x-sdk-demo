import { useState } from 'react';
import { Bubble, Sender } from '@ant-design/x';
import {
    AbstractChatProvider,
    XRequest,
    useXChat,
    type SSEOutput,
    type TransformMessage,
    type XRequestOptions,
} from '@ant-design/x-sdk';

interface ChatInput {
    message: string;
}

/**
 * 自定义 Provider：
 * - transformLocalMessage: 把 { message: "xxx" } 转成展示用的字符串
 * - transformMessage: 把每个 SSE chunk 累加到 originMessage，实现打字机效果
 *    （DefaultChatProvider 默认是替换式，不是累加，不适合本场景）
 */
class ChatProvider extends AbstractChatProvider<string, ChatInput, SSEOutput> {
    transformParams(
        requestParams: Partial<ChatInput>,
        options: XRequestOptions<ChatInput, SSEOutput, string>,
    ): ChatInput {
        return {
            ...(options?.params || {}),
            ...(requestParams || {}),
        } as ChatInput;
    }

    transformLocalMessage(requestParams: Partial<ChatInput>): string {
        return requestParams.message || '';
    }

    transformMessage(info: TransformMessage<string, SSEOutput>): string {
        const { chunk, originMessage } = info;
        if (chunk) {
            try {
                const parsed = JSON.parse(chunk.data || '{}');
                return (originMessage || '') + (parsed.content || '');
            } catch {
                return originMessage || '';
            }
        }
        return originMessage || '';
    }
}

export default function Chat() {
    const [input, setInput] = useState('');

    // 仅创建一次 provider 实例
    const [provider] = useState(() => {
        // 向后端服务接口发起请求，获取响应数据。如果是OpenAI Compatible的LLM服务，建议使用 XModelAPI。
        const request = XRequest('/api/chat', { manual: true });
        return new ChatProvider({ request });
    });

    const { messages, onRequest, isRequesting } = useXChat({ provider });

    const handleSend = (value: string) => {
        const text = value.trim();
        if (!text || isRequesting) return;
        setInput('');
        onRequest({ message: text });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {messages.length === 0 ? (
                    <div style={{ color: '#999', textAlign: 'center', marginTop: 48 }}>
                        发送一条消息开始对话
                    </div>
                ) : (
                    messages.map((msg) => (
                        <Bubble
                            key={msg.id}
                            placement={msg.status === 'local' ? 'start' : 'end'}
                            content={msg.message}
                        />
                    ))
                )}
            </div>
            <Sender
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                loading={isRequesting}
                placeholder="输入消息，回车发送"
            />
        </div>
    );
}
