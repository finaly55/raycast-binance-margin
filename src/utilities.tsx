import path from "path";
import { BinanceError, Portfolio, PortfolioEntry, PortfolioState, TypeFilterAttribute } from "./models/portfolio";
import axios from "axios";
import { environment } from "@raycast/api";
import fs from "fs";

export function numberToString(number: number | null) {
  if (!number) {
    return 0;
  } else {
    return number > 0 ? "+" + number : number;
  }
}

export function getColorChange(price: number) {
  if (price > 0) {
    return "green";
  } else if (price === 0) {
    return "grey";
  } else {
    return "red";
  }
}

export function displayNumber(number: number): string {
  return parseFloat(number.toString()).toString();
}

export function compareUSDTValue(a: PortfolioEntry, b: PortfolioEntry) {
  if (a.currency === "ETH") {
    return 1;
  } else if (b.currency === "ETH") {
    return -1;
  }

  if (a.currency === "BTC") {
    return 1;
  } else if (b.currency === "BTC") {
    return -1;
  }

  const result = a.usdValue - b.usdValue;

  if (result == 0) {
    return b.currency.localeCompare(a.currency);
  }

  return result;
}

export function compareUSDTPlusValue(a: PortfolioEntry, b: PortfolioEntry, type: any) {
  if (a.currency === "ETH") {
    return 1;
  } else if (b.currency === "ETH") {
    return -1;
  }

  if (a.currency === "BTC") {
    return 1;
  } else if (b.currency === "BTC") {
    return -1;
  }

  const result = a[getTypeFilter(type)].percent - b[getTypeFilter(type)].percent;

  if (result == 0) {
    return b.currency.localeCompare(a.currency);
  }

  return result;
}

export function formatNombre(nombre: number | null): string {
  if (nombre === null) {
    return "";
  }
  return (
    arrondirNombre(nombre)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "$"
  );
}

export function isBinanceError(object: any): object is BinanceError {
  return "statusMessage" in object;
}

export function subtitleFor(portfolioEntry: PortfolioEntry): string {
  if (portfolioEntry.usdPrice == 0) {
    return "";
  }

  let subtitle = ``;
  if (portfolioEntry.available != 0) {
    subtitle += `${formatNombre(portfolioEntry.usdValue)}`;
  }

  return subtitle;
}

