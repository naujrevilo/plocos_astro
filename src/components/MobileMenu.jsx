import React, { useState, useEffect, useRef } from 'react';

export default function MobileMenu({ navItems, locale, createLocaleHref, isActive, navAriaLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleEscape(e) {
      if (isOpen && e.key === 'Escape') setIsOpen(false);
    }
    function handleClickOutside(e) {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="hamburger-btn md:hidden ml-2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-text-primary transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label="Abrir menú"
        aria-controls="mobile-nav"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="6" width="28" height="2.5" rx="1.25" fill="currentColor" />
          <rect y="13" width="28" height="2.5" rx="1.25" fill="currentColor" />
          <rect y="20" width="28" height="2.5" rx="1.25" fill="currentColor" />
        </svg>
      </button>
      {isOpen && (
        <nav
          id="mobile-nav"
          ref={menuRef}
          className="mobile-nav fixed inset-0 z-50 flex flex-col bg-surface-base/95 backdrop-blur-lg p-6 transition-all duration-300 md:hidden"
          aria-label={navAriaLabel}
        >
          <button
            type="button"
            className="close-btn self-end mb-6 h-12 w-12 rounded-full border border-border-subtle bg-surface-elevated text-text-primary transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Cerrar menú"
            onClick={() => setIsOpen(false)}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="7" y1="7" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="21" y1="7" x2="7" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <ul className="flex flex-col gap-4 text-lg font-medium">
            {navItems.map((item) => {
              const href = createLocaleHref(locale, item.path);
              const active = isActive(href);
              return (
                <li key={item.id}>
                  <a
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-xl border px-4 py-3 transition ${active ? 'border-accent bg-accent text-surface-base shadow-outline' : 'border-border-subtle bg-surface-elevated text-text-secondary hover:border-accent hover:text-text-primary'}`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
