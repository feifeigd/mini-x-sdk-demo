import { useMemo, type CSSProperties } from 'react';
import plantumlEncoder from 'plantuml-encoder';

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

interface PlantUmlProps {
    chart: string;
    /** 流式状态：loading 时不渲染图片，只显示原始代码 */
    streamStatus?: 'loading' | 'done';
    style?: CSSProperties;
}

/**
 * PlantUml 图表渲染组件
 * - 通过 PlantUML 公共服务器渲染（无需本地 Java 环境）
 * - 流式过程中只显示代码，完成后显示图片
 */
export default function PlantUml({
    chart,
    streamStatus = 'done',
    style,
}: PlantUmlProps) {
    // 编码 PlantUML 文本为 URL 安全格式
    const encoded = useMemo(
        () => plantumlEncoder.encode(chart),
        [chart],
    );
    const imgUrl = `${PLANTUML_SERVER}/svg/${encoded}`;

    // 流式过程中只显示代码
    if (streamStatus === 'loading') {
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
            className="plantuml-container"
            style={{ overflow: 'auto', textAlign: 'center', ...style }}
        >
            <img
                src={imgUrl}
                alt="PlantUML Diagram"
                style={{ maxWidth: '100%' }}
                onError={(e) => {
                    // 渲染失败时回退显示原始代码
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                        const pre = document.createElement('pre');
                        pre.style.cssText =
                            'background:#f6f8fa;padding:12px;border-radius:6px;font-size:13px;overflow:auto;text-align:left';
                        pre.textContent = chart;
                        parent.appendChild(pre);
                    }
                }}
            />
        </div>
    );
}
