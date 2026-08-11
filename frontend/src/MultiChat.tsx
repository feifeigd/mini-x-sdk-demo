import { useState, type ReactNode } from 'react';
import { Layout, theme } from 'antd';
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
import ConversationList, {
    type ConversationListItem,
} from './components/ConversationList';
import { nextConvId } from './components/conversation-utils';
import Mermaid from './components/Mermaid';

const { Sider, Content } = Layout;
const { useToken } = theme;

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

// 角色配置：local=用户(end)，其他=AI(start)
// 引用保持稳定，避免每次渲染都重建对象导致打字动画重置
// AI 消息用 XMarkdown 渲染，支持 LaTeX 数学公式和 Mermaid 图表
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

export default function MultiChat() {
    const { token } = useToken();

    // 会话列表
    const [conversations, setConversations] = useState<ConversationListItem[]>(() => [
        { key: nextConvId(), label: '新对话 1' },
    ]);
    const [activeKey, setActiveKey] = useState<string>(() => conversations[0].key);

    // provider 单例（所有会话共享，请求无状态）
    const [provider] = useState(() => {
        const request = XRequest('/api/chat', { manual: true });
        return new ChatProvider({ request });
    });

    // useXChat 内部用全局 chatMessagesStoreHelper 按 conversationKey 缓存各会话消息
    // 切换 activeKey 时会自动加载对应会话的历史消息
    const { messages, onRequest, isRequesting, setMessages } = useXChat({
        provider,
        conversationKey: activeKey,
    });

    const [input, setInput] = useState('');

    const handleSend = (value: string) => {
        const text = value.trim();
        if (!text || isRequesting) return;
        setInput('');
        onRequest({ message: text });
    };

    const handleCreate = () => {
        const newItem: ConversationListItem = {
            key: nextConvId(),
            label: `新对话 ${conversations.length + 1}`,
        };
        setConversations((prev) => [newItem, ...prev]);
        setActiveKey(newItem.key);
    };

    const handleDelete = (key: string) => {
        // 删除的是当前会话：先切到其他会话，再清空当前会话的消息缓存
        if (key === activeKey) {
            const next = conversations.find((c) => c.key !== key);
            if (next) {
                setActiveKey(next.key);
            }
            // 清空被删会话的消息，避免内存泄漏（SDK 全局 store 不可直接访问，只能清当前 key 的）
            setMessages([]);
        }
        setConversations((prev) => prev.filter((c) => c.key !== key));
    };

    return (
        <Layout style={{ height: '100%', background: token.colorBgContainer }}>
            <Sider
                width={260}
                theme="light"
                style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}
            >
                <ConversationList
                    items={conversations}
                    activeKey={activeKey}
                    onActiveChange={setActiveKey}
                    onCreate={handleCreate}
                    onDelete={handleDelete}
                />
            </Sider>
            <Content style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {messages.length === 0 ? (
                    <div
                        style={{
                            color: token.colorTextSecondary,
                            textAlign: 'center',
                            marginTop: 48,
                        }}
                    >
                        发送一条消息开始对话
                    </div>
                ) : (
                    <Bubble.List
                        style={{ flex: 1, minHeight: 0, padding: 16 }}
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
                <div
                    style={{ padding: 16, borderTop: `1px solid ${token.colorBorderSecondary}` }}
                >
                    <Sender
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSend}
                        loading={isRequesting}
                        placeholder="输入消息，回车发送"
                    />
                </div>
            </Content>
        </Layout>
    );
}
