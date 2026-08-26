import observe from './observer.js';

export default function reveal() {
  document.querySelectorAll('.reveal').forEach((el) => {
    observe(el, () => el.classList.add('in'));
  });
}
