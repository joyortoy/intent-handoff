export const HOTEL_PRESENTATION: Record<
  string,
  { displayName: string; photo: string; walk: string }
> = {
  "mitsui-kyobashi": {
    displayName: "Mitsui Garden Hotel Kyobashi",
    photo: "/media/hotel-kyobashi.jpg",
    walk: "2 min walk from Tokyo Station",
  },
  "sotetsu-kanda": {
    displayName: "Sotetsu Fresa Inn Kanda",
    photo: "/media/hotel-kanda.jpg",
    walk: "Near Kanda Station",
  },
  "capsule-ueno": {
    displayName: "Ueno Station Capsule Hotel",
    photo: "/media/hotel-capsule.jpg",
    walk: "24 min from Tokyo Station",
  },
};

export function hotelDisplay(id: string, fallback: string) {
  return HOTEL_PRESENTATION[id]?.displayName ?? fallback;
}

export function hotelPhoto(id: string) {
  return HOTEL_PRESENTATION[id]?.photo ?? "/media/hotel-kyobashi.jpg";
}

export function hotelWalk(id: string, fallback: string) {
  return HOTEL_PRESENTATION[id]?.walk ?? fallback;
}

export const AIRPORT: Record<string, { city: string; country: string; code: string }> = {
  Singapore: { city: "Singapore", country: "Singapore", code: "SIN" },
  Tokyo: { city: "Tokyo", country: "Japan", code: "TYO" },
  Seoul: { city: "Seoul", country: "Korea", code: "ICN" },
  Kyoto: { city: "Kyoto", country: "Japan", code: "KIX" },
};
