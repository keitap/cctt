export enum PROVIDER {
  ZAIF = 'zaif',
  BITBANK = 'bitbank',
}

type Provider = {
  name: string;
  currencyCode: string;
  endpoint: string;
  extractValue: (json: any) => number;
};

const PROVIDER_DEFINITION: { [key: string]: Provider } = {
  [PROVIDER.ZAIF]: {
    name: 'Zaif',
    currencyCode: 'JPY',
    endpoint: 'https://api.zaif.jp/api/1/last_price/btc_jpy',
    extractValue: (json: any) => json.last_price,
  },
  [PROVIDER.BITBANK]: {
    name: 'bitbank',
    currencyCode: 'JPY',
    endpoint: 'https://public.bitbank.cc/btc_jpy/ticker',
    extractValue: (json: any) => Number(json.data.last),
  }
};

export function getCurrencyConverter(provider: PROVIDER) {
  return new CurrencyConverter(PROVIDER_DEFINITION[provider]);
}

export class CurrencyConverter {
  private btcBase?: number;

  constructor(private provider: Provider) {
  }

  async fetchLastPrice() {
    const {endpoint, extractValue} = this.provider;
    const resp = await fetch(endpoint);
    const json = await resp.json();
    this.btcBase = extractValue(json);
  }

  getName() {
    return this.provider.name;
  }

  getCurrencyCode() {
    return this.provider.currencyCode;
  }

  private getEndpoint() {
    return this.provider.endpoint;
  }

  getBaseCurrencyValue() {
    return this.btcBase;
  }

  getFormattedBaseCurrencyValue() {
    return CurrencyConverter.format(this.btcBase || NaN);
  }

  convertToNumber(btc: number) {
    if (!this.btcBase) {
      return NaN;
    }

    return this.btcBase * btc;
  }

  convertToString(btc: number): string {
    return CurrencyConverter.format(this.convertToNumber(btc));
  }

  private static format(v: number) {
    if (!v) {
      return 'N/A';
    }

    return v.toLocaleString(undefined, {maximumFractionDigits: 0});
  }
}
