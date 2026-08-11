import { useState, type ReactNode } from 'react';
import { Bubble, Sender } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import latexPlugin from '@ant-design/x-markdown/plugins/Latex';
import {
    AbstractChatProvider,
    XRequest,
    useXChat,
    type SSEOutput,
    type TransformMessage,
    type XRequestOptions,
} from '@ant-design/x-sdk';
import Mermaid from './components/Mermaid';

// 配置 Marked 支持 LaTeX 数学公式（使用 @ant-design/x-markdown 内置插件，已内置 katex 样式）
// latexPlugin() 返回 TokenizerAndRendererExtension[]，需用 { extensions } 包裹成 MarkedExtension 对象
const markedExtensions = {
    extensions: latexPlugin({
        katexOptions: {
            throwOnError: false,
        },
    }),
};

// 自定义组件：识别 mermaid 代码块并渲染为图表
const markdownComponents = {
    code: (props: {
        children?: ReactNode;
        lang?: string;
        block?: boolean;
        className?: string;
        streamStatus?: 'loading' | 'done';
    }) => {
        const lang =
            props.lang ||
            props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1] ||
            '';
        const text = String(props.children || '').replace(/\n$/, '');
        if (lang === 'mermaid' && props.block) {
            return <Mermaid chart={text} streamStatus={props.streamStatus} />;
        }
        return <code className={props.className}>{props.children}</code>;
    },
};

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

// 角色配置：local=用户(end)，其他=AI(start)
// 引用保持稳定，避免每次渲染都重建对象导致打字动画重置
// AI 消息用 XMarkdown 渲染，流式时设 hasNextChunk=true 启用打字机/淡入动画
const roles = {
    user: {
        placement: 'end' as const,
        contentRender: (content: string) => (
            <XMarkdown
                content={content}
                config={markedExtensions}
                components={markdownComponents}
            />
        ),
    },
    ai: {
        placement: 'start' as const,
        contentRender: (content: string, info: { status?: string }) => (
            <XMarkdown
                content={content}
                config={markedExtensions}
                components={markdownComponents}
                streaming={{
                    hasNextChunk:
                        info.status === 'loading' || info.status === 'updating',
                    enableAnimation: true,
                }}
            />
        ),
    },
};

export default function Chat() {
    const [input, setInput] = useState('');

    // 仅创建一次 provider 实例
    const [provider] = useState(() => {
        // 向后端服务接口发起请求，获取响应数据。如果是OpenAI Compatible的LLM服务，建议使用 XModelAPI。
        const request = XRequest('/api/chat/deepseek', { manual: true });
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
            {messages.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', marginTop: 48 }}>
                    发送一条消息开始对话
                </div>
            ) : (
                <Bubble.List
                    style={{ flex: 1, minHeight: 0 }}
                    autoScroll
                    role={roles}
                    items={messages.map((msg) => ({
                        key: msg.id,
                        role: msg.status === 'local' ? 'user' : 'ai',
                        content: msg.message,
                        status: msg.status,
                    }))}
                />
            )}
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
