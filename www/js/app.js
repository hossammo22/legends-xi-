/* LEGENDS XI — bootstrap. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX;
const C = window.Capacitor, P = C && C.Plugins;
async function native() {
  if (!(C && C.isNativePlatform && C.isNativePlatform())) return;
  try { P.StatusBar && await P.StatusBar.setBackgroundColor({ color: '#101827' }); P.StatusBar && await P.StatusBar.setStyle({ style: 'DARK' }); } catch (e) {}
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
