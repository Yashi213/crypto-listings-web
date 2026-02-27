const scriptStartTime = performance.now();

function calculateLoadTime() {
    const currentTime = performance.now();
    return Math.round(currentTime);
}

function formatLoadTime(ms) {
    if (ms < 1000) {
        return ms + ' мс';
    }
    return (ms / 1000).toFixed(2) + ' с';
}

export function addLoadTimeToFooter() {
    const footer = document.querySelector('.footer__content');
    if (!footer) return;

    let loadTimeElement = document.getElementById('page-load-time');
    if (!loadTimeElement) {
        loadTimeElement = document.createElement('p');
        loadTimeElement.id = 'page-load-time';
        loadTimeElement.style.cssText = 'margin: 0.5rem 0 0 0; font-size: 0.875rem; opacity: 0.8;';
        footer.appendChild(loadTimeElement);
    }

    const loadTimeMs = calculateLoadTime();
    loadTimeElement.textContent = 'Время загрузки страницы: ' + formatLoadTime(loadTimeMs);
}

function normalizePath(path) {
    path = path.replace(/\/+$/, '') || '/';
    const parts = path.split('/').filter(function(part) {
        return part && part !== '.';
    });
    return '/' + parts.join('/');
}

function getFileName(path) {
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
}

export function setActiveNavigationItem() {
    const currentUrl = window.location;
    const currentPath = normalizePath(currentUrl.pathname);
    const currentFileName = getFileName(currentPath);
    const currentHash = currentUrl.hash || '';
    const navLinks = document.querySelectorAll('.nav__link');

    navLinks.forEach(function(link) {
        link.classList.remove('nav__link--active');

        const linkHref = link.getAttribute('href');
        if (!linkHref) return;

        if (linkHref.startsWith('#')) {
            if (currentHash === linkHref) {
                link.classList.add('nav__link--active');
            }
            return;
        }

        if (linkHref.startsWith('http') || linkHref.startsWith('mailto:')) {
            return;
        }

        try {
            const linkUrl = new URL(linkHref, currentUrl.href);
            const linkPath = normalizePath(linkUrl.pathname);
            const linkFileName = getFileName(linkPath);
            const linkHash = linkUrl.hash || '';

            if (linkFileName === 'listing.html' && (currentFileName === 'listing.html' || currentFileName === '' || currentFileName === 'index.html')) {
                if (linkHash && currentHash === linkHash) {
                    link.classList.add('nav__link--active');
                    return;
                }
                if (!linkHash && !currentHash) {
                    link.classList.add('nav__link--active');
                    return;
                }
            }

            if (linkPath === currentPath) {
                if (linkHash) {
                    if (currentHash === linkHash) {
                        link.classList.add('nav__link--active');
                    }
                } else if (!currentHash) {
                    link.classList.add('nav__link--active');
                }
                return;
            }

            if (linkFileName && currentFileName === linkFileName) {
                link.classList.add('nav__link--active');
                return;
            }

            if (linkFileName === 'listing.html' && (currentFileName === 'listing.html' || currentFileName === '' || currentFileName === 'index.html')) {
                link.classList.add('nav__link--active');
                return;
            }
        } catch (e) {
            const linkFileName = getFileName(linkHref.split('#')[0]);
            if (linkFileName && currentFileName === linkFileName) {
                link.classList.add('nav__link--active');
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setActiveNavigationItem();
    });
} else {
    setActiveNavigationItem();
}

window.addEventListener('hashchange', function() {
    setActiveNavigationItem();
});

window.addEventListener('load', function() {
    addLoadTimeToFooter();
});