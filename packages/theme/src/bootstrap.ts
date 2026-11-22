import { THEME_NAMES, themeColorOf } from './palette.ts'
import { DEFAULT_THEME, PREFERS_DARK_QUERY, THEME_KEY, THEME_MODES } from './settings.ts'

/**
 * Inline script for `<head>`: applies the stored theme before the app loads, so the page
 * never flashes the wrong colors. Self-contained (no imports at runtime).
 */
export function themeBootstrapScript(): string {
  const j = JSON.stringify
  const colors = Object.fromEntries(THEME_NAMES.map((t) => [t, themeColorOf(t)]))
  return `(function(){try{
var m=${j(DEFAULT_THEME.mode)},c=${j(colors)};
try{var s=JSON.parse(localStorage.getItem(${j(THEME_KEY)})||'null');if(s&&s.data&&${j(THEME_MODES)}.indexOf(s.data.mode)>-1)m=s.data.mode}catch(e){}
var t=m==='system'?(window.matchMedia&&window.matchMedia(${j(PREFERS_DARK_QUERY)}).matches?'night':'light'):m;
var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=t==='light'?'light':'dark';
var e=document.querySelector('meta[name="theme-color"]');if(!e){e=document.createElement('meta');e.name='theme-color';document.head.appendChild(e)}e.content=c[t];
}catch(e){}})()`.replace(/\n/g, '')
}
