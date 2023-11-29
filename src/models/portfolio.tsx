export type Portfolio = PortfolioEntry[];

export type PortfolioEntry = {
  currency: Currency;
  tradeToCurrency: Currency;
  available: number;
  usdPrice: number;
  usdValue: number;
  change_percent: number;
  change_value: number;
  icon: string;
  stats7d: Stats;
  stats1h: Stats;
};

type Stats = {
  value: number;
  percent: number;
}

export interface PortfolioState {
  sort(): void;
  changeType(type: string): void;
  isLoading: boolean;
  isLoadingAssets: boolean;
  total: number | null;
  total24h: number | null;
  portfolio: Portfolio | undefined;
  sortByUSDTValue: boolean;
  type: string;
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
