import { useState } from 'react';
import { Layout, theme } from 'antd';
import { Bubble, Sender } from '@ant-design/x';
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

const { Sider, Content } = Layout;
const { useToken } = theme;

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
    const { messages, onRequest, isRequesting } = useXChat({
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
        setConversations((prev) => {
            const next = prev.filter((c) => c.key !== key);
            if (key === activeKey && next.length > 0) {
                setActiveKey(next[0].key);
            }
            return next;
        });
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
            <Content style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
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
                        messages.map((msg) => (
                            <Bubble
                                key={msg.id}
                                placement={msg.status === 'local' ? 'start' : 'end'}
                                content={msg.message}
                            />
                        ))
                    )}
                </div>
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
