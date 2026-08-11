let convIdSeq = 0;

export const nextConvId = () => `conv_${Date.now()}_${convIdSeq++}`;

export interface ConversationItem {
    key: string;
    label: string;
}
