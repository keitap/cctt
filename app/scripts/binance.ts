import 'chromereload/devonly';
import {CurrencyConverter, getCurrencyConverter, PROVIDER} from './base_currency';
import {BGMSGType, STORAGE_KEY_PROVIDER} from './const';
import StorageChange = chrome.storage.StorageChange;

const SELECTOR_TOTAL = 'li.total';
const SELECTOR_TOTAL_BTC = 'li.total strong:first-of-type';
const SELECTOR_BTC_HEADER = 'ul.accountInfo-lists li.th div.equalValue';
const SELECTOR_BTC_VALUES = 'ul.accountInfo-lists li.td div.equalValue';
const DOM_ID_TOTAL_BASE_CCY = '#total_base_ccy';

const RETRY_WAIT_TIME = 1000;

let baseCCYConv: CurrencyConverter | null;
let isBaseCCY: boolean | null = null;

async function updateFunds() {
  if (!baseCCYConv) {
    // not yet loaded?
    setTimeout(updateFunds, RETRY_WAIT_TIME);
    return;
  }

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

  // fetch base ccy last value from exchange
  await baseCCYConv.fetchLastPrice();

  // updateFunds values
  const baseCCYElem = getOrCreateTotalBaseCCYElem();
  baseCCYElem.setAttribute('title',
    `${baseCCYConv.getFormattedBaseCurrencyValue()} ${baseCCYConv.getCurrencyCode()} / BTC`);
  baseCCYElem.textContent = `${baseCCYConv.convertToString(totalBTCValue)} ${baseCCYConv.getCurrencyCode()} (${baseCCYConv.getName()})`;

  const isInit = isBaseCCY === null;

  if (isInit) {
    // default is displaying base ccy value.
    isBaseCCY = true;
  }

  for (let i = 0; i < rows.length; i++) {
    const e = rows[i];

    if (isInit) {
      e.setAttribute('data-btc', e.textContent || '');
    }

    const btc = Number(e.getAttribute('data-btc'));

    if (isBaseCCY) {
      e.textContent = `${baseCCYConv.convertToString(btc)}`;
    } else {
      e.textContent = `${btc}`;
    }
  }

  //
  const headerElem = document.querySelector<HTMLDivElement>(SELECTOR_BTC_HEADER);

  if (!headerElem) {
    return;
  }

  if (isBaseCCY) {
    headerElem.textContent = `${baseCCYConv.getCurrencyCode()} Value`;
  } else {
    headerElem.textContent = `BTC Value`;
  }

  headerElem.style.cursor = 'pointer';
  headerElem.onclick = (e) => {
    isBaseCCY = !isBaseCCY;
    updateFunds();
  };
}

function getOrCreateTotalBaseCCYElem() {
  let e = document.getElementById(DOM_ID_TOTAL_BASE_CCY);

  if (e === null) {
    e = document.createElement('strong');
    e.setAttribute('id', DOM_ID_TOTAL_BASE_CCY);

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

function updateBaseCCYProvider(provider: PROVIDER) {
  baseCCYConv = getCurrencyConverter(provider);
  updateFunds();
}

if (document.querySelector('div.chargeWithdraw') !== null) {
  chrome.runtime.sendMessage(BGMSGType.ENABLE_PAGE_ACTION);

  chrome.storage.local.get((items: { [key: string]: any }) => {
    const provider = items[STORAGE_KEY_PROVIDER];
    updateBaseCCYProvider(provider);
  });

  chrome.storage.onChanged.addListener((changes: { [key: string]: StorageChange }, areaName: string) => {
    updateBaseCCYProvider(changes[STORAGE_KEY_PROVIDER].newValue);
  });
}
