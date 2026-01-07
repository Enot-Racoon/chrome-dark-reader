let styleEl: HTMLStyleElement

export const toggleTabStyle = (tab: { enabled: boolean; styles: string }) => {
  if (tab) toggleAdditionalStyles(tab.enabled, tab.styles)
}

export const toggleAdditionalStyles = (enabled: boolean, styles = '') => {
  if (!document) {
    return
  }

  if (!styleEl) {
    const htmlEl = document.querySelector('html')

    if (htmlEl) {
      styleEl = document.createElement('style')
      htmlEl.appendChild(styleEl)
    }
  }
  const cssVars =
    `--invert: ${enabled ? 0.95 : 0};` +
    `--hue: ${enabled ? 180 : 0}deg;` +
    `--background-color: ${enabled ? '#f2fafa' : 'default'};`

  styleEl.innerHTML = `:root {${cssVars}}

html, 
iframe {
  transition-duration: 0.3s;
  transition-timing-function: ease-out;
  transition-property: filter background-color;
  background-color: var(--background-color);
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

${styles}
`
}
