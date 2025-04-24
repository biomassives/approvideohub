// /public/js/nav-ui.js

/**
 * Caches navigation links and dashboard sections.
 * @returns {{navLinks: NodeList, sections: NodeList}}
 */
export function cacheDom() {
    return {
      navLinks: document.querySelectorAll('.nav-link'),
      sections: document.querySelectorAll('.dashboard-section')
    };
  }
  
  /**
   * Initializes single-page navigation: shows the appropriate section,
   * updates active link, and invokes a loader callback.
   * @param {{navLinks: NodeList, sections: NodeList}} dom Caching object
   * @param {function(string)} loadSectionFn Callback to load section data
   */
  export function initNavigation(dom, loadSectionFn) {
    dom.navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.dataset.section;
        // Toggle active class
        dom.navLinks.forEach(l => l.classList.toggle('active', l === link));
        // Show/hide sections
        dom.sections.forEach(sec => sec.classList.toggle('hidden', sec.id !== targetId));
        // Load the section data
        loadSectionFn(targetId);
        // Update URL hash
        history.replaceState(null, '', `#${targetId}`);
      });
    });
    // Trigger initial section based on URL or default to 'dashboard'
    const initial = location.hash.slice(1) || 'dashboard';
    const initLink = Array.from(dom.navLinks).find(l => l.dataset.section === initial);
    (initLink || dom.navLinks[0]).click();
  }
  
