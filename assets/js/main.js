'use strict';

// 1. ABAS DOS CARDS
// Cada card funciona de forma independente, inclusive os que você copiar
// do modelo comentado em index.html. Os IDs são únicos e automáticos.
document.querySelectorAll('[data-recipe]').forEach((card, index) => {
  const tabs = Array.from(card.querySelectorAll('[data-tab]'));
  const panels = Array.from(card.querySelectorAll('[data-panel]'));

  tabs.forEach(tab => {
    const key = tab.dataset.tab;
    tab.id = `receita-${index + 1}-aba-${key}`;
    tab.setAttribute('aria-controls', `receita-${index + 1}-painel-${key}`);
  });
  panels.forEach(panel => {
    const key = panel.dataset.panel;
    panel.id = `receita-${index + 1}-painel-${key}`;
    panel.setAttribute('aria-labelledby', `receita-${index + 1}-aba-${key}`);
    panel.tabIndex = 0;
  });

  function activate(selected, focus = false) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.dataset.panel !== selected.dataset.tab;
    });
    if (focus) selected.focus();
  }

  tabs.forEach((tab, tabIndex) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (tabIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (tabIndex - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activate(tabs[next], true);
      }
    });
  });
  if (tabs.length) activate(tabs[0]);
});

// 2. ANIMAÇÕES AO ROLAR A PÁGINA
// IntersectionObserver observa a entrada dos elementos na tela sem executar
// um evento a cada movimento de scroll. Cada elemento anima apenas uma vez.
// O conteúdo permanece visível se JavaScript ou esta API não estiverem ativos.
function initializeScrollAnimations() {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  const elements = Array.from(document.querySelectorAll('[data-reveal]'));
  const cards = Array.from(document.querySelectorAll('[data-recipe]'));
  const revealed = new WeakSet();
  const running = new Map();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      observer.unobserve(element);
      if (revealed.has(element)) return;
      revealed.add(element);
      if (typeof element.animate !== 'function' || motionPreference.matches) return;

      const cardIndex = cards.indexOf(element);
      const animation = element.animate([
        { opacity: 0, translate: '0 24px' },
        { opacity: 1, translate: '0 0' }
      ], {
        duration: 700,
        delay: cardIndex < 0 ? 0 : (cardIndex % 3) * 90,
        easing: 'cubic-bezier(.22, 1, .36, 1)',
        fill: 'backwards'
      });
      running.set(element, animation);
      animation.finished.catch(() => {}).then(() => running.delete(element));
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px -24px 0px'
  });

  elements.forEach(element => observer.observe(element));

  // Ao navegar com teclado, mostra o elemento imediatamente para manter
  // o foco legível, mesmo durante uma animação de entrada.
  document.addEventListener('focusin', event => {
    const element = event.target.closest('[data-reveal]');
    if (!element) return;
    revealed.add(element);
    observer.unobserve(element);
    running.get(element)?.finish();
  });

  function finishAnimations() {
    observer.disconnect();
    running.forEach(animation => animation.finish());
    running.clear();
  }

  // Respeita a preferência por reduzir movimento e a impressão da página.
  motionPreference.addEventListener?.('change', event => {
    if (event.matches) finishAnimations();
  });
  window.addEventListener('beforeprint', finishAnimations);
}

initializeScrollAnimations();
