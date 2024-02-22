import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import {
  arrondirNombre,
  formatNombre,
  getColorChange,
  getDeptTotal,
  getLibelleConvertirPercent,
  getTypeFilter,
  numberToString,
  subtitleFor,
} from "./utilities";
import { usePortfolio } from "./usePortfolio";
import { PortfolioEntry, PortfolioState } from "./models/portfolio";

export default function BalanceList() {
  const { state } = usePortfolio();

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Rechercher" navigationTitle="Mon portefeuille">
      <List.Item
        id={"total.asset"}
        key={"total.asset"}
        title={"Total"}
        subtitle={
          !state.isLoadingAssets
            ? formatNombre(parseInt(parseFloat(state.total!.toString()).toFixed(0))) +
              (getDeptTotal(state.total, state.usdBorrowed) != 0
                ? " | x" + getDeptTotal(state.total, state.usdBorrowed)
                : "")
            : "Chargement ..."
        }
        accessories={
          !state.isLoadingAssets && state.total24h && state.total
            ? [
                {
                  tag: {
                    value:
                      numberToString(parseFloat(arrondirNombre((state.total24h * 100) / state.total).toFixed(1))) + "%",
                    color: getColorChange(state.total24h ? state.total24h : 0),
                  },
                },
                {
                  tag: {
                    value: numberToString(arrondirNombre(state.total24h)) + "$",
                    color: getColorChange(state.total24h ? state.total24h : 0),
                  },
                },
              ]
            : []
        }
        actions={
          <ActionPanel>
            {<Action title={"Inverser le trie"} onAction={() => state.sort()} />}
            <Action
              title={state.isPercentMode ? "Voir la répartition en usd" : "Voir la répartition en pourcentage"}
              onAction={() => state.changePercentMode(!state.isPercentMode)}
            />
            <Action title="P/L sur 1 jour" onAction={() => state.changeType("1d")} />
            <Action title="P/L sur 7 jours" onAction={() => state.changeType("7d")} />
            <Action title="P/L sur 30 jours" onAction={() => state.changeType("30d")} />
            <Action title="P/L sur 1 heure" onAction={() => state.changeType("1h")} />
          </ActionPanel>
        }
      />
      {state.portfolio?.map((entry: PortfolioEntry) => (
        <CurrencyItem key={entry.currency} portfolioEntry={entry} state={state} />
      ))}
    </List>
  );
}

export function CurrencyItem(props: { portfolioEntry: PortfolioEntry; state: PortfolioState }) {
  const portfolioEntry = props.portfolioEntry;
  const tradeToCurrency = portfolioEntry.tradeToCurrency;
  let tradeURL = `https://www.binance.com/`;

  if (tradeToCurrency) {
    tradeURL += `en/trade/${portfolioEntry.currency}_USDT?layout=basic`;
  }

  return (
    <List.Item
      id={portfolioEntry.currency}
      key={portfolioEntry.currency}
      title={portfolioEntry.currency ? portfolioEntry.currency : ""}
      subtitle={arrondirNombre(portfolioEntry.usdPrice) + "$"}
      accessories={[
        portfolioEntry.stats30d.changeAvaibility
          ? {
              /* tag: {
                value:
                  numberToString(arrondirNombre(portfolioEntry.stats30d.changeAvaibility)) +
                  " soit " +
                  numberToString(
                    Math.round(
                      arrondirNombre(portfolioEntry.stats30d.changeAvaibility * portfolioEntry.stats30d.usdValueAsset)
                    )
                  ) +
                  "$",
              }, */
            }
          : {},
        {
          text: props.state.isPercentMode
            ? ((portfolioEntry.usdValue * 100) / (props.state.total! + props.state.usdBorrowed! * -1))
                .toFixed(1)
                .toString() + "%"
            : subtitleFor(portfolioEntry),
        },
        {
          tag: {
            value: arrondirNombre(portfolioEntry[getTypeFilter(props.state.type)].percent).toFixed(1) + "%",
            color: getColorChange(portfolioEntry[getTypeFilter(props.state.type)].percent),
          },
        },
        {
          tag: {
            value:
              numberToString(Math.round(arrondirNombre(portfolioEntry[getTypeFilter(props.state.type)].value))) + "$",
            color: getColorChange(arrondirNombre(portfolioEntry[getTypeFilter(props.state.type)].value)),
          },
        },
      ]}
      icon={portfolioEntry.icon}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Voir le graphique" url={tradeURL} icon="binance-logo.png" />
          <ActionPanel.Submenu title="Achat | vente | P/L">
            <Action
              icon={{ source: Icon.Circle, tintColor: Color.Green }}
              title={"Achat moy. : " + formatNombre(arrondirNombre(portfolioEntry.trade?.averageAchat!))}
            />
            <Action
              icon={{ source: Icon.Circle, tintColor: Color.Red }}
              title={"Vente moy. : " + formatNombre(arrondirNombre(portfolioEntry.trade?.averageVente!))}
            />
            <Action
              icon={{ source: Icon.Circle, tintColor: Color.Yellow }}
              title={"P/L : " + formatNombre(arrondirNombre(portfolioEntry.trade?.beneficeNet!))}
            />
            <Action
              icon={{ source: Icon.Circle, tintColor: Color.Yellow }}
              title={"Total trade : " + formatNombre(arrondirNombre(portfolioEntry.trade?.totalTrade!))}
            />
            <Action
              icon={{ source: Icon.Circle, tintColor: Color.Yellow }}
              title={"Fees : " + formatNombre(arrondirNombre(portfolioEntry.trade?.fees!))}
            />
          </ActionPanel.Submenu>
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 2.5)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.025)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 5)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.05)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 10)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.1)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 12.5)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.125)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 15)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.15)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 20)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.2)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 25)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.25)}
          />
          <Action.CopyToClipboard
            title={getLibelleConvertirPercent(props.state, portfolioEntry, 30)}
            content={arrondirNombre((props.state.total! - props.state.usdBorrowed) * 0.3)}
          />
        </ActionPanel>
      }
    />
  );
}
