import 'chromereload/devonly';
import {getFiatConverter} from './fiat';

const SELECTOR_TOTAL = 'li.total';
const SELECTOR_TOTAL_BTC = 'li.total strong:first-of-type';
const SELECTOR_TOTAL_FIAT = '#total_fiat';
const SELECTOR_BTC_HEADER = 'ul.accountInfo-lists li.th div.equalValue';
const SELECTOR_BTC_VALUES = 'ul.accountInfo-lists li.td div.equalValue';

const RETRY_WAIT_TIME = 1000;

const fiatConv = getFiatConverter();

let isFiat: boolean | null = null;

async function updateFunds() {
  const totalBTCElem = document.querySelector<HTMLElement>(SELECTOR_TOTAL_BTC);

  if (!totalBTCElem) {
    // dom struct might be changed.
    return;
  }

  // get total btc value.
  const totalBTCValue = Number((totalBTCElem.textContent || '').replace(/ BTC/, ''));

  if (!totalBTCValue) {
    // not yet loaded?
    setTimeout(updateFunds, RETRY_WAIT_TIME);
    return;
  }

  // get btc value of each cur
  const rows = document.querySelectorAll<HTMLDivElement>(SELECTOR_BTC_VALUES);

  if (rows.length <= 0) {
    // not yet loaded?
    setTimeout(updateFunds, RETRY_WAIT_TIME);
    return;
  }

  // fetch fiat last value from exchange
  await fiatConv.fetchLastPrice();

  // updateFunds values
  const fiatElem = getOrCreateTotalFiatElem();
  fiatElem.setAttribute('title', `${fiatConv.getFormattedFiatValue()} ${fiatConv.getCurrencyCode()} / BTC`);
  fiatElem.textContent = `${fiatConv.convertToString(totalBTCValue)} ${fiatConv.getCurrencyCode()}`;

  const isInit = isFiat === null;

  if (isInit) {
    // default is displaying fiat value.
    isFiat = true;
  }

  for (let i = 0; i < rows.length; i++) {
    const e = rows[i];

    if (isInit) {
      e.setAttribute('data-btc', e.textContent || '');
    }

    const btc = Number(e.getAttribute('data-btc'));

    if (isFiat) {
      e.textContent = `${fiatConv.convertToString(btc)}`;
    } else {
      e.textContent = `${btc}`;
    }
  }

  //
  const headerElem = document.querySelector<HTMLDivElement>(SELECTOR_BTC_HEADER);

  if (!headerElem) {
    return;
  }

  if (isFiat) {
    headerElem.textContent = `${fiatConv.getCurrencyCode()} Value`;
  } else {
    headerElem.textContent = `BTC Value`;
  }

  headerElem.style.cursor = 'pointer';
  headerElem.onclick = (e) => {
    isFiat = !isFiat;
    updateFunds();
  };
}

function getOrCreateTotalFiatElem() {
  let e = document.querySelector(SELECTOR_TOTAL_FIAT);

  if (e === null) {
    e = document.createElement('strong');
    e.setAttribute('id', 'total_fiat');

    const t = document.querySelector(SELECTOR_TOTAL);
    if (t !== null) {
      t.appendChild(document.createTextNode(' / '));
      t.appendChild(e);
    } else {
      throw new Error('cannot find the total element.');
    }
  }

  return e;
}

if (document.querySelector('div.chargeWithdraw') !== null) {
  updateFunds();
}
