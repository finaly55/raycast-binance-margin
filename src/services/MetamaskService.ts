import { getIcon } from "../utilities";

class MetamaskService {
  constructor() {
    // Bind the method to the class instance
    this.getMarginPortfolio = this.getMarginPortfolio.bind(this);
  }

  public async getMarginPortfolio() {
    let total = 0;
    let total24h = 0;

    const account = await this.getPorfolio();
    const assets = account.data.tokenBalances
      .map((asset: any) => {
        const available = asset.balance;
        const icon = getIcon(asset.symbol);
        total += available * asset.value.price;
        total24h += available * asset.value.priceChange1d;

        return {
          currency: asset.symbol + "M",
          tradeToCurrency: asset.symbol + "M" + "-" + "USDT",
          usdPrice: asset.value.price,
          usdValue: available * asset.value.price,
          available,
          change_percent: asset.value.pricePercentChange1d,
          change_value: available * asset.value.priceChange1d,
          icon: icon,
          stats7d: {
            value: asset.value.price + asset.value.price * asset.value.pricePercentChange7h,
            percent: asset.value.pricePercentChange7h,
          },
          stats1h: {
            value: asset.value.price + asset.value.price * asset.value.pricePercentChange1h,
            percent: asset.value.pricePercentChange1h,
          },
        };
      })
      .filter((asset: any) => asset.usdValue > 1);

    return {
      total,
      total24h,
      assets,
    };
  }

  public async getPorfolio() {
    const axios = require("axios");
    const account = "0xa1d87107153914412a1c798f2b1ac0d5c130866f";
    const chainId = "56";

    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://account.metafi.codefi.network/accounts/" + account + "?chainId=" + chainId + "&includePrices=true",
      headers: {
        authority: "account.metafi.codefi.network",
        accept: "application/json, text/plain, */*",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh-TW;q=0.5,zh;q=0.4",
        "cache-control": "no-cache",
        dnt: "1",
        origin: "https://portfolio.metamask.io",
        referer: "https://portfolio.metamask.io/",
        "sec-ch-ua": '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    };

    const response = await axios.request(config);
    return response;
  }
}

export default MetamaskService;
