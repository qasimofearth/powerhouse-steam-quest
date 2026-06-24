export const htmlToPlainText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export const parseContent = (content: string | undefined, t: (key: string) => string): string => {
  if (!content) return '';
  const value = t(content);
  return htmlToPlainText(value);
};
