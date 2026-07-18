export const iso2ToIso3: Record<string, string> = {
  "US": "USA",
  "UK": "GBR",
  "GB": "GBR",
  "IN": "IND",
  "BR": "BRA",
  "CA": "CAN",
  "AU": "AUS",
  "JP": "JPN",
  "DE": "DEU",
  "FR": "FRA",
  "IT": "ITA",
  "ES": "ESP",
  "MX": "MEX",
  "CN": "CHN",
  "KR": "KOR",
  "RU": "RUS",
  "ZA": "ZAF",
  "TW": "TWN",
  "NG": "NGA",
  "EG": "EGY"
};

export function getIso3(iso2: string): string {
  return iso2ToIso3[iso2.toUpperCase()] || iso2.toUpperCase();
}
