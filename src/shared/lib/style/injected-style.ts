let styleEl: HTMLStyleElement;

export const toggleAdditionalStyles = (enabled: boolean) => {
  if (!document) {
    return;
  }

  if (!styleEl) {
    const htmlEl = document.querySelector("html");

    if (htmlEl) {
      styleEl = document.createElement("style");
      htmlEl.appendChild(styleEl);
    }
  }

  const cssVars =
    `--invert: ${enabled ? 1 : 0};` +
    `--hue: ${enabled ? 180 : 0}deg;` +
    `--htmlbg: ${enabled ? "#000" : "default"};`;

  styleEl.innerHTML = `:root {${cssVars}}

html, 
iframe {
  background: var(--htmlbg);
  filter: invert(var(--invert)) hue-rotate(var(--hue)); 
}

img,
picture,
video {
  filter: invert(var(--invert)) hue-rotate(var(--hue)); 
}

picture img {
  filter: none;
}
`;
};
