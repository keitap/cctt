// import 'chromereload/devonly';

const SELECTOR_TOTAL = 'li.total';
const SELECTOR_TOTAL_BTC = 'li.total strong:first-of-type';
const SELECTOR_TOTAL_FIAT = '#total_fiat';
const SELECTOR_BTC_HEADER = 'ul.accountInfo-lists li.th div.equalValue';
const SELECTOR_BTC_VALUES = 'ul.accountInfo-lists li.td div.equalValue';

const RETRY_WAIT_TIME = 1000;

enum FIAT_PROVIDERS {
  ZAIF = 'zaif',
}

type FiatProvider = {
  currencyCode: string;
  endpoint: string;
  extractLambda: (json: any) => number;
  formatLambda: (v: number) => string;
};

const FIAT_PROVIDER_MAP: { [key: string]: FiatProvider } = {
  [FIAT_PROVIDERS.ZAIF]: {
    currencyCode: 'JPY',
    endpoint: 'https://api.zaif.jp/api/1/last_price/btc_jpy',
    extractLambda: (json: any) => json.last_price,
    formatLambda: (v: number) => v.toLocaleString(undefined, {maximumFractionDigits: 0}),
  }
};

async function loadFiatLastPrice(provider: FiatProvider) {
  const {endpoint, extractLambda} = provider;
  const resp = await fetch(endpoint);
  const json = await resp.json();
  return extractLambda(json);
}

const fiatProvider = FIAT_PROVIDER_MAP[FIAT_PROVIDERS.ZAIF];

enum CURRENCY {
  BTC = 'BTC',
  Fiat = 'Fiat',
}

let currentCur: CURRENCY | null = null;

async function update() {
  const totalBTCElem = document.querySelector<HTMLElement>(SELECTOR_TOTAL_BTC);

  if (!totalBTCElem) {
    // dom struct might be changed.
    return;
  }

  // get total btc value.
  const totalBTCValue = Number((totalBTCElem.textContent || '').replace(/ BTC/, ''));

  if (!totalBTCValue) {
    // not yet loaded?
    setTimeout(update, RETRY_WAIT_TIME);
    return;
  }

  // get btc value of each cur
  const rows = document.querySelectorAll<HTMLDivElement>(SELECTOR_BTC_VALUES);

  if (rows.length <= 0) {
    // not yet loaded?
    setTimeout(update, RETRY_WAIT_TIME);
    return;
  }

  // fetch fiat value from exchange
  const btcFiat = await loadFiatLastPrice(fiatProvider);

  // update values
  const fiatValue = totalBTCValue * btcFiat;

  const fiatElem = getOrCreateTotalFiatElem();
  fiatElem.setAttribute('title', `${fiatProvider.formatLambda(btcFiat)} ${fiatProvider.currencyCode} / BTC`);
  fiatElem.textContent = `${fiatProvider.formatLambda(fiatValue)} ${fiatProvider.currencyCode}`;

  const isInit = currentCur === null;

  if (isInit) {
    currentCur = CURRENCY.Fiat;
  }

  for (let i = 0; i < rows.length; i++) {
    const e = rows[i];

    if (isInit) {
      e.setAttribute('data-btc', e.textContent || '');
    }

    const btc = Number(e.getAttribute('data-btc'));

    if (currentCur === CURRENCY.Fiat) {
      e.textContent = `${fiatProvider.formatLambda(btc * btcFiat)}`;
    } else {
      e.textContent = `${btc}`;
    }
  }

  //
  const headerElem = document.querySelector<HTMLDivElement>(SELECTOR_BTC_HEADER);

  if (!headerElem) {
    return;
  }

  headerElem.style.cursor = 'pointer';
  headerElem.onclick = (e) => {
    if (currentCur === CURRENCY.BTC) {
      currentCur = CURRENCY.Fiat;
      headerElem.textContent = `${fiatProvider.currencyCode} Value`;
    } else {
      currentCur = CURRENCY.BTC;
      headerElem.textContent = `${currentCur} Value`;
    }

    update();
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

update();
