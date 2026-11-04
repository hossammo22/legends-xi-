/* LEGENDS XI — bootstrap. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX;
const C = window.Capacitor, P = C && C.Plugins;
async function native() {
  if (!(C && C.isNativePlatform && C.isNativePlatform())) return;
  LX.statusBar = async () => { try { const bg = getComputedStyle(document.documentElement).getPropertyValue('--navy').trim() || '#101827'; const light = document.documentElement.getAttribute('data-theme') === 'light';
    P.StatusBar && await P.StatusBar.setBackgroundColor({ color: bg }); P.StatusBar && await P.StatusBar.setStyle({ style: light ? 'LIGHT' : 'DARK' }); } catch (e) {} };
  LX.statusBar();
  try { P.SplashScreen && await P.SplashScreen.hide(); } catch (e) {}
  try {
    if (P.App) {
      LX.exitApp = () => P.App.exitApp();
      P.App.addListener('backButton', () => LX.back());
    }
  } catch (e) {}
}
document.addEventListener('DOMContentLoaded', async () => {
  native();
  if (!location.hash) location.replace('#/home');
  LX.render();
  await LX.splash();
});
})();