export function getTimestampXDaysAgo(daysAgo: number): number {
  // Obtenez la date actuelle
  const currentDate: Date = new Date();

  // Soustrayez le nombre de jours spécifié
  const xDaysAgo: Date = new Date(currentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  // Obtenez le timestamp en millisecondes
  const timestampXDaysAgo: number = parseInt(xDaysAgo.valueOf().toString().slice(0, -3));
  return timestampXDaysAgo;
}

export function getIcon(assetCurrency: any) {
  const iconPath = path.join(environment.assetsPath, `currency/${assetCurrency.toLowerCase()}.png`);
  const icon = fs.existsSync(iconPath) ? `currency/${assetCurrency.toLowerCase()}.png` : `currency/generic.png`;
  return icon;
}

export function getBinanceDataByRequests(
  ticker: string, // "ETHUSDT"
  interval: string, // "1d"
  start: string, // "2023-11-21 00:00:00"
  end: string // "2023-11-22 00:00:00"
): Promise<{ open: number; high: number; low: number; close: number }[]> {
  const startTime: number = new Date(start).getTime();
  const endTime: number = new Date(end).getTime();

  const data: { open_time: number }[] = [];

  return new Promise((resolve) => {
    (async function fetchData(start: number): Promise<void> {
      const url: string = `https://www.binance.com/api/v3/klines?symbol=${ticker}&interval=${interval}&limit=1000&startTime=${start}&endTime=${endTime}`;

      try {
        const response = await axios.get<any[]>(url, {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        data.push(...response.data.map((item) => ({ open_time: item?.open_time })));

        const lastTimestamp: number = data[data.length - 1]?.open_time + 1;

        if (lastTimestamp < endTime) {
          await fetchData(lastTimestamp);
        } else {
          resolve(
            response.data.map((item) => ({
              currency: ticker,
              date: new Date(item[0]),
              open: item[1],
              high: item[2],
              low: item[3],
              close: item[4],
            }))
          );
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        resolve([]);
      }
    })(startTime);
  });
}

export function getTypeFilter(type: any): TypeFilterAttribute {
  return ("stats" + type) as TypeFilterAttribute;
}

export function calculerAugmentation(prixInitial: any, prixFinal: any): number {
  try {
    // Assurez-vous que les valeurs entrées sont des nombres positifs
    if (isNaN(prixInitial) || isNaN(prixFinal) || prixInitial < 0 || prixFinal < 0) {
      throw new Error("Veuillez entrer des valeurs numériques positives.");
    }

    // Calcul de l'augmentation en pourcentage
    const augmentation: number = ((prixFinal - prixInitial) / prixInitial) * 100;

    return augmentation;
  } catch (error: any) {
    return error.message;
  }
}

export function getValueFromTicker(marker: any, days: number, available: number) {
  const daysARetirer = days > marker.length - 1 ? marker.length - 1 : days;
  const price = marker[marker.length - 1 - daysARetirer][1];
  const priceBefore = marker[marker.length - 1 - daysARetirer + 1][1];

  const stats = {
    value: 0,
    percent: 0,
  };

  return stats;
}

export function convertirDateEnTimestamp(dateISO: string): number | string {
  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) {
      throw new Error("Format de date invalide. Utilisez le format ISO, par exemple, '2019-10-01'.");
    }

    const timestamp = Math.floor(date.getTime() / 1000);
    return timestamp;
  } catch (error: any) {
    return error.message;
  }
}

export function getBorrowFromPortolio(portfolio: Portfolio) {
  return portfolio
    .map((asset) => {
      if (asset.usdValue < 0) {
        return asset.usdValue;
      }
      return 0; // Retourne 0 pour les valeurs non valides
    })
    .reduce((total, value) => {
      if (value !== null && value !== undefined) {
        return total + value; // Ajoute la valeur au total
      }
      return total; // Ne modifie pas le total pour les valeurs non valides
    }, 0); // Initialisation du total à 0
}

export function getDeptTotal(total: number | null, totalBorrowed: number) {
  return totalBorrowed ? "1," + (-(totalBorrowed * 100) / (total ?? 0)).toFixed(0) : 0;
}

export function getLibelleConvertirPercent(state: PortfolioState, portfolioEntry: PortfolioEntry, percent: number) {
  return (
    percent +
    "% = " +
    arrondirNombre((state.total! - state.usdBorrowed) * (percent / 100)) +
    "$ soit " +
    numberToString(arrondirNombre((state.total! - state.usdBorrowed) * (percent / 100) - portfolioEntry.usdValue)) +
    "$"
  );
}

export function calculerMoyenneAchatVente(achats: any[]): number {
  let sommeProduits = 0;
  let sommeQuantites = 0;

  achats.forEach((achat) => {
    const prix = parseFloat(achat.price);
    const quantite = parseFloat(achat.qty);

    sommeProduits += prix * quantite;
    sommeQuantites += quantite;
  });

  const moyenneAchat = sommeProduits / sommeQuantites;
  return moyenneAchat;
}

export function calculerBeneficeNet(achats: any[], ventes: any[], surplusActuel: number): number {
  // Calcul du coût total des achats
  const coutTotalAchats = achats.reduce((total, achat) => total + achat.price * achat.qty, 0);

  // Calcul du produit total des ventes
  const produitTotalVentes = ventes.reduce((total, vente) => total + vente.price * vente.qty, 0);

  // Calcul du bénéfice brut
  const beneficeBrut = produitTotalVentes - coutTotalAchats + surplusActuel;

  // Calcul du bénéfice net en tenant compte des commissions, taxes, etc.
  const beneficeNet = beneficeBrut; // Vous pouvez ajuster ce calcul en fonction de vos besoins

  return beneficeNet;
}

export function arrondirNombre(nombre: number | null): number {
  if (nombre) {
    const partieEntiere = parseFloat(nombre.toString());

    if (partieEntiere >= 100) {
      return Math.round(partieEntiere);
    } else if (partieEntiere >= 10) {
      return parseFloat(partieEntiere.toFixed(1));
    } else if (partieEntiere >= 0.1) {
      return parseFloat(partieEntiere.toFixed(2));
    } else if (partieEntiere >= 0.01) {
      return parseFloat(partieEntiere.toFixed(3));
    } else if (partieEntiere >= 0.001) {
      return parseFloat(partieEntiere.toFixed(4));
    } else if (partieEntiere >= 0.0001) {
      return parseFloat(partieEntiere.toFixed(5));
    } else {
      return parseFloat(partieEntiere.toFixed(2));
    }
  } else {
    return 0;
  }
}
