import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Infographic as AntvInfographic } from '@antv/infographic';

interface InfographicProps {
    chart: string;
    /** 流式状态：loading 时不渲染图表，只显示原始代码 */
    streamStatus?: 'loading' | 'done';
    style?: CSSProperties;
}

/**
 * AntV Infographic 渲染组件
 * - 接收 infographic DSL 文本，渲染为 SVG 信息图
 * - 流式过程中（streamStatus='loading'）只显示代码，完成后才渲染图表
 * - DSL 高度容错，支持流式渐进渲染
 */
export default function Infographic({
    chart,
    streamStatus = 'done',
    style,
}: InfographicProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<AntvInfographic | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // 流式过程中不渲染，等完成后再渲染
        if (streamStatus === 'loading') return;
        if (!containerRef.current) return;

        try {
            // 复用实例，避免重复创建
            if (!instanceRef.current) {
                instanceRef.current = new AntvInfographic({
                    container: containerRef.current,
                    width: '100%',
                    height: '100%',
                });
            }
            instanceRef.current.render(chart);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }

        return () => {
            // 组件卸载时销毁实例
            // 不在每次 chart 变化时销毁，复用实例支持流式 re-render
        };
    }, [chart, streamStatus]);

    useEffect(() => {
        return () => {
            instanceRef.current?.destroy?.();
            instanceRef.current = null;
        };
    }, []);

    // 流式过程中或语法错误时，显示原始代码
    if (streamStatus === 'loading' || error) {
        return (
            <pre
                style={{
                    background: '#f6f8fa',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    overflow: 'auto',
                    ...style,
                }}
            >
                <code>{chart}</code>
            </pre>
        );
    }

    return (
        <div
            ref={containerRef}
            className="infographic-container"
            style={{ overflow: 'auto', minHeight: 100, ...style }}
        />
    );
}
