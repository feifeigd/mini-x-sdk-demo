import { Think } from '@ant-design/x';
import { type ComponentProps } from '@ant-design/x-markdown';
import React from 'react';

const ThinkComponent = React.memo((props: ComponentProps) => {
  const [title, setTitle] = React.useState('Deep thinking...');
  const [loading, setLoading] = React.useState(true);
  const [expand, setExpand] = React.useState(true);

  React.useEffect(() => {
    if (props.streamStatus === 'done') {
      setTitle('Complete thinking');
      setLoading(false);
      setExpand(false);
    }
  }, [props.streamStatus]);

  return (
    <Think title={title} loading={loading} expanded={expand} onClick={() => setExpand(!expand)}>
      {props.children}
    </Think>
  );
});

export default ThinkComponent;
