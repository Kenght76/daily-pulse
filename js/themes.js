/* ============================================================
   themes.js — Theme Switcher + Custom Theme Builder
   ============================================================ */

const Themes = (() => {

  const AVAILABLE = [
    { id: 'default-dark',  name: 'Dark Mode',    emoji: '🌙' },
    { id: 'default-light', name: 'Light Mode',   emoji: '☀️' },
    { id: 'metal',         name: 'Metal',        emoji: '⚙️' },
    { id: 'glass',         name: 'Glass',        emoji: '🪟' },
    { id: 'neon',          name: 'Neon',         emoji: '💜' },
    { id: 'christmas',     name: 'Christmas',    emoji: '🎄' },
    { id: 'halloween',     name: 'Halloween',    emoji: '🎃' },
    { id: 'easter',        name: 'Easter',       emoji: '🐣' },
    { id: 'valentines',       name: 'Valentines Dark',  emoji: '💕' },
    { id: 'valentines-light', name: 'Valentines Light', emoji: '💗' },
    { id: 'custom',           name: 'Custom',           emoji: '🎨' }
  ];

  const BUTTON_STYLES = [
    { id: 'clean',   name: 'Clean',        emoji: '✨' },
    { id: 'metal',   name: 'Metal',        emoji: '⚙️' },
    { id: 'glass',   name: 'Glass',        emoji: '🪟' },
    { id: 'neon',    name: 'Neon',         emoji: '💜' },
    { id: 'soft',    name: 'Rounded Soft', emoji: '🫧' }
  ];

  const apply = (themeId) => {
    // Remove all theme classes
    document.body.className = document.body.className
      .replace(/theme-[\w-]+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeId}`);

    // Apply button style
    const settings = Store.getSettings();
    applyButtonStyle(settings.buttonStyle || 'clean');

    // Apply custom color overrides
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
