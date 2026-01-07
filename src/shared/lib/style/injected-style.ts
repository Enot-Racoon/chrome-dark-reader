let styleEl: HTMLStyleElement

export const toggleTabStyle = (tab: { enabled: boolean; styles: string }) => {
  if (tab) toggleAdditionalStyles(tab.enabled, tab.styles)
}

export const toggleAdditionalStyles = (enabled: boolean, styles = '') => {
  if (!document) {
    return
  }

  const htmlEl = document.documentElement
  if (!htmlEl) return

  // Clear critical styles set by background script
  htmlEl.style.backgroundColor = ''
  htmlEl.style.filter = ''

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'dark-reader-style'
    htmlEl.appendChild(styleEl)
  }

  const invertValue = enabled ? 0.95 : 0
  const hueValue = enabled ? 180 : 0
  const bgColor = enabled ? '#f2fafa' : 'transparent'

  // Using textContent for security and CSS variables for flexible updates
  styleEl.textContent = `
:root {
  --dr-invert: ${invertValue};
  --dr-hue: ${hueValue}deg;
  --dr-bg-color: ${bgColor};
  --dr-transition: 0.3s ease-out;
  color-scheme: ${enabled ? 'dark' : 'light'};
}

html {
  background-color: var(--dr-bg-color) !important;
  filter: invert(var(--dr-invert)) hue-rotate(var(--dr-hue));
  transition: filter var(--dr-transition), background-color var(--dr-transition);
}

/* Revert inversion for media elements to preserve original colors */
img,
picture,
video,
canvas,
[style*="background-image"],
[style*="background: url"],
svg:not(:root) {
  filter: invert(var(--dr-invert)) hue-rotate(calc(var(--dr-hue) * -1)) !important;
  transition: filter var(--dr-transition);
}

/* Fix for nested elements and special cases */
picture img {
  filter: none !important;
}

/* Darker scrollbars and native elements */
::-webkit-scrollbar {
  background-color: #2a2a2a;
  color: #c5c5c5;
}

::-webkit-scrollbar-thumb {
  background-color: #454545;
}

iframe {
  transition: filter var(--dr-transition);
  filter: invert(var(--dr-invert)) hue-rotate(var(--dr-hue));
}

${styles}
`
}
