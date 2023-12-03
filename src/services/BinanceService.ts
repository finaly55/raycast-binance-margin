import { getPreferenceValues } from "@raycast/api";
import { getBinanceDataByRequests, getIcon } from "../utilities";
import moment from "moment";
import { PortfolioEntry } from "../models/portfolio";

let APIKEY = getPreferenceValues().binance_api_key as string;
let APISECRET = getPreferenceValues().binance_api_secret as string;

const { Spot } = require("@binance/connector");
const client = new Spot(APIKEY, APISECRET);

class BinanceService {
  private marginAccount: any;
  private priceAPIBTC: any;

  constructor() {
    // Bind the method to the class instance
    this.getMarginPortfolio = this.getMarginPortfolio.bind(this);
  }

  public async getMarginPortfolio() {
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
