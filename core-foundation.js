/**
 * ============================================================
 *  CORE FOUNDATION — v1.0
 *  Compatible : PRONOTURF PRO v5.6 + VB Terminal v4.1
 *  3 modules : AppState | ResponsiveCSS | PinAuth
 * ============================================================
 *
 *  INTÉGRATION :
 *  1. Copier ce fichier dans le même dossier que ton HTML
 *  2. Ajouter dans le <head> :
 *       <script src="core-foundation.js"></script>
 *  3. Appeler CoreFoundation.init() au chargement :
 *       document.addEventListener('DOMContentLoaded', () => {
 *         CoreFoundation.init({ appName: 'PRONOTURF PRO', pinRequired: true });
 *       });
 * ============================================================
 */

'use strict';

/* ============================================================
   MODULE 1 — AppState
   Store centralisé. Toutes les données passent ici.
   Aucune variable globale eparpillée dans le code.
   ============================================================ */

const AppState = (() => {

  // État initial — adapte les clés à ton app
  const _defaults = {
    // Commun aux deux apps
    bankroll:      0,
    bets:          [],
    theme:         'dark',
    lang:          'fr',
    lastSaved:     null,

    // PRONOTURF PRO
    pronostics:    [],
    cdj:           [],
    hippodromes:   {},
    sessionStats:  { wins: 0, losses: 0, cdjRate: 0, roi: 0 },

    // VB Terminal
    subscribers:   [],
    journal:       [],
    kellyFraction: 0.25,
    edgeThreshold: 0.05,
  };

  let _state = {};
  const _listeners = {};  // { 'bankroll': [fn1, fn2], ... }
  const _STORAGE_KEY = 'cf_appstate_v1';

  /* ---- Persistence ---- */
  function _save() {
    try {
      localStorage.setItem(_STORAGE_KEY, JSON.stringify({
        ..._state,
        lastSaved: new Date().toISOString()
      }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') _evictOldEntries();
      console.warn('[AppState] save failed:', e.message);
    }
  }

  function _load() {
    try {
      const raw = localStorage.getItem(_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      console.warn('[AppState] load failed, using defaults');
      return null;
    }
  }

  function _evictOldEntries() {
    // Purge les paris/pronostics de plus de 90 jours
    const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
    if (_state.bets)       _state.bets       = _state.bets.filter(b => new Date(b.date) > cutoff);
    if (_state.journal)    _state.journal    = _state.journal.filter(b => new Date(b.date) > cutoff);
    if (_state.pronostics) _state.pronostics = _state.pronostics.filter(p => new Date(p.date) > cutoff);
    _save();
  }

  /* ---- Notifications ---- */
  function _notify(key, value) {
    (_listeners[key] || []).forEach(fn => {
      try { fn(value, key); } catch (e) { console.error('[AppState] listener error:', e); }
    });
    (_listeners['*'] || []).forEach(fn => {
      try { fn(value, key); } catch (e) { console.error('[AppState] listener error:', e); }
    });
  }

  /* ---- API publique ---- */
  return {

    init() {
      const saved = _load();
      _state = { ..._defaults, ...(saved || {}) };
      console.log('[AppState] initialisé —', Object.keys(_state).length, 'clés chargées');
    },

    /**
     * Lire une valeur (copie profonde — pas de mutation accidentelle)
     * @param {string} key
     * @returns {*}
     */
    get(key) {
      if (!(key in _state)) console.warn(`[AppState] clé inconnue: "${key}"`);
      return structuredClone !== undefined
        ? structuredClone(_state[key])
        : JSON.parse(JSON.stringify(_state[key] ?? null));
    },

    /**
     * Modifier une valeur et notifier les abonnés
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      _state[key] = value;
      _notify(key, value);
      _save();
    },

    /**
     * Modifier une sous-propriété d'un objet en état
     * ex : AppState.patch('sessionStats', { roi: 12.5 })
     */
    patch(key, partial) {
      if (typeof _state[key] !== 'object') return this.set(key, partial);
      _state[key] = { ..._state[key], ...partial };
      _notify(key, _state[key]);
      _save();
    },

    /**
     * Ajouter un élément à un tableau en état
     * ex : AppState.push('bets', { cote: 2.1, mise: 50 })
     */
    push(key, item) {
      if (!Array.isArray(_state[key])) _state[key] = [];
      _state[key] = [..._state[key], { ...item, _id: Date.now() }];
      _notify(key, _state[key]);
      _save();
    },

    /**
     * S'abonner aux changements d'une clé
     * Utiliser '*' pour écouter tous les changements
     * @returns {Function} unsubscribe
     */
    subscribe(key, fn) {
      if (!_listeners[key]) _listeners[key] = [];
      _listeners[key].push(fn);
      return () => {
        _listeners[key] = _listeners[key].filter(f => f !== fn);
      };
    },

    /** Snapshot complet (pour debug ou export) */
    snapshot() {
      return { ..._state };
    },

    /** Reset complet (avec confirmation) */
    reset(confirm = false) {
      if (!confirm) return console.warn('[AppState] reset() requiert reset(true)');
      _state = { ..._defaults };
      localStorage.removeItem(_STORAGE_KEY);
      _notify('*', _state);
    },
  };

})();


/* ============================================================
   MODULE 2 — ResponsiveCSS
   Injecte les styles mobile directement dans le <head>.
   Aucun fichier CSS séparé nécessaire.
   ============================================================ */

const ResponsiveCSS = (() => {

  const CSS = `
    /* ---- Reset mobile ---- */
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }

    /* ---- Tabs scrollables sur mobile ---- */
    .tabs, [class*="tab-bar"], [class*="nav-tabs"] {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      white-space: nowrap;
      display: flex;
      flex-wrap: nowrap;
    }
    .tabs::-webkit-scrollbar { display: none; }

    /* ---- Tableaux scrollables ---- */
    table {
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      max-width: 100%;
    }

    /* ---- Inputs taille minimum tactile ---- */
    input, select, textarea, button {
      min-height: 44px;
    }

    /* ---- Fix zoom iOS sur focus input ---- */
    input[type="text"],
    input[type="number"],
    input[type="email"],
    input[type="password"],
    select,
    textarea {
      font-size: 16px !important;
    }

    /* ---- Grilles responsive ---- */
    @media (max-width: 768px) {
      .grid-4, [class*="col-4"] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .grid-3, [class*="col-3"] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .grid-2, [class*="col-2"] {
        grid-template-columns: 1fr !important;
      }

      /* Réduction padding sur mobile */
      .container, .card, [class*="panel"] {
        padding: 12px !important;
      }

      /* Tabs plus compactes */
      .tab, [class*="tab-btn"] {
        padding: 10px 14px !important;
        font-size: 13px !important;
        min-width: 80px;
        text-align: center;
      }

      /* Titres adaptatifs */
      h1 { font-size: 1.4em !important; }
      h2 { font-size: 1.2em !important; }

      /* Stats cards en 2 colonnes */
      .stats-grid, .metric-cards {
        grid-template-columns: repeat(2, 1fr) !important;
      }

      /* Masquer colonnes secondaires sur mobile */
      .hide-mobile { display: none !important; }

      /* Boutons pleine largeur sur mobile */
      .btn-block-mobile {
        width: 100% !important;
        margin-bottom: 8px;
      }
    }

    @media (max-width: 480px) {
      .grid-4, .grid-3, .grid-2 {
        grid-template-columns: 1fr !important;
      }
      .stats-grid, .metric-cards {
        grid-template-columns: 1fr !important;
      }
    }

    /* ---- Barre de navigation bottom (mobile uniquement) ---- */
    @media (max-width: 768px) {
      #cf-bottom-nav {
        display: flex !important;
      }
      body {
        padding-bottom: 64px;
      }
    }

    #cf-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 60px;
      background: var(--bg-primary, #1a1a2e);
      border-top: 1px solid rgba(255,255,255,0.1);
      z-index: 9998;
      align-items: stretch;
    }
    #cf-bottom-nav button {
      flex: 1;
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.5);
      font-size: 11px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 0;
      transition: color 0.2s;
      min-height: unset;
    }
    #cf-bottom-nav button.active {
      color: #00ff88;
    }
    #cf-bottom-nav button svg {
      width: 20px; height: 20px;
    }
  `;

  return {
    inject() {
      const style = document.createElement('style');
      style.id = 'cf-responsive';
      style.textContent = CSS;
      document.head.appendChild(style);
      console.log('[ResponsiveCSS] styles injectés');
    },

    /**
     * Créer la barre de navigation bottom mobile
     * @param {Array} tabs — [{ id, label, icon (SVG path d=) }]
     * @param {Function} onSelect — callback(tabId)
     */
    createBottomNav(tabs, onSelect) {
      if (document.getElementById('cf-bottom-nav')) return;

      const nav = document.createElement('div');
      nav.id = 'cf-bottom-nav';
      nav.innerHTML = tabs.map(t => `
        <button data-tab="${t.id}" title="${t.label}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="${t.icon}" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${t.label}</span>
        </button>
      `).join('');

      document.body.appendChild(nav);

      nav.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(btn.dataset.tab);
      });

      // Activer le premier tab par défaut
      nav.querySelector('button')?.classList.add('active');
    },
  };

})();


/* ============================================================
   MODULE 3 — PinAuth
   Authentification PIN 4-6 chiffres, hashé SHA-256.
   Overlay fullscreen au premier lancement.
   ============================================================ */

const PinAuth = (() => {

  const STORAGE_KEY = 'cf_pin_hash';
  const SESSION_KEY = 'cf_session_ok';

  /* ---- Crypto ---- */
  async function _hash(pin) {
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(pin + 'cf_salt_2026') // salt fixe
    );
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /* ---- UI ---- */
  function _createOverlay(mode, resolve) {
    const overlay = document.createElement('div');
    overlay.id = 'cf-pin-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: #0a0a0f;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const isSetup = mode === 'setup';
    overlay.innerHTML = `
      <div style="
        background: #12121f; border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; padding: 40px 32px; width: 320px; text-align: center;
      ">
        <div style="
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #00ff88, #00bfff);
          margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style="color:#fff; font-size:18px; margin:0 0 6px; font-weight:600;">
          ${isSetup ? 'Créer votre PIN' : 'Accès sécurisé'}
        </h2>
        <p style="color:rgba(255,255,255,0.4); font-size:13px; margin:0 0 24px;">
          ${isSetup ? 'Choisissez un code PIN à 4–6 chiffres' : 'Entrez votre code PIN'}
        </p>

        <!-- Indicateurs de saisie -->
        <div id="cf-pin-dots" style="display:flex;justify-content:center;gap:10px;margin-bottom:24px;">
          ${[0,1,2,3].map(i =>
            `<div data-dot="${i}" style="
              width:14px;height:14px;border-radius:50%;
              background:rgba(255,255,255,0.15);
              transition:background 0.15s;
            "></div>`
          ).join('')}
        </div>

        <!-- Clavier numérique -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
          ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
            <button data-key="${k}" style="
              background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
              border-radius:12px; color:#fff; font-size:18px; font-weight:500;
              height:56px; cursor:pointer; transition:background 0.1s;
              ${k === '' ? 'visibility:hidden;' : ''}
            " ${k === '' ? 'disabled' : ''}>${k}</button>
          `).join('')}
        </div>

        <div id="cf-pin-error" style="
          color:#ff4d4d; font-size:12px; margin-top:16px;
          min-height:18px; transition:opacity 0.3s;
        "></div>

        ${isSetup ? '' : `
          <button id="cf-pin-forgot" style="
            background:transparent; border:none; color:rgba(255,255,255,0.25);
            font-size:12px; cursor:pointer; margin-top:8px; padding:4px;
          ">Code oublié ? Réinitialiser l'app</button>
        `}
      </div>
    `;

    document.body.appendChild(overlay);

    // Style hover sur boutons
    overlay.querySelectorAll('button[data-key]').forEach(btn => {
      btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,0.12)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.06)');
    });

    return overlay;
  }

  function _runPinUI(mode) {
    return new Promise(resolve => {
      const overlay = _createOverlay(mode, resolve);
      let pin = '';
      let confirmPin = '';
      let phase = 'enter'; // 'enter' | 'confirm'

      function updateDots() {
        overlay.querySelectorAll('[data-dot]').forEach((dot, i) => {
          dot.style.background = i < pin.length
            ? 'linear-gradient(135deg, #00ff88, #00bfff)'
            : 'rgba(255,255,255,0.15)';
        });
      }

      function setError(msg) {
        const el = overlay.querySelector('#cf-pin-error');
        el.textContent = msg;
        // Shake animation
        overlay.querySelector('[style*="background: #12121f"]').style.animation = 'none';
        setTimeout(() => { el.textContent = msg; }, 10);
      }

      async function submit() {
        if (mode === 'verify') {
          const stored = localStorage.getItem(STORAGE_KEY);
          const hashed = await _hash(pin);
          if (hashed === stored) {
            sessionStorage.setItem(SESSION_KEY, '1');
            overlay.remove();
            resolve(true);
          } else {
            setError('Code incorrect. Réessayez.');
            pin = '';
            updateDots();
          }
        } else {
          // Setup : 2 phases
          if (phase === 'enter') {
            confirmPin = pin;
            pin = '';
            phase = 'confirm';
            overlay.querySelector('p').textContent = 'Confirmez votre PIN';
            setError('');
            updateDots();
          } else {
            if (pin === confirmPin) {
              const hashed = await _hash(pin);
              localStorage.setItem(STORAGE_KEY, hashed);
              sessionStorage.setItem(SESSION_KEY, '1');
              overlay.remove();
              resolve(true);
            } else {
              setError('Les codes ne correspondent pas.');
              pin = '';
              confirmPin = '';
              phase = 'enter';
              overlay.querySelector('p').textContent = 'Choisissez un code PIN à 4–6 chiffres';
              updateDots();
            }
          }
        }
      }

      overlay.addEventListener('click', async e => {
        const key = e.target.closest('[data-key]')?.dataset.key;
        if (!key) return;

        if (key === '⌫') {
          pin = pin.slice(0, -1);
        } else if (pin.length < 6) {
          pin += key;
          if (pin.length >= 4) {
            // Auto-submit à 4 chiffres (ou attendre jusqu'à 6)
            updateDots();
            if (pin.length === 4) {
              setTimeout(submit, 120);
              return;
            }
          }
        }
        updateDots();
      });

      // Navigation clavier
      document.addEventListener('keydown', function handler(e) {
        if (!/^\d$/.test(e.key) && e.key !== 'Backspace') return;
        if (e.key === 'Backspace') {
          pin = pin.slice(0, -1);
        } else if (pin.length < 6) {
          pin += e.key;
          if (pin.length === 4) {
            updateDots();
            setTimeout(submit, 120);
            document.removeEventListener('keydown', handler);
            return;
          }
        }
        updateDots();
      });

      // Bouton "oublié"
      overlay.querySelector('#cf-pin-forgot')?.addEventListener('click', () => {
        if (confirm('Réinitialiser supprimera toutes les données. Continuer ?')) {
          localStorage.clear();
          sessionStorage.clear();
          location.reload();
        }
      });
    });
  }

  /* ---- API publique ---- */
  return {

    /** Vérifier si un PIN est déjà configuré */
    isConfigured() {
      return !!localStorage.getItem(STORAGE_KEY);
    },

    /** Vérifier si la session est déjà authentifiée */
    isAuthenticated() {
      return !!sessionStorage.getItem(SESSION_KEY);
    },

    /**
     * Point d'entrée principal.
     * Affiche setup ou verify selon l'état.
     * Retourne une Promise<boolean>.
     */
    async require() {
      if (this.isAuthenticated()) return true;
      const mode = this.isConfigured() ? 'verify' : 'setup';
      return _runPinUI(mode);
    },

    /** Changer le PIN (demande l'ancien d'abord) */
    async change() {
      const ok = await _runPinUI('verify');
      if (ok) return _runPinUI('setup');
      return false;
    },

    /** Déconnexion (garde le PIN, efface la session) */
    logout() {
      sessionStorage.removeItem(SESSION_KEY);
    },
  };

})();


