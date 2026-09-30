const track = document.querySelector('#project-track');
const cards = [...track.querySelectorAll('.project')];
const current = document.querySelector('#current-slide');
const progress = document.querySelector('.progress i');

function preventMobileOrphans() {
  if (!window.matchMedia('(max-width: 700px)').matches) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName) || !/[А-Яа-яЁё]/.test(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    node.nodeValue = node.nodeValue.replace(
      /(^|[\s(«„—-])([А-Яа-яЁё]{1,2}|без|для|над|под|при|про|через)\s+(?=[A-Za-zА-Яа-яЁё0-9«])/giu,
      '$1$2\u00A0'
    );
  });
}

function updateCarousel() {
  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  const index = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / (cards[0].offsetWidth + gap))));
  current.textContent = String(index + 1).padStart(2, '0');
  progress.style.width = `${((index + 1) / cards.length) * 100}%`;
}

function move(direction) {
  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  track.scrollBy({ left: direction * (cards[0].offsetWidth + gap), behavior: 'smooth' });
}

document.querySelector('#prev').addEventListener('click', () => move(-1));
document.querySelector('#next').addEventListener('click', () => move(1));
track.addEventListener('scroll', updateCarousel, { passive: true });

const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
});
mobileNav.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.cv-link').forEach(link => link.addEventListener('click', () => {
  link.dataset.requested = 'true';
}));

updateCarousel();
preventMobileOrphans();
