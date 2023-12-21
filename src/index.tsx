import { Action, ActionPanel, List } from "@raycast/api";
import { formatNombre, getColorChange, getTypeFilter, numberToString, subtitleFor } from "./utilities";
import { usePortfolio } from "./usePortfolio";
import { PortfolioEntry, PortfolioState, TypeFilter } from "./models/portfolio";

export default function BalanceList() {
  const { state } = usePortfolio();

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Rechercher" navigationTitle="Mon portefeuille">
      <List.Item
        id={"total.asset"}
        key={"total.asset"}
        title={"Total"}
        subtitle={!state.isLoadingAssets ? formatNombre(state.total) : "Chargement ..."}
        accessories={
          !state.isLoadingAssets && state.total24h && state.total
            ? [
                {
                  tag: {
                    value: numberToString(Math.round(((state.total24h * 100) / state.total) * 10) / 10) + "%",
                    color: getColorChange(state.total24h ? state.total24h : 0),
                  },
                },
                {
                  tag: {
                    value: numberToString(Math.round(state.total24h)) + "$",
                    color: getColorChange(state.total24h ? state.total24h : 0),
                  },
                },
              ]
            : []
        }
        actions={
          <ActionPanel>
            {<Action title={"Inverser le trie"} onAction={() => state.sort()} />}
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
      key={Math.floor(Math.random() * 1000000) + 1}
      title={portfolioEntry.currency ? portfolioEntry.currency : ""}
      subtitle={Math.round(portfolioEntry.usdPrice * 100) / 100 + "$"}
      accessories={[
        portfolioEntry.stats30d.changeAvaibility
          ? {
              tag: {
                value:
                  numberToString(Math.round(portfolioEntry.stats30d.changeAvaibility)) +
                  " soit " +
                  numberToString(
                    Math.round(portfolioEntry.stats30d.changeAvaibility * portfolioEntry.stats30d.usdValueAsset)
                  ) +
                  "$",
              },
            }
          : {},
        { text: subtitleFor(portfolioEntry) },
        {
          tag: {
            value: numberToString(Math.round(portfolioEntry[getTypeFilter(props.state.type)].percent * 10) / 10) + "%",
            color: getColorChange(portfolioEntry[getTypeFilter(props.state.type)].percent),
          },
        },
        {
          tag: {
            value: numberToString(Math.round(portfolioEntry[getTypeFilter(props.state.type)].value)) + "$",
            color: getColorChange(Math.round(portfolioEntry[getTypeFilter(props.state.type)].value)),
          },
        },
      ]}
      icon={portfolioEntry.icon}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Voir le graphique" url={tradeURL} icon="binance-logo.png" />
        </ActionPanel>
      }
    />
  );
}