/* ============================================================
   FACADE — CoreFoundation
   Point d'entrée unique pour les 3 modules.
   ============================================================ */

const CoreFoundation = {

  /**
   * Initialiser l'ensemble des modules
   * @param {Object} options
   * @param {string}   options.appName      — Nom de l'app (pour logs)
   * @param {boolean}  options.pinRequired  — Activer l'auth PIN (défaut: true)
   * @param {Array}    options.bottomNavTabs — Tabs pour la barre mobile (optionnel)
   * @param {Function} options.onTabChange  — Callback changement de tab mobile
   * @param {Function} options.onReady      — Callback après auth réussie
   */
  async init({
    appName = 'App',
    pinRequired = true,
    bottomNavTabs = null,
    onTabChange = null,
    onReady = null,
  } = {}) {

    console.log(`[CoreFoundation] init — ${appName}`);

    // 1. Styles responsive
    ResponsiveCSS.inject();

    // 2. AppState
    AppState.init();

    // 3. Barre de navigation mobile (optionnelle)
    if (bottomNavTabs && onTabChange) {
      ResponsiveCSS.createBottomNav(bottomNavTabs, onTabChange);
    }

    // 4. Auth PIN
    if (pinRequired) {
      const ok = await PinAuth.require();
      if (!ok) {
        console.warn('[CoreFoundation] auth refusée');
        return false;
      }
    }

    console.log(`[CoreFoundation] prêt ✓`);
    if (onReady) onReady();
    return true;
  },

  // Exposer les modules directement
  AppState,
  PinAuth,
  ResponsiveCSS,
};

// Export global
window.CoreFoundation = CoreFoundation;
window.AppState       = AppState;
window.PinAuth        = PinAuth;
window.ResponsiveCSS  = ResponsiveCSS;
