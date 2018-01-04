enum FIAT_PROVIDER {
  ZAIF = 'zaif',
  BITBANK = 'bitbank',
}

type FiatProvider = {
  currencyCode: string;
  endpoint: string;
  extractValue: (json: any) => number;
};

const FIAT_PROVIDERS: { [key: string]: FiatProvider } = {
  [FIAT_PROVIDER.ZAIF]: {
    currencyCode: 'JPY',
    endpoint: 'https://api.zaif.jp/api/1/last_price/btc_jpy',
    extractValue: (json: any) => json.last_price,
  },
  [FIAT_PROVIDER.BITBANK]: {
    currencyCode: 'JPY',
    endpoint: 'https://public.bitbank.cc/btc_jpy/ticker',
    extractValue: (json: any) => json.data.last,
  }
};

export function getFiatConverter() {
  return new FiatConverter(FIAT_PROVIDERS[FIAT_PROVIDER.BITBANK]);
}

class FiatConverter {
  private btcFiat?: number;

  constructor(public provider: FiatProvider) {
  }

  async fetchLastPrice() {
    const {endpoint, extractValue} = this.provider;
    const resp = await fetch(endpoint);
    const json = await resp.json();
    this.btcFiat = extractValue(json);
  }

  getCurrencyCode() {
    return this.provider.currencyCode;
  }

  private getEndpoint() {
    return this.provider.endpoint;
  }

  getFiatValue() {
    return this.btcFiat;
  }

  getFormattedFiatValue() {
    return FiatConverter.format(this.btcFiat || NaN);
  }

  convertToNumber(btc: number) {
    if (!this.btcFiat) {
      return NaN;
    }

    return this.btcFiat * btc;
  }

  convertToString(btc: number): string {
    return FiatConverter.format(this.convertToNumber(btc));
  }

  private static format(v: number) {
    if (!v) {
      return 'N/A';
    }

    return v.toLocaleString(undefined, {maximumFractionDigits: 0});
  }
}
