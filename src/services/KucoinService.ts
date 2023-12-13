// @ts-ignore
import * as API from "kucoin-node-sdk";
import { getIcon } from "../utilities";
class KucoinService {
  constructor() {
    API.init(require("../../config/kucoin"));

    // Bind the method to the class instance
    this.getMarginPortfolio = this.getMarginPortfolio.bind(this);
  }

  public async getMarginPortfolio() {
    const marginAccount = await API.rest.Margin.MarginInfo.getMarginAccount();
    const tickerAssets = await API.rest.Market.Symbols.getAllTickers();
    let total = 0;
    let total24h = 0;

    const assets = marginAccount.data.accounts
      .filter((asset: any) => asset.totalBalance > 0 || asset.liability > 0)
      .map((asset: any) => {
        const tickerAsset = tickerAssets.data.ticker.find(
          (assetTicker: { symbol: string }) =>
            assetTicker.symbol === asset.currency + "-" + (asset.currency === "USDT" ? "DAI" : "USDT")
        );

        const available = asset.liability > 0 ? 0 - asset.liability : asset.totalBalance;
        const icon = getIcon(asset.currency);

        total += available * tickerAsset.last;
        total24h += Math.round(tickerAsset.last * tickerAsset.changeRate * available);

        return {
          currency: asset.currency + "K",
          tradeToCurrency: asset.currency + "K" + "-" + "USDT",
          usdPrice: tickerAsset.last,
          usdValue: available * tickerAsset.last,
          available,
          stats1d: {
            value: tickerAsset.last * tickerAsset.changeRate * available,
            percent: tickerAsset.changeRate * 100,
          },
          icon: icon,
          stats7d: {
            value: 0,
            percent: 0,
          },
          stats30d: {
            value: 0,
            percent: 0,
          },
          stats1h: {
            value: 0,
            percent: 0,
          },
        };
      });

    return {
      total,
      total24h,
      assets,
    };
  }
}

export default KucoinService;
