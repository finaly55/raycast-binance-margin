import { getPreferenceValues } from "@raycast/api";

export const authVersion = 2;
let APIKEY = getPreferenceValues().kucoin_api_key;
let APISECRET = getPreferenceValues().kucoin_api_secret;
let PASSPHRASE = getPreferenceValues().kucoin_passphrase;

export const baseUrl = "https://openapi-v2.kucoin.com";
export const apiAuth = {
  key: APIKEY,
  secret: APISECRET,
  passphrase: PASSPHRASE,
};
