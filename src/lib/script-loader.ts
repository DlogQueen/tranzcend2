export const loadJeelizScript = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('jeeliz-face-filter-script')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'jeeliz-face-filter-script';
    script.src = '/jeelizFaceFilter.min.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = (err) => reject(err);

    document.head.appendChild(script);
  });
};