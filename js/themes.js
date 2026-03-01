/* ============================================================
   themes.js — Theme Switcher
   ============================================================ */

const Themes = (() => {

  const AVAILABLE = [
    { id: 'default-dark',     name: 'Dark',            emoji: '🌙' },
    { id: 'default-light',    name: 'Light',           emoji: '☀️' },
    { id: 'ocean',            name: 'Ocean',           emoji: '🌊' },
    { id: 'sunrise',           name: 'Sunrise',          emoji: '🌅' },
    { id: 'forest',           name: 'Forest',          emoji: '🌲' },
    { id: 'lavender',         name: 'Lavender',        emoji: '💜' },
    { id: 'daylight',         name: 'Daylight',        emoji: '🌤️' },
    { id: 'christmas',        name: 'Christmas',       emoji: '🎄' },
    { id: 'halloween',        name: 'Halloween',       emoji: '🎃' },
    { id: 'easter',           name: 'Easter',          emoji: '🐣' },
    { id: 'valentines',       name: 'Valentines',      emoji: '💕' },
    { id: 'valentines-light', name: 'Valentines Light', emoji: '💗' },
    { id: 'custom',           name: 'Custom',          emoji: '🎨' }
  ];

  const BUTTON_STYLES = [
    { id: 'clean',   name: 'Clean',        emoji: '✨' },
    { id: 'soft',    name: 'Rounded Soft', emoji: '🫧' },
    { id: 'glass',   name: 'Glass',        emoji: '🪟' },
    { id: 'neon',    name: 'Neon',         emoji: '💜' }
  ];

  const apply = (themeId) => {
    document.body.className = document.body.className
      .replace(/theme-[\w-]+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeId}`);

    const settings = Store.getSettings();
    applyButtonStyle(settings.buttonStyle || 'clean');

    if (settings.customColors) {
      Object.entries(settings.customColors).forEach(([prop, val]) => {
        document.documentElement.style.setProperty(prop, val);
      });
    }

    Store.updateSettings({ theme: themeId });
  };

  const applyButtonStyle = (styleId) => {
    document.body.className = document.body.className
      .replace(/btn-style-[\w-]+/g, '')
      .trim();
    document.body.classList.add(`btn-style-${styleId}`);
    Store.updateSettings({ buttonStyle: styleId });
  };

  const getCurrent = () => Store.getSettings().theme || 'default-dark';

  const init = () => {
    const settings = Store.getSettings();
    apply(settings.theme || 'default-dark');
  };

  return { AVAILABLE, BUTTON_STYLES, apply, applyButtonStyle, getCurrent, init };
})();
