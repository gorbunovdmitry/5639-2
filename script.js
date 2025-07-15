console.log('script.js loaded');
// --- Константы ---
const RATE = 0.20; // 20% годовых
const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 100000;
const TERMS = [3, 6, 9, 12];
const STORAGE_KEY = 'installment-completed';

// --- АНАЛИТИКА ---
const VARIANT = 'ghk_5639_var2';
const METRIKA_ID = 96171108;

function sendGA(event, params = {}) {
  console.log('[GA4] sendGA', event, params);
  if (typeof gtag === 'function') {
    gtag('event', event, params);
  }
}
function sendYM(event, params = {}) {
  console.log('[YM] sendYM', event, params);
  if (typeof ym === 'function') {
    ym(METRIKA_ID, 'reachGoal', event, params);
  }
}

// --- Состояние ---
let state = {
  amount: 100000,
  term: 12,
  payment: null,
  serviceFee: null,
  // Флаги для аналитики
  analytics: {
    chooseLoanScreen: false,
    agreementScreen: false,
    endScreen: false,
    moreInfoScreen: false
  }
};

// --- Утилиты ---
function formatMoney(num) {
  return num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
}
function formatMoneyPrecise(num) {
  return num.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
}

function calcPayment(amount, term) {
  const monthlyRate = RATE / 12;
  const n = term;
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  return Math.round(payment);
}
function calcServiceFee(amount, term) {
  // Сумма всех процентов за год (если срок < 12 мес — пропорционально)
  const totalInterest = amount * RATE * (term / 12);
  return totalInterest;
}

// --- Рендеринг ---
function render() {
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    renderSuccess();
    return;
  }
  const hash = location.hash.replace('#', '');
  if (hash === 'confirm') {
    renderConfirm();
  } else if (hash === 'success') {
    renderSuccess();
  } else if (hash === 'info') {
    renderInfo();
  } else {
    renderCalculator();
  }
}

