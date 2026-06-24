import { MathJaxContext } from 'better-react-mathjax';

const config = {
  loader: { load: ['[tex]/color', '[tex]/html'] },
  inline: true,
  dynamic: true,
  tex: {
    packages: { '[+]': ['color', 'html'] },
    inlineMath: [['\\(', '\\)']],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
  },
};

export function MathJaxWrapper({ children }: { children: React.ReactNode }) {
  return <MathJaxContext config={config}>{children}</MathJaxContext>;
}
