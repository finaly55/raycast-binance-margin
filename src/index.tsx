import { Action, ActionPanel, List } from "@raycast/api";
import { formatNombre, getColorChange, numberToString, subtitleFor } from "./utilities";
import { usePortfolio } from "./usePortfolio";
import { PortfolioEntry } from "./models/portfolio";

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
            {state.type === "1d" && <Action title={"Inverser le trie"} onAction={() => state.sort()} />}
            <Action title="P/L sur 1 jour" onAction={() => state.changeType("1d")} />
            <Action title="P/L sur 7 jours" onAction={() => state.changeType("7d")} />
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

export function CurrencyItem(props: { portfolioEntry: PortfolioEntry; state: any }) {
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
      subtitle={Math.round(portfolioEntry.usdPrice * 100) / 100 + "$"}
      accessories={[
        { text: subtitleFor(portfolioEntry) },
        props.state.type === "1d"
          ? {
              tag: {
                value: numberToString(Math.round(portfolioEntry.change_percent * 10) / 10) + "%",
                color: getColorChange(portfolioEntry.change_percent),
              },
            }
          : {},
        props.state.type === "1d"
          ? {
              tag: {
                value: numberToString(Math.round(portfolioEntry.change_value)) + "$",
                color: getColorChange(Math.round(portfolioEntry.change_value)),
              },
            }
          : {},
        props.state.type === "7d"
          ? {
              tag: {
                value: numberToString(Math.round(portfolioEntry.stats7d?.percent * 10) / 10) + "%",
                color: getColorChange(portfolioEntry.stats7d?.percent),
              },
            }
          : {},
        props.state.type === "7d"
          ? {
              tag: {
                value: numberToString(Math.round(portfolioEntry.stats7d?.value)) + "$",
                color: getColorChange(Math.round(portfolioEntry.stats7d?.value)),
              },
            }
          : {},
        props.state.type === "1h"
          ? {
              tag: {
                value: numberToString(Math.round(portfolioEntry.stats1h?.percent * 10) / 10) + "%",
                color: getColorChange(portfolioEntry.stats1h?.percent),
              },
            }
          : {},
        props.state.type === "1h"
          ? {
              tag: {
                value: numberToString(Math.round(portfolioEntry.stats1h?.value)) + "$",
                color: getColorChange(Math.round(portfolioEntry.stats1h?.value)),
              },
            }
          : {},
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
