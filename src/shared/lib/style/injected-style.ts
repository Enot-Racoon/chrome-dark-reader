import { type IHostSettings } from '@/entities/preferences/types'

let styleEl: HTMLStyleElement

export const toggleTabStyle = (tab: IHostSettings | { enabled: boolean; styles: string }) => {
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

html, 
iframe {
  transition-duration: 0.3s;
  transition-timing-function: ease-out;
  transition-property: filter background-color;
  /* background-color: var(--dr-bg-color); */
  filter: invert(var(--dr-invert)) hue-rotate(var(--dr-hue)); 
}

img,
picture,
video {
  filter: invert(var(--dr-invert)) hue-rotate(var(--dr-hue)); 
}

picture img {
  filter: none;
}

${styles}
`
}
