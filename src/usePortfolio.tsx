import { useState, useEffect } from "react";
import { Toast, showToast } from "@raycast/api";
import { PortfolioState, TypeFilter } from "./models/portfolio";
import { compareUSDTPlusValue, compareUSDTValue, isBinanceError } from "./utilities";
import KucoinService from "./services/KucoinService";
import BinanceService from "./services/BinanceService";
import MetamaskService from "./services/MetamaskService";

export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>({
    portfolio: undefined,
    total: null,
    total24h: null,
    isLoading: true,
    isLoadingAssets: true,
    sortByUSDTValue: true,
    type: "1d",
    sort,
    changeType,
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  function changeType(type: TypeFilter) {
    setState((oldState) => ({
      ...oldState,
      type,
    }));
  }

  function sort() {
    if (state.sortByUSDTValue) {
      setState((oldState) => ({
        ...oldState,
        portfolio: oldState.portfolio?.sort(compareUSDTValue).reverse(),
      }));
      state.sortByUSDTValue = false;
    } else {
      setState((oldState) => ({
        ...oldState,
        portfolio: oldState.portfolio?.sort((a, b) => compareUSDTPlusValue(a, b, state.type)).reverse(),
      }));

      state.sortByUSDTValue = true;
    }
  }

  async function fetchPortfolio() {
    try {
      const [kucoinPortfolioMarginAccount, binancePortfolioMarginAccount, metamaskPortfolio] = await Promise.all([
        new KucoinService().getMarginPortfolio(),
        new BinanceService().getTotalMarginPortfolio(),
        new MetamaskService().getMarginPortfolio(),
      ]);

      const total = binancePortfolioMarginAccount.total + kucoinPortfolioMarginAccount.total + metamaskPortfolio.total;
      const total24h =
        binancePortfolioMarginAccount.total24 + kucoinPortfolioMarginAccount.total24h + metamaskPortfolio.total24h;

      const portfolio = [
        ...binancePortfolioMarginAccount.assets,
        ...kucoinPortfolioMarginAccount.assets,
        ...metamaskPortfolio.assets,
      ];

      setState((oldState) => ({
        ...oldState,
        isLoading: true,
        isLoadingAssets: false,
        portfolio,
        total,
        total24h,
      }));

      // récupération des cryptos binance plus tard car prend beaucoup de temps
      await fetchBinanceAssets();
    } catch (error) {
      if (error instanceof Error) {
        showToast(Toast.Style.Failure, error.message);
      }
      setState((oldState) => ({
        ...oldState,
        isLoading: false,
        isLoadingAssets: false,
        portfolio: undefined,
        sortByUSDTValue: false,
      }));
    }
  }

  async function fetchBinanceAssets() {
    try {
      const binancePortfolioMarginAccount = await new BinanceService().getMarginPortfolio();
      const total24h = binancePortfolioMarginAccount.total24;
      const portfolio = [...binancePortfolioMarginAccount.assets];

      setState((oldState) => ({
        ...oldState,
        isLoading: false,
        isLoadingAssets: false,
        portfolio: oldState.portfolio ? [...oldState.portfolio, ...portfolio] : portfolio,
        total24h,
      }));

      sort();
    } catch (error) {
      if (error instanceof Error) {
        showToast(Toast.Style.Failure, error.message);
      }

      setState((oldState) => ({
        ...oldState,
        isLoading: false,
        isLoadingAssets: false,
        portfolio: undefined,
        sortByUSDTValue: false,
      }));
    }
  }

  return { state };
}
