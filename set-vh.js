(function(){
  const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVh();
  window.addEventListener('resize', () => {
    clearTimeout(window._vhTimeout);
    window._vhTimeout = setTimeout(setVh, 150);
  });
  window.addEventListener('orientationchange', setVh);
})();
