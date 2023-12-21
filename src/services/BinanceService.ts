import { getPreferenceValues } from "@raycast/api";
import { getBinanceDataByRequests, getIcon } from "../utilities";
import moment from "moment";
import { PortfolioEntry } from "../models/portfolio";
import { AccountSnapshotType, RestMarketTypes, Spot as SpotTS } from "@binance/connector-typescript";
const { Spot } = require("@binance/connector");

let APIKEY = getPreferenceValues().binance_api_key as string;
let APISECRET = getPreferenceValues().binance_api_secret as string;

const client = new Spot(APIKEY, APISECRET);
const clientTS = new SpotTS(APIKEY, APISECRET);

class BinanceService {
  private marginAccount: any;
  private priceAPIBTC: any;

  constructor() {
    // Bind the method to the class instance
    this.getMarginPortfolio = this.getMarginPortfolio.bind(this);
  }

  public async getMarginPortfolio() {
    let allAssets: any[] = [];
    try {
      const res = await clientTS.dailyAccountSnapshot(AccountSnapshotType.MARGIN, {
        startTime: new Date(moment().subtract(31, "days").format("YYYY-MM-DD HH:mm:ss")).getTime(),
        endTime: new Date(moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss")).getTime(),
      });
      // @ts-ignore
      allAssets = res.snapshotVos[res.snapshotVos.length - 1].data.userAssets.map(
        (asset: { asset: any; netAsset: any }) => {
          return {
            asset: asset.asset,
            availibility: asset.netAsset,
          };
        }
      );
      console.log(moment.unix(res.snapshotVos[res.snapshotVos.length - 1].updateTime / 1000).format("MM/DD/YYYY"));
    } catch (error) {
      console.log("error", error);
    }
    this.marginAccount = await client.marginAccount({ recvWindow: 6000 });
    this.priceAPIBTC = await client.tickerPrice("BTC".concat("USDT"));
    const total2 = this.marginAccount.data.totalNetAssetOfBtc * this.priceAPIBTC?.data.price;

    let total24h = 0;
    let total = 0;
    const pricesUserAssets = this.marginAccount.data.userAssets.filter((x: { netAsset: number }) => x.netAsset != 0);

    let assets24hResp = await client.ticker24hr();
    const assets24h = assets24hResp.data;

    const promises = pricesUserAssets.map(async (currency: { netAsset: any; asset: string }) => {
      try {
        const asset = currency.asset === "USDT" ? `USDC${currency.asset}` : `${currency.asset}USDT`;
        const available = currency.netAsset;
        const change_percent = assets24h.find((cur: { symbol: string }) => cur.symbol === asset)?.priceChangePercent;
        const change_value = assets24h.find((cur: { symbol: string }) => cur.symbol === asset)?.priceChange * available;

        const priceAPI = await client.tickerPrice(asset);
        const price = priceAPI.data.price;

        const tradeToCurrency = currency.asset === "USDT" ? null : "BTC";
        const usdPrice = price;
        const usdValue = available * usdPrice;
        const icon = getIcon(currency.asset);

        total24h += change_value;
        total += usdValue;

        const stats1d = {
          value: change_value,
          percent: change_percent,
          changeAvaibility: 0,
          available: 0,
          usdValueAsset: usdPrice,
        };
        const price30d = await getBinanceDataByRequests(
          asset,
          "1d",
          moment().subtract(31, "days").format("YYYY-MM-DD HH:mm:ss"),
          moment().subtract(30, "days").format("YYYY-MM-DD HH:mm:ss")
        );

        const price7d = await getBinanceDataByRequests(
          asset,
          "1d",
          moment().subtract(8, "days").format("YYYY-MM-DD HH:mm:ss"),
          moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss")
        );

        const stats30d = {
          value: usdValue - price30d[0].open * available,
          percent: 100 - (price30d[0].open * available * 100) / usdValue,
          changeAvaibility: currency.netAsset - allAssets.find((asset) => asset.asset === currency.asset)?.availibility,
          available: allAssets.find((asset) => asset.asset === currency.asset)?.availibility,
          usdValueAsset: price30d[0].open,
        };

        const stats7d = {
          value: usdValue - price7d[0].open * available,
          percent: 100 - (price7d[0].open * available * 100) / usdValue,
          changeAvaibility: currency.netAsset - allAssets.find((asset) => asset.asset === currency.asset)?.availibility,
          available: 0,
          usdValueAsset: price7d[0].open,
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
          changeAvaibility: 0,
          available: 0,
          usdValueAsset: price1h[0].open,
        };

        return {
          currency: currency.asset,
          available,
          usdPrice,
          usdValue,
          tradeToCurrency,
          icon,
          stats1d,
          stats7d,
          stats30d,
          stats1h,
        } as PortfolioEntry;
      } catch (error) {
        console.log(error);
        return {
          currency: currency.asset,
        } as PortfolioEntry;
      }
    });

    const portfolio = await Promise.all(promises);
    return {
      total: total2,
      total24: total24h,
      assets: portfolio.filter((asset: any) => asset.usdValue > 0.5 || asset.usdValue < 0),
    };
  }

  public getMarginAccount() {
    return this.marginAccount;
  }
}

export default BinanceService;
