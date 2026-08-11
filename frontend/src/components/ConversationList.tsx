import { Button } from 'antd';
import { Conversations } from '@ant-design/x';
import type { ConversationItemType } from '@ant-design/x/es/conversations/interface';
import type { ConversationItem } from './conversation-utils';

export type ConversationListItem = ConversationItem & ConversationItemType;

interface ConversationListProps {
    items: ConversationListItem[];
    activeKey: string;
    onActiveChange: (key: string) => void;
    onCreate: () => void;
    onDelete: (key: string) => void;
}

export default function ConversationList({
    items,
    activeKey,
    onActiveChange,
    onCreate,
    onDelete,
}: ConversationListProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: 12 }}>
                <Button type="primary" block onClick={onCreate}>
                    + 新建对话
                </Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <Conversations
                    items={items}
                    activeKey={activeKey}
                    onActiveChange={onActiveChange}
                    menu={(item) => ({
                        items: [
                            {
                                key: 'delete',
                                label: '删除',
                                danger: true,
                                onClick: () => onDelete(item.key),
                            },
                        ],
                    })}
                />
            </div>
        </div>
    );
}
