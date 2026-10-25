/* Myoko Days — the painted icons that are the map's pins for the team's own activities.
   at   = where the CENTRE of the picture sits on the painting (% of width, % of height), chosen so each scene lies
          over matching ground: the lake scenes on Lake Nojiri (the cruise beside Biwajima), the falls in their gorge,
          the e-bike over the rice fields, the hotel on its slope.
   k    = size tier: 1.25 large (landscapes and the hotel), 0.9 medium (the lake, the meadow, the pond, the forest,
          the rice fields), 0.7 small (single buildings).
   icon = the picture (512 x 512 WebP, centred), made by tools/icons/cutout.py.
   The hotel is the base marker when the trip is based at Madarao Kogen. */
window.MD = window.MD || {};
MD.pinArt = {
  naena:   { at: [37.00, 36.00], k: 0.95, icon: "assets/icons/naena.webp" },
  madarao: { at: [33.80, 79.00], k: 1.25, icon: "assets/icons/madarao.webp" },
  winery:  { at: [4.60, 74.40],  k: 1.25, icon: "assets/icons/winery.webp" },
  hotel:   { at: [33.40, 91.20], k: 1.25, icon: "assets/icons/hotel.webp" },
  // Lake Nojiri: only the boats, people and the island are painted, straight onto the map's own lake
  sup:     { at: [23.40, 66.60], k: 1.6,  icon: "assets/icons/sup.webp" },
  kayak:   { at: [26.20, 69.40], k: 1.5,  icon: "assets/icons/kayak.webp" },
  cruise:  { at: [27.50, 62.20], k: 0.95, icon: "assets/icons/cruise.webp" },
  picnic:  { at: [36.00, 27.20], k: 0.9,  icon: "assets/icons/picnic.webp" },
  imori:   { at: [41.00, 46.00], k: 1.15, icon: "assets/icons/imori.webp" },
  zip:     { at: [28.60, 86.60], k: 0.9,  icon: "assets/icons/zip.webp" },
  ebike:   { at: [19.00, 55.50], k: 0.9,  icon: "assets/icons/ebike.webp" },
  daruma:  { at: [37.90, 51.00], k: 0.7,  icon: "assets/icons/daruma.webp" },
  soba:    { at: [34.00, 46.50], k: 0.7,  icon: "assets/icons/soba.webp" },
  culture: { at: [36.30, 55.00], k: 0.7,  icon: "assets/icons/culture.webp" }
};
/* The Local Culture Tour's other stops, each with its own picture (the daruma hall, repainted with what the stop is
   known for by tools/icons/products.py). They open the culture tour and light up with it. */
MD.pinStops = [
  { id: "sekiyama", act: "culture", name: "Sekiyama Shrine",            at: [61.31, 61.48], k: 0.7, icon: "assets/icons/shrine.webp" },
  { id: "kiminoi",  act: "culture", name: "Kiminoi Sake Brewery",       at: [91.90, 69.51], k: 0.7, icon: "assets/icons/sake.webp" },
  { id: "kanzuri",  act: "culture", name: "Kanzuri Chilli Paste Maker", at: [93.07, 80.74], k: 0.7, icon: "assets/icons/chilli.webp" }
];
MD.vignettes = [];   // the old painted-in landmarks are gone; the icons above replace them

/* Painted mist wisps (assets/wisps, made by tools/icons/wisps.py) on the white edges of the painting.
   at = centre (% of the painting), w = width (% of the painting's width), n = which wisp, flip = mirrored,
   dur / delay = seconds for one slow fade in or out, so each breathes on its own. They never move. */
MD.wisps = [
  { at: [12, 10],  w: 16, n: 1, dur: 19, delay: -3 },
  { at: [31, 8.5], w: 14, n: 3, dur: 23, delay: -11, flip: true },
  { at: [58, 7.5], w: 15, n: 2, dur: 17, delay: -6 },
  { at: [84, 12],  w: 13, n: 4, dur: 21, delay: -15, flip: true },
  { at: [8, 25],   w: 13, n: 2, dur: 25, delay: -9, flip: true },
  { at: [25, 27],  w: 10, n: 4, dur: 18, delay: -2 },
  { at: [95, 31],  w: 10, n: 1, dur: 22, delay: -13 },
  { at: [95, 44],  w: 9,  n: 3, dur: 20, delay: -7, flip: true },
  { at: [4, 59],   w: 10, n: 3, dur: 24, delay: -17 },
  { at: [11, 89],  w: 15, n: 1, dur: 20, delay: -5, flip: true },
  { at: [34, 98],  w: 14, n: 2, dur: 26, delay: -12 },
  { at: [63, 95],  w: 13, n: 4, dur: 19, delay: -8, flip: true },
  { at: [90, 94],  w: 14, n: 3, dur: 22, delay: -1 }
];
