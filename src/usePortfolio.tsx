import { useState, useEffect } from "react";
import { Toast, showToast } from "@raycast/api";
import { PortfolioEntry, PortfolioState, TypeFilter } from "./models/portfolio";
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
      let portfolio: PortfolioEntry[] = [];

      const kucoinService = new KucoinService();
      const kucoinPortfolioMarginAccount = await kucoinService.getMarginPortfolio();

      const binanceService = new BinanceService();
      const binancePortfolioMarginAccount = await binanceService.getMarginPortfolio();

      const metamaskService = new MetamaskService();
      const metamaskPortfolio = await metamaskService.getMarginPortfolio();

      const total = binancePortfolioMarginAccount.total + kucoinPortfolioMarginAccount.total + metamaskPortfolio.total;

      const total24h =
        binancePortfolioMarginAccount.total24 + kucoinPortfolioMarginAccount.total24h + metamaskPortfolio.total24h;

      portfolio = [
        ...binancePortfolioMarginAccount.assets,
        ...kucoinPortfolioMarginAccount.assets,
        ...metamaskPortfolio.assets,
      ];

      setState((oldState) => ({
        ...oldState,
        isLoading: false,
        isLoadingAssets: false,
        portfolio,
        total,
        total24h,
      }));

      sort();
    } catch (error: any) {
      let errorMsg;
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (isBinanceError(error)) {
        errorMsg = error.statusMessage;
      } else {
        errorMsg = error.toString();
      }
      showToast(Toast.Style.Failure, errorMsg);
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
