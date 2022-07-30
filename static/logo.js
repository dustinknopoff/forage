window.addEventListener('scroll', () => {
    const offset = window.pageYOffset / (document.body.offsetHeight - window.innerHeight);
    document.body.style.setProperty('--scroll', Math.min(offset, 1));
}, false);