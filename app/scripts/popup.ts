import 'chromereload/devonly';
import {STORAGE_KEY_PROVIDER} from './const';

chrome.storage.local.get((items: { [key: string]: any }) => {
  const provider = items[STORAGE_KEY_PROVIDER];
  const e = document.querySelector<HTMLElement>(`#providers li[data-provider="${provider}"]`);
  if (e) {
    e.classList.add('active');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  let lis = Array.from(document.querySelectorAll<HTMLElement>('#providers li'));

  for (let e of Array.from(lis)) {
    e.addEventListener('click', (ev) => {
      lis.map((e) => e.classList.remove('active'));

      const e = ev.target as HTMLElement;
      e.classList.add('active');

      chrome.storage.local.set({[STORAGE_KEY_PROVIDER]: e.getAttribute('data-provider')});
    });
  }
});
