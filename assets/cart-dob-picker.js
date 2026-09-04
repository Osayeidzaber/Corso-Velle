/**
 * Cart Date of Birth Picker Component
 * Collects, validates, and synchronizes customer birthdates with Shopify Order Notes and Cart Attributes.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

class CartDobPicker extends HTMLElement {
  /** @type {HTMLSelectElement | null} */
  #monthSelect = null;
  /** @type {HTMLSelectElement | null} */
  #daySelect = null;
  /** @type {HTMLSelectElement | null} */
  #yearSelect = null;
  /** @type {HTMLInputElement | null} */
  #attributeField = null;
  /** @type {HTMLInputElement | null} */
  #noteField = null;
  /** @type {HTMLElement | null} */
  #verifiedEl = null;
  /** @type {HTMLElement | null} */
  #verifiedDateEl = null;
  /** @type {HTMLElement | null} */
  #errorEl = null;
  /** @type {HTMLElement | null} */
  #errorTextEl = null;
  /** @type {HTMLButtonElement | null} */
  #skipBtn = null;
  /** @type {HTMLButtonElement | null} */
  #undoBtn = null;
  /** @type {HTMLElement | null} */
  #skippedEl = null;
  /** @type {HTMLElement | null} */
  #fieldsEl = null;
  /** @type {HTMLElement | null} */
  #requiredBadgeEl = null;

  /** @type {boolean} */
  #isSkipped = false;
  /** @type {AbortController | null} */
  #activeFetch = null;
  /** @type {boolean} */
  #hasAttemptedSubmit = false;

  connectedCallback() {
    this.#initDOMElements();
    this.#ensureFormAssociation();
    this.#initDays();
    this.#restoreValue();
    this.#bindEvents();
    this.#bindCheckoutInterception();
  }

  disconnectedCallback() {
    this.#unbindCheckoutInterception();
  }

  #initDOMElements() {
    this.#monthSelect = this.querySelector('[data-part="month"]');
    this.#daySelect = this.querySelector('[data-part="day"]');
    this.#yearSelect = this.querySelector('[data-part="year"]');
    this.#attributeField = this.querySelector('#cart-dob-attribute-field');
    this.#noteField = this.querySelector('#cart-dob-note-field');
    this.#verifiedEl = this.querySelector('.cart-dob-picker__verified');
    this.#verifiedDateEl = this.querySelector('.cart-dob-picker__verified-date');
    this.#errorEl = this.querySelector('.cart-dob-picker__error');
    this.#errorTextEl = this.querySelector('.cart-dob-picker__error-text');
    this.#skipBtn = this.querySelector('[data-skip-btn]');
    this.#undoBtn = this.querySelector('[data-undo-btn]');
    this.#skippedEl = this.querySelector('.cart-dob-picker__skipped');
    this.#fieldsEl = this.querySelector('.cart-dob-picker__fields');
    this.#requiredBadgeEl = this.querySelector('[data-required-badge]');
  }

  #ensureFormAssociation() {
    const parentForm = this.closest('form');
    if (parentForm) {
      this.#attributeField?.removeAttribute('form');
      this.#noteField?.removeAttribute('form');
    } else {
      const cartForm = document.getElementById('cart-form');
      if (cartForm) {
        this.#attributeField?.setAttribute('form', 'cart-form');
        this.#noteField?.setAttribute('form', 'cart-form');
      }
    }
  }

  #bindEvents() {
    const handlePartChange = () => {
      this.#updateDaysForMonth();
      this.#handleChange();
    };

    this.#monthSelect?.addEventListener('change', handlePartChange);
    this.#yearSelect?.addEventListener('change', handlePartChange);
    this.#daySelect?.addEventListener('change', () => this.#handleChange());

    this.#skipBtn?.addEventListener('click', () => this.#skip(true));
    this.#undoBtn?.addEventListener('click', () => this.#unskip());

    // Clear error highlights on focus/input
    [this.#monthSelect, this.#daySelect, this.#yearSelect].forEach((select) => {
      select?.addEventListener('focus', () => {
        select.classList.remove('cart-dob-picker__select--invalid');
        if (this.isValid()) {
          this.#hideError();
        }
      });
    });
  }

  #getDaysInMonth(year, month) {
    if (!month) return 31;
    const m = parseInt(month, 10);
    if ([4, 6, 9, 11].includes(m)) return 30;
    if (m === 2) {
      if (!year) return 29; // allow 29 until year is picked
      const y = parseInt(year, 10);
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return isLeap ? 29 : 28;
    }
    return 31;
  }

  #initDays() {
    this.#updateDaysForMonth();
  }

  #updateDaysForMonth() {
    if (!this.#daySelect) return;
    const currentDay = this.#daySelect.value;
    const maxDays = this.#getDaysInMonth(this.#yearSelect?.value, this.#monthSelect?.value);

    // Update options in daySelect
    const options = this.#daySelect.options;
    for (let i = 1; i < options.length; i++) {
      const dayVal = parseInt(options[i].value, 10);
      if (dayVal > maxDays) {
        options[i].hidden = true;
        options[i].disabled = true;
      } else {
        options[i].hidden = false;
        options[i].disabled = false;
      }
    }

    if (currentDay && parseInt(currentDay, 10) > maxDays) {
      this.#daySelect.value = String(maxDays).padStart(2, '0');
    }
  }

  #restoreValue() {
    // 0. Try from localStorage if skipped
    try {
      if (localStorage.getItem('shopify_cart_dob_skipped') === 'true') {
        this.#skip(false);
        return;
      }
    } catch (e) {}

    // 1. Try from attribute field (rendered from cart.attributes['Date of Birth'])
    let savedDob = this.#attributeField?.value;

    if (savedDob === 'Skipped') {
      this.#skip(false);
      return;
    }

    // 2. Try from localStorage if not present
    if (!savedDob) {
      try {
        savedDob = localStorage.getItem('shopify_cart_dob');
      } catch (e) {
        // Ignore storage errors
      }
    }

    // 3. Try parsing from cart note
    if (!savedDob && this.#noteField?.value) {
      const match = this.#noteField.value.match(/Date of Birth:\s*([^\n\r]+)/i);
      if (match) savedDob = match[1].trim();
    }

    if (savedDob) {
      this.#populateDate(savedDob);
    }
  }

  #skip(triggerCartUpdate = true) {
    this.#isSkipped = true;
    this.#hideError();
    if (this.#verifiedEl) this.#verifiedEl.style.display = 'none';
    if (this.#fieldsEl) this.#fieldsEl.style.display = 'none';
    if (this.#skippedEl) this.#skippedEl.style.display = 'flex';
    if (this.#skipBtn) this.#skipBtn.style.display = 'none';
    if (this.#requiredBadgeEl) this.#requiredBadgeEl.style.opacity = '0.35';

    // Clear invalid styling
    [this.#monthSelect, this.#daySelect, this.#yearSelect].forEach((el) => {
      el?.classList.remove('cart-dob-picker__select--invalid');
    });

    try {
      localStorage.setItem('shopify_cart_dob_skipped', 'true');
    } catch (e) {}

    if (this.#attributeField) {
      this.#attributeField.value = 'Skipped';
    }

    if (triggerCartUpdate) {
      const existingNote = (this.#noteField?.value || '').replace(/Date of Birth:\s*[^\n\r]+/gi, '').trim();
      this.#sendCartUpdate('Skipped', existingNote);
    }
  }

  #unskip() {
    this.#isSkipped = false;
    if (this.#fieldsEl) this.#fieldsEl.style.display = 'grid';
    if (this.#skippedEl) this.#skippedEl.style.display = 'none';
    if (this.#skipBtn) this.#skipBtn.style.display = '';
    if (this.#requiredBadgeEl) this.#requiredBadgeEl.style.opacity = '1';

    try {
      localStorage.removeItem('shopify_cart_dob_skipped');
    } catch (e) {}

    if (this.isValid() && this.#monthSelect?.value && this.#daySelect?.value && this.#yearSelect?.value) {
      this.#showVerified();
      this.#syncValues(true);
    } else {
      if (this.#attributeField) this.#attributeField.value = '';
    }
  }

  #populateDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || dateStr === 'Skipped') return;
    // Format could be YYYY-MM-DD or DD/MM/YYYY or DD Month YYYY
    let year = '', month = '', day = '';

    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[2]?.length === 4) {
        // DD/MM/YYYY or MM/DD/YYYY
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      }
    }

    if (month && this.#monthSelect) this.#monthSelect.value = month;
    if (year && this.#yearSelect) this.#yearSelect.value = year;
    this.#updateDaysForMonth();
    if (day && this.#daySelect) this.#daySelect.value = day;

    if (this.isValid()) {
      this.#syncValues(false);
      this.#showVerified();
    }
  }

  #handleChange() {
    if (this.#isSkipped) {
      this.#isSkipped = false;
      if (this.#fieldsEl) this.#fieldsEl.style.display = 'grid';
      if (this.#skippedEl) this.#skippedEl.style.display = 'none';
      if (this.#skipBtn) this.#skipBtn.style.display = '';
      try { localStorage.removeItem('shopify_cart_dob_skipped'); } catch(e) {}
    }

    const isNowValid = this.isValid();

    if (isNowValid) {
      this.#hideError();
      this.#showVerified();
      this.#syncValues(true);
    } else {
      if (this.#verifiedEl) this.#verifiedEl.style.display = 'none';
      if (this.#hasAttemptedSubmit) {
        this.#showError();
      }
    }
  }

  get isRequired() {
    return this.getAttribute('data-required') !== 'false';
  }

  isValid() {
    if (this.#isSkipped) {
      return true;
    }

    const m = this.#monthSelect?.value;
    const d = this.#daySelect?.value;
    const y = this.#yearSelect?.value;

    if (!this.isRequired && !m && !d && !y) {
      return true;
    }

    if (!m || !d || !y) {
      return false;
    }

    const monthNum = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    const yearNum = parseInt(y, 10);

    if (isNaN(monthNum) || isNaN(dayNum) || isNaN(yearNum)) {
      return false;
    }

    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    if (
      dateObj.getFullYear() !== yearNum ||
      dateObj.getMonth() !== monthNum - 1 ||
      dateObj.getDate() !== dayNum
    ) {
      return false;
    }

    // Must be in the past
    const now = new Date();
    if (dateObj >= now) {
      return false;
    }

    return true;
  }

  #formatDate() {
    const m = this.#monthSelect?.value;
    const d = this.#daySelect?.value;
    const y = this.#yearSelect?.value;
    if (!m || !d || !y) return null;

    const monthIdx = parseInt(m, 10) - 1;
    const monthName = MONTH_NAMES[monthIdx] || m;
    const isoDate = `${y}-${m}-${d}`;
    const standardDate = `${d}/${m}/${y}`;
    const humanDate = `${parseInt(d, 10)} ${monthName} ${y}`;

    return {
      iso: isoDate,
      standard: standardDate,
      human: humanDate,
      raw: `${standardDate} (${humanDate})`
    };
  }

  #showVerified() {
    const date = this.#formatDate();
    if (!date) return;

    if (this.#verifiedDateEl) {
      this.#verifiedDateEl.textContent = date.human;
    }
    if (this.#verifiedEl) {
      this.#verifiedEl.style.display = 'flex';
    }
  }

  #showError(customMessage) {
    if (!this.#errorEl) return;
    this.classList.add('cart-dob-picker--error');
    this.classList.remove('cart-dob-picker--shake');
    // Trigger reflow to restart shake animation
    void this.offsetWidth;
    this.classList.add('cart-dob-picker--shake');

    if (this.#errorTextEl) {
      this.#errorTextEl.textContent =
        customMessage || 'Please select your date of birth to proceed to checkout.';
    }
    this.#errorEl.style.display = 'flex';

    // Highlight missing fields
    if (!this.#monthSelect?.value) this.#monthSelect?.classList.add('cart-dob-picker__select--invalid');
    if (!this.#daySelect?.value) this.#daySelect?.classList.add('cart-dob-picker__select--invalid');
    if (!this.#yearSelect?.value) this.#yearSelect?.classList.add('cart-dob-picker__select--invalid');
  }

  #hideError() {
    this.classList.remove('cart-dob-picker--error', 'cart-dob-picker--shake');
    [this.#monthSelect, this.#daySelect, this.#yearSelect].forEach((el) => {
      el?.classList.remove('cart-dob-picker__select--invalid');
    });
    if (this.#errorEl) {
      this.#errorEl.style.display = 'none';
    }
  }

  #syncValues(triggerCartUpdate = false) {
    const date = this.#formatDate();
    if (!date) return;

    // 1. Update hidden cart attribute input
    if (this.#attributeField) {
      this.#attributeField.value = date.standard;
    }

    // 2. Update note representation
    const dobNoteLine = `Date of Birth: ${date.standard}`;
    let fullNote = '';

    const cartNoteTextarea = document.querySelector('textarea#cart-note, textarea[name="note"]');
    if (cartNoteTextarea instanceof HTMLTextAreaElement) {
      const existing = cartNoteTextarea.value.replace(/Date of Birth:\s*[^\n\r]+/gi, '').trim();
      fullNote = existing ? `${dobNoteLine}\n${existing}` : dobNoteLine;
      cartNoteTextarea.value = fullNote;
    } else {
      const existing = (this.#noteField?.value || '').replace(/Date of Birth:\s*[^\n\r]+/gi, '').trim();
      fullNote = existing ? `${dobNoteLine}\n${existing}` : dobNoteLine;
    }

    if (this.#noteField) {
      this.#noteField.value = fullNote;
    }

    // 3. Save to localStorage
    try {
      localStorage.setItem('shopify_cart_dob', date.standard);
    } catch (e) {
      // Ignore storage errors
    }

    // 4. Send Ajax update to Shopify Cart API to guarantee persistence
    if (triggerCartUpdate) {
      this.#sendCartUpdate(date.standard, fullNote);
    }
  }

  async #sendCartUpdate(birthdate, note) {
    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }
    const abortController = new AbortController();
    this.#activeFetch = abortController;

    const cartUpdateUrl = window.Theme?.routes?.cart_update_url || '/cart/update.js';

    try {
      await fetch(cartUpdateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          attributes: {
            'Date of Birth': birthdate,
          },
          note: note,
        }),
        signal: abortController.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('[cart-dob-picker] Failed to update cart attributes/note:', err);
      }
    } finally {
      this.#activeFetch = null;
    }
  }

  /* ----------------------------------------------------
   * Checkout Button Interception & Validation Guard
   * ---------------------------------------------------- */
  #checkoutHandler = (event) => {
    if (!this.isRequired) return true;

    if (!this.isValid()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      this.#hasAttemptedSubmit = true;
      this.#showError('Please enter your date of birth to proceed to checkout.');

      // Smoothly scroll this picker into view
      this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Focus first missing select
      if (!this.#monthSelect?.value) {
        this.#monthSelect?.focus();
      } else if (!this.#daySelect?.value) {
        this.#daySelect?.focus();
      } else if (!this.#yearSelect?.value) {
        this.#yearSelect?.focus();
      }

      return false;
    }

    // Ensure hidden inputs are up to date
    this.#syncValues(false);
    return true;
  };

  #bindCheckoutInterception() {
    // Intercept standard checkout buttons
    const selectors = [
      '#checkout',
      'button[name="checkout"]',
      '.cart__checkout-button',
      '.cart-drawer__checkout',
      '.cart-checkout-btn',
      'form#cart-form',
      'form#CartDrawerCheckoutForm',
      'form#CartCheckoutForm'
    ];

    document.addEventListener('click', this.#onDocumentClick, true);
    document.addEventListener('submit', this.#onDocumentSubmit, true);
  }

  #unbindCheckoutInterception() {
    document.removeEventListener('click', this.#onDocumentClick, true);
    document.removeEventListener('submit', this.#onDocumentSubmit, true);
  }

  #isCheckoutTarget(target) {
    if (!(target instanceof Element)) return false;

    // Direct match or within checkout button
    const btn = target.closest(
      '#checkout, button[name="checkout"], .cart__checkout-button, .cart-drawer__checkout, .cart-checkout-btn, .shopify-payment-button__button'
    );
    if (btn) return true;

    // Express checkout / additional checkout buttons
    const expressBtn = target.closest(
      '.additional-checkout-buttons, [data-shopify="payment-button"], shopify-accelerated-checkout-cart'
    );
    if (expressBtn) return true;

    return false;
  }

  #onDocumentClick = (event) => {
    if (this.#isCheckoutTarget(event.target)) {
      if (!this.#checkoutHandler(event)) {
        return;
      }
    }
  };

  #onDocumentSubmit = (event) => {
    const form = event.target;
    if (
      form instanceof HTMLFormElement &&
      (form.id === 'cart-form' ||
       form.id === 'CartDrawerCheckoutForm' ||
       form.id === 'CartCheckoutForm' ||
       form.action?.includes('/checkout') ||
       form.action?.includes('/cart'))
    ) {
      // If submitting by pressing enter or via code
      const submitter = event.submitter;
      if (submitter && submitter.getAttribute('name') !== 'checkout') {
        // Not a checkout submit (e.g. discount apply, quantity update)
        return;
      }

      if (!this.#checkoutHandler(event)) {
        return;
      }
    }
  };
}

if (!customElements.get('cart-dob-picker')) {
  customElements.define('cart-dob-picker', CartDobPicker);
}

export { CartDobPicker };
