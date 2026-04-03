declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';

  interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: string;
    className?: string;
    showLineNumbers?: boolean;
    lineNumberStyle?: any;
    [key: string]: any;
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const oneDark: any;
  export const oneLight: any;
  export const dracula: any;
  export const ghcolors: any;
  export const atomDark: any;
  export const materialDark: any;
  export const materialLight: any;
}
