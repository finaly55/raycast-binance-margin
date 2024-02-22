export type Portfolio = PortfolioEntry[];

export type PortfolioEntry = {
  currency: Currency;
  tradeToCurrency: Currency;
  available: number;
  usdPrice: number;
  usdValue: number;
  icon: string;
  stats1d: Stats;
  stats7d: Stats;
  stats30d: Stats;
  stats1h: Stats;
  trade?: Trade;
};

type Trade = {
  averageAchat: number;
  averageVente: number;
  beneficeNet: number;
  fees: number;
  totalTrade: number;
};

type Stats = {
  usdValueAsset: number;
  changeAvaibility: number;
  value: number;
  percent: number;
};

export interface PortfolioState {
  sort(): void;
  changeType(type: TypeFilter): void;
  changePercentMode(percentMode: boolean): void;
  isLoading: boolean;
  usdBorrowed: number;
  isLoadingAssets: boolean;
  total: number | null;
  total24h: number | null;
  portfolio: Portfolio | undefined;
  sortByUSDTValue: boolean;
  type: TypeFilter;
  isPercentMode: boolean;
}

export interface BinanceError {
  statusMessage: string;
}

type Currency = string;

export interface BinanceOHLCData {
  open_time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  close_time: number;
  qav: string;
  num_trades: number;
  taker_base_vol: string;
  taker_quote_vol: string;
  ignore: string;
}

export type TypeFilter = "1d" | "1h" | "7d" | "30d";
export type TypeFilterAttribute = "stats1d" | "stats1h" | "stats7d" | "stats7d";
