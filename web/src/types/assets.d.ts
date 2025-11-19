declare module '*.svg' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponent;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}

declare module '*.png' {
  const src: import('next/image').StaticImageData;
  export default src;
}
declare module '*.jpg' {
  const src: import('next/image').StaticImageData;
  export default src;
}
declare module '*.jpeg' {
  const src: import('next/image').StaticImageData;
  export default src;
}
declare module '*.gif' {
  const src: import('next/image').StaticImageData;
  export default src;
}