function renderCalculator() {
  document.title = 'Рассрочка';
  const app = document.getElementById('app');
  // --- АНАЛИТИКА: Просмотр экрана выбора условий рассрочки ---
  if (!state.analytics.chooseLoanScreen) {
    sendGA('5639_page_view_choose_loan_var2');
    sendYM('5639_page_view_choose_loan_var2');
    state.analytics.chooseLoanScreen = true;
  }
  // Если поле уже есть, не пересоздаём его, а только обновляем связанные части
  if (document.getElementById('amount')) {
    // Только обновляем связанные значения
    const amountNum = parseInt(state.amount, 10);
    const isAmountValid = amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;
    state.payment = calcPayment(state.amount, state.term);
    state.serviceFee = calcServiceFee(state.amount, state.term);
    document.querySelector('.card-title').textContent = formatMoney(state.payment) + ' в месяц';
    document.querySelector('.card small').textContent = 'включая плату за услугу';
    document.getElementById('amount').className = isAmountValid ? '' : 'input-error';
    document.getElementById('nextBtn').disabled = !isAmountValid;
    return;
  }
  // Первый рендер — создаём всю разметку
  app.innerHTML = `
    <h2 class="screen-title">Получите до&nbsp;100&nbsp;000&nbsp;₽&nbsp;в&nbsp;рассрочку</h2>
    <p style="margin-bottom:24px;">Деньги придут на вашу карту. И не нужно идти в банк</p>
    <label for="amount" style="color:#888;font-size:1.1rem;">Введите сумму</label>
    <input id="amount" type="number" value="${state.amount}" autocomplete="off" class="" />
    <div style="color:#888;font-size:1rem;margin-bottom:16px;">от 1 000 ₽ до 100 000 ₽</div>
    <div style="color:#888;font-size:1.1rem;">Выберите срок</div>
    <div class="term-btns">
      ${TERMS.map(term => `<button class="term-btn${state.term === term ? ' selected' : ''}" data-term="${term}">${term} мес</button>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">${formatMoney(calcPayment(state.amount, state.term))} в месяц</div>
      <small>включая плату за услугу</small>
    </div>
    <button class="button" id="nextBtn">Продолжить</button>
  `;
  document.getElementById('amount').addEventListener('input', e => {
    state.amount = e.target.value;
    renderCalculator();
  });
  document.querySelectorAll('.term-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      state.term = parseInt(btn.dataset.term);
      renderCalculator();
    });
  });
  document.getElementById('nextBtn').addEventListener('click', () => {
    // --- АНАЛИТИКА: Клик по "Продолжить" ---
    sendGA('5639_click_continue_var2');
    sendYM('5639_click_continue_var2');
    location.hash = 'confirm';
  });
}

function renderConfirm() {
  state.payment = calcPayment(state.amount, state.term);
  state.serviceFee = calcServiceFee(state.amount, state.term);
  document.title = 'Подтверждение';
  const amountNum = parseInt(state.amount, 10);
  let infoBlockHtml = '';
  if (amountNum >= 50000 && amountNum <= 100000) {
    infoBlockHtml = `
      <div class="info-block" id="infoBlock">
        <span class="info-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.1362 17.3359V10.6745H10.8741V17.3359H13.1362Z" fill="#212124"/>
            <path d="M13.4541 7.88802C13.4541 8.69056 12.8035 9.34115 12.001 9.34115C11.1984 9.34115 10.5479 8.69056 10.5479 7.88802C10.5479 7.08548 11.1984 6.4349 12.001 6.4349C12.8035 6.4349 13.4541 7.08548 13.4541 7.88802Z" fill="#212124"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M22.001 12.0078C22.001 17.5307 17.5238 22.0078 12.001 22.0078C6.47813 22.0078 2.00098 17.5307 2.00098 12.0078C2.00098 6.48496 6.47813 2.00781 12.001 2.00781C17.5238 2.00781 22.001 6.48496 22.001 12.0078ZM20.001 12.0078C20.001 16.4261 16.4193 20.0078 12.001 20.0078C7.5827 20.0078 4.00098 16.4261 4.00098 12.0078C4.00098 7.58953 7.5827 4.00781 12.001 4.00781C16.4193 4.00781 20.001 7.58953 20.001 12.0078Z" fill="#212124"/>
          </svg>
        </span>
        <span class="info-text">Зачислим через 4 часа<br>или чуть позже</span>
        <span class="info-arrow" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_7502_6226)">
              <path d="M20.999 12.0078L15.499 17.5078L16.999 19.0078C20.3185 15.8836 23.999 12.0078 23.999 12.0078C23.999 12.0078 20.3185 8.13201 16.999 5.00781L15.499 6.50781L20.999 12.0078Z" fill="#BABBC2"/>
            </g>
            <defs>
              <clipPath id="clip0_7502_6226">
                <rect width="24" height="24" fill="white" transform="translate(-0.000976562 0.0078125)"/>
              </clipPath>
            </defs>
          </svg>
        </span>
      </div>
    `;
  }
  document.getElementById('app').innerHTML = `
    <div class="header-row">
      <button id="backBtn" aria-label="Назад">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.6799 11H7.96795L13.3439 5.4L11.9999 4L4.31995 12L11.9999 20L13.3439 18.6L7.96795 13H19.6799V11Z" fill="#030306" fill-opacity="0.88"/>
        </svg>
      </button>
    </div>
    <h1 class="screen-title-confirm">Всё проверьте, и можно оформлять</h1>
    <ul class="confirm-list">
      <li><span class="label">Всего в рассрочку</span><span class="value">${formatMoney(state.amount)}</span></li>
      <li><span class="label">Плата за услугу</span><span class="value">${formatMoneyPrecise(state.serviceFee)}</span></li>
      <li><span class="label">Платёж в месяц</span><span class="value">${formatMoney(state.payment)}</span></li>
      <li><span class="label">Срок</span><span class="value">${state.term} месяцев</span></li>
    </ul>
    <div style="color:#888;font-size:1.1rem;margin-bottom:8px;">Куда зачислить деньги</div>
    <div class="account-box"><span><span class="ruble">₽</span></span>Текущий счет</div>
    ${infoBlockHtml}
    <button class="button" id="submitBtn">Оформить рассрочку</button>
  `;
  document.getElementById('backBtn').addEventListener('click', () => {
    location.hash = '';
  });
  // --- АНАЛИТИКА: Просмотр экрана подтверждения рассрочки ---
  if (!state.analytics.agreementScreen) {
    sendGA('5639_page_view_agreement_var2');
    sendYM('5639_page_view_agreement_var2');
    state.analytics.agreementScreen = true;
  }
  document.getElementById('submitBtn').addEventListener('click', () => {
    // --- АНАЛИТИКА: Клик по "Оформить рассрочку" ---
    const params = {
      date: Date.now(),
      variant: VARIANT,
      sum: state.amount,
      period: `${state.term} мес`,
      payment: state.payment
    };
    sendGA('5639_click_agreement_make_deal_var2', params);
    sendYM('5639_click_agreement_make_deal_var2', params);
    location.hash = 'success';
  });
  if (infoBlockHtml) {
    document.getElementById('infoBlock').addEventListener('click', () => {
      // --- АНАЛИТИКА: Клик по "more info" на экране подтверждения ---
      sendGA('5639_click_agreement_more_info_var2');
      sendYM('5639_click_agreement_more_info_var2');
      location.hash = 'info';
    });
  }
}

function renderInfo() {
  document.title = 'Порядок зачисления суммы рассрочки';
  document.getElementById('app').innerHTML = `
    <button id="infoCloseBtn" class="info-close-btn" aria-label="Закрыть" style="position:absolute;top:16px;right:16px;background:none;border:none;padding:0;z-index:10;">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M31 18.4L29.6 17L24 22.6L18.4 17L17 18.4L22.6 24L17 29.6L18.4 31L24 25.4L29.6 31L31 29.6L25.4 24L31 18.4Z" fill="#0E0E0E"/>
      </svg>
    </button>
    <h2 class="screen-title" style="margin-top:32px;">Порядок зачисления<br>суммы рассрочки</h2>
    <p style="font-size:1.15rem;margin-bottom:18px;">По закону о защите от мошенничества, кредитные деньги зачислим<br>через некоторое время.</p>
    <p style="font-size:1.15rem;margin-bottom:18px;">Срок зачисления зависит от суммы долга по действующим рассрочкам и суммы новой рассрочки</p>
    <h3 style="font-size:1.2rem;margin-top:32px;margin-bottom:16px;">Как быстро поступят деньги</h3>
    <ul class="info-list">
      <li>до 49 999 ₽ — сразу на карту</li>
      <li>от 50 000 до 100 000 ₽ — перечислим деньги через 4 часа или чуть позже</li>
      <li>свыше 100 000 ₽ — перечислим деньги через 48 часов или чуть позже</li>
    </ul>
    <h3 style="font-size:1.2rem;margin-top:32px;margin-bottom:16px;">Пример</h3>
    <p style="font-size:1.15rem;margin-bottom:32px;">У Саши есть действующая рассрочка 35 000 ₽ и он оформляет новую рассрочку на сумму 25 000 ₽. Поскольку общая сумма составляет 60 000 рублей — новую рассрочку сможем перечислить только через 4 часа.</p>
    <button class="info-ok-btn" id="infoOkBtn">Понятно</button>
  `;
  // --- АНАЛИТИКА: Просмотр экрана информации (после клика на more info) ---
  if (!state.analytics.moreInfoScreen) {
    sendGA('5639_page_view_more_info_var2');
    sendYM('5639_page_view_more_info_var2');
    state.analytics.moreInfoScreen = true;
  }
  document.getElementById('infoOkBtn').addEventListener('click', () => {
    location.hash = 'confirm';
  });
  document.getElementById('infoCloseBtn').addEventListener('click', () => {
    location.hash = 'confirm';
  });
}

function renderSuccess() {
  document.title = 'Спасибо!';
  document.getElementById('app').innerHTML = `
    <img src="img/success.png" alt="Успех" class="success-img" style="display:block;margin:48px auto 32px auto;width:160px;height:160px;object-fit:contain;" />
    <h2 style="text-align:center;">Только тссс</h2>
    <p style="text-align:center;font-size:1.2rem;">Вы поучаствовали в очень важном исследовании, которое поможет улучшить продукт. Вы – наш герой!</p>
  `;
  // --- АНАЛИТИКА: Просмотр финальной страницы ---
  if (!state.analytics.endScreen) {
    sendGA('5639_end_page_view_var2');
    sendYM('5639_end_page_view_var2');
    state.analytics.endScreen = true;
  }
  // Ставим флаг, чтобы при обновлении всегда показывалась заглушка
  localStorage.setItem(STORAGE_KEY, 'true');
  // Блокируем возврат назад
  window.history.pushState(null, '', window.location.href);
  window.onpopstate = function() {
    window.history.go(1);
  };
}

// --- Инициализация ---
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  // Если уже завершено — сразу показываем заглушку
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    location.hash = 'success';
  }
  render();
}); 