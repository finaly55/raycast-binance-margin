import { useState, useEffect } from "react";
import { Toast, environment, getPreferenceValues, showToast } from "@raycast/api";
import fs from "fs";
import path from "path";
import { PortfolioEntry, PortfolioState } from "./models/portfolio";
import { compareUSDTPlusValue, compareUSDTValue, getBinanceDataByRequests, isBinanceError } from "./utilities";
import moment from "moment";

let APIKEY = getPreferenceValues().binance_api_key as string;
let APISECRET = getPreferenceValues().binance_api_secret as string;

const { Spot } = require("@binance/connector");
export const client = new Spot(APIKEY, APISECRET);

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

  function changeType(type: string) {
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
        portfolio: oldState.portfolio?.sort(compareUSDTPlusValue).reverse(),
      }));

      state.sortByUSDTValue = true;
    }
  }

  async function fetchPortfolio() {
    try {
      let portfolio: PortfolioEntry[] = [];

      let marginAccount = await client.marginAccount({ recvWindow: 6000 });

      const priceAPIBTC = await client.tickerPrice("BTC".concat("USDT"));
      const total = marginAccount.data.totalNetAssetOfBtc * priceAPIBTC.data.price;

      setState((oldState) => ({
        ...oldState,
        isLoading: false,
        portfolio,
        total,
        total24h,
      }));

      let total24h = 0;

      const prices2 = marginAccount.data.userAssets.filter((x: { netAsset: number }) => x.netAsset > 0);

      let assets24hResp = await client.ticker24hr();
      const assets24h = assets24hResp.data;

      const promises = prices2.map(async (currency: { netAsset: any; asset: string }) => {
        try {
          const asset = currency.asset === "USDT" ? `USDC${currency.asset}` : `${currency.asset}USDT`;
          const available = currency.netAsset;
          const change_percent = assets24h.find((cur: { symbol: string }) => cur.symbol === asset)?.priceChangePercent;
          const change_value =
            assets24h.find((cur: { symbol: string }) => cur.symbol === asset)?.priceChange * available;
          const priceAPI = await client.tickerPrice(asset);
          const price = priceAPI.data.price;
          const tradeToCurrency = currency.asset === "USDT" ? null : "BTC";
          const usdPrice = price;
          const usdValue = available * usdPrice;
          const iconPath = path.join(environment.assetsPath, `currency/${currency.asset.toLowerCase()}.png`);
          const icon = fs.existsSync(iconPath)
            ? `currency/${currency.asset.toLowerCase()}.png`
            : `currency/generic.png`;
          total24h = total24h + change_value;

          const price7d = await getBinanceDataByRequests(
            asset,
            "1d",
            moment().subtract(8, "days").format("YYYY-MM-DD HH:mm:ss"),
            moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss")
          );

          const stats7d = {
            value: usdValue - price7d[0].open * available,
            percent: 100 - (price7d[0].open * available * 100) / usdValue,
          };

          const price1h = await getBinanceDataByRequests(
            asset,
            "1h",
            moment().subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss"),
            moment().subtract(1, "hours").format("YYYY-MM-DD HH:mm:ss")
          );
          const stats1h = {
            value: usdValue - price1h[0].open * available,
            percent: 100 - (price1h[0].open * available * 100) / usdValue,
          };

          return {
            currency: currency.asset,
            available,
            usdPrice,
            usdValue,
            change_percent,
            change_value,
            tradeToCurrency,
            icon,
            stats7d,
            stats1h,
          } as PortfolioEntry;
        } catch (error) {
          console.log(error);
          return {
            currency: currency.asset,
          } as PortfolioEntry;
        }
      });

      portfolio = await Promise.all(promises);
      portfolio = portfolio.filter((asset) => asset.usdValue > 0.5 || asset.usdValue < 0);

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
