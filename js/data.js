/* Myoko Days — content and geography.
   Coordinates are [longitude, latitude].
   "gps"    = taken from the GPS tags in our fieldwork photos (5–9 Oct 2026)
   "pub"    = published coordinates (GSI, official tourism sites, operators)
   "tbc"    = modelled meeting point (see ASSUMPTIONS.md); kept out of the zone centres used for distances
   art = [x%, y%] position on assets/map/myoko-art.jpg (bird's-eye painting, not to scale). Verified 15 Oct 2026. */
window.MD = window.MD || {};

MD.data = (function () {
  const AS = MD.assume.v;                                   // modelled figures live in js/assumptions.js
  const GS = [5, 6, 7, 8, 9, 10];
  const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const zones = {
    MK: { name: "Myoko Kogen Highlands", short: "Myoko Kogen" },
    NJ: { name: "Lake Nojiri & Kurohime", short: "Lake Nojiri" },
    MD: { name: "Madarao", short: "Madarao" },
    AR: { name: "Sekiyama & Arai", short: "Sekiyama & Arai" },
    IZ: { name: "Iizuna", short: "Iizuna" }
  };

  /* u = half-day units (0 = short stop or evening add-on, 2 = full day)
     w = am | pm | any | full     ef = 1 Seated … 5 Active
     src = ours (our team did it) | mates (another class group did it) | desk (researched) */
  const activities = [
    // ---------- Done on fieldwork ----------
    { id: "imori", name: "Visitor Center & Imori-ike Pond", zone: "MK", ll: [138.17448, 36.86536], geo: "pub", art: [40.25, 47.16], cat: "leaf",
      u: 1, w: "any", ef: 2, price: 0, months: GS, host: "National park staff", src: "ours",
      ph: "Imori-ike with Mt Myoko reflected",
      desc: "A 500 m boardwalk around a pond that mirrors Mt Myoko, beside the national park visitor centre." },
    { id: "daruma", name: "Daruma Painting", zone: "MK", ll: [138.17744, 36.86593], geo: "gps", art: [40.42, 48.09], cat: "craft",
      u: 1, w: "any", ef: 1, price: AS.price.daruma, months: ALL, host: AS.hosts.daruma, src: "ours",
      ph: "Brush on a red daruma",
      desc: "Paint your own daruma doll in a tatami hall in Sekigawa, seven minutes' walk from the visitor centre." },
    { id: "picnic", name: "Sasagamine Highland Picnic", zone: "MK", ll: [138.09731, 36.8582], geo: "gps", art: [39.74, 26.8], cat: "food",
      u: 1, w: "any", ef: 2, price: 2000, lunch: true, months: GS, host: AS.hosts.picnic, src: "ours",
      ph: "Sasagamine meadow in morning fog",
      desc: "A bento lunch in a high meadow at about 1,300 m, with cattle grazing and Mt Myoko behind." },
    { id: "naena", name: "Naena Falls Walk", zone: "MK", ll: [138.13266, 36.84999], geo: "pub", art: [37.03, 36.27], cat: "walk",
      u: 1, w: "any", ef: 4, price: 0, months: [5, 6, 7, 8, 9, 10, 11], host: "Self-guided", src: "ours",
      ph: "Naena Falls from the suspension bridge",
      desc: "Stairs and a suspension bridge lead to a 55 m waterfall, one of Japan's top 100 falls." },
    { id: "soba", name: "Soba Making (Lunch included)", zone: "MK", ll: [138.1625, 36.84307], geo: "gps", art: [34.21, 44.74], cat: "food",
      u: 1, w: "am", ef: 1, price: 5000, lunch: true, months: ALL, host: "Myoko Connect", src: "ours",
      ph: "Hands cutting fresh soba",
      desc: "Knead, roll and cut kosoba, Myoko's buckwheat noodles, then eat them for lunch." },
    { id: "rice", name: "Rice Harvest & Sasa-zushi", zone: "MK", ll: AS.meeting.rice.ll, geo: "tbc", art: [60, 60], cat: "food",
      u: 1, w: "am", ef: 4, price: 5000, lunch: true, months: [9, 10], host: "Myoko Connect", src: "mates",
      ph: "Rice drying on the bank at harvest",
      desc: "Help bring in the rice, then prepare sasa-zushi with local toppings on bamboo leaves. Harvest season only." },
    { id: "zip", name: "Madarao Forest Zip Line", zone: "MD", ll: [138.2875, 36.84988], geo: "gps", art: [31.31, 90.26], cat: "sky",
      u: 1, w: "am", ef: 5, price: 4500, months: GS, host: "Ryusei Nakano", src: "ours",
      ph: "Zip line through mountain fog",
      desc: "A course of zip lines through the forest behind Madarao Kogen Hotel. Age and weight limits apply." },
    { id: "madarao", name: "Mt Madarao Hike via Tangram Chairlift", zone: "MD", ll: [138.26273, 36.85429], geo: "pub", art: [34.02, 79.11], cat: "walk",
      u: 1, w: "am", ef: 4, price: 1600, months: GS, host: "Self-guided", src: "mates",
      ph: "View over Lake Nojiri from Mt Madarao",
      desc: "Ride the sightseeing chairlift, then walk to the 1,382 m summit for views over Lake Nojiri." },
    { id: "forest", name: "Forest Therapy Walk", zone: "NJ", ll: AS.meeting.forest.ll, geo: "tbc", art: [31, 58], cat: "leaf",
      u: 1, w: "am", ef: 2, price: 5000, months: GS, host: AS.hosts.forest, src: "mates",
      ph: "Elephant Trail beside Lake Nojiri",
      desc: "A slow guided walk in the woods above Lake Nojiri, focused on breathing and noticing." },
    { id: "ebike", name: "E-Bike Through the Rice Fields", zone: "NJ", ll: [138.18389, 36.79759], geo: "gps", art: [19.67, 51.92], cat: "bike",
      u: 1, w: "am", ef: 4, price: 6000, months: GS, host: "Nanase Iyoshi", src: "ours",
      ph: "Golden rice field under a big sky",
      desc: "An assisted ride along farm roads and levees near Kurohime, with a gelato stop.",
      route: [[138.1965, 36.8081], [138.20407, 36.80562], [138.19771, 36.79885], [138.18389, 36.79759],
              [138.18509, 36.7858], [138.19368, 36.78813], [138.20777, 36.83363]],
      routeArt: [[21.65, 56.36], [20.32, 58.88], [18.89, 56.49], [19.67, 51.92], [16.2, 52.03], [16.15, 54.78], [28.81, 59.95]] },
    { id: "sup", name: "Stand-Up Paddling", zone: "NJ", ll: [138.20542, 36.82729], geo: "pub", art: [26.86, 59.44], cat: "water",
      u: 1, w: "pm", ef: 5, price: 6600, months: GS, host: "Haruna Maruyama & Shu Jito", src: "ours",
      ph: "Paddleboard on blue Lake Nojiri",
      desc: "Paddle on calm Lake Nojiri with SLOPE PLANNING's guides. Wetsuits provided." },
    { id: "kayak", name: "Kayaking", zone: "NJ", ll: [138.20849, 36.83255], geo: "gps", art: [28.37, 60.27], cat: "water",
      u: 1, w: "pm", ef: 4, price: 6600, months: GS, host: "SLOPE PLANNING", src: "mates",
      ph: "Kayak bow on the lake",
      desc: "A steadier way onto the lake than paddleboarding, good for pairs." },
    { id: "cruise", name: "Lake Cruise & Island Shrine", zone: "NJ", ll: [138.20721, 36.83392], geo: "pub", art: [28.96, 59.75], cat: "water",
      u: 1, w: "any", ef: 1, price: 1800, months: GS, host: "Nojiriko Teikisen", src: "mates",
      ph: "Mount Myoko from the lake cruise",
      desc: "A seated boat trip from the Line Plaza pier to Biwajima, the island shrine. No sailings in winter." },
    { id: "winery", name: "St Cousair Winery & Orchard", zone: "IZ", ll: [138.25981, 36.76761], geo: "pub", art: [4.46, 75.04], cat: "food",
      u: 1, w: "any", ef: 3, price: 6500, lunch: true, months: ALL, host: "St Cousair staff", src: "ours",
      ph: "Vineyard path to the chapel",
      desc: "Vineyard path, apple orchard, a tasting and lunch, plus the nearby apple shop. On the way to Nagano, so it suits the last day." },
    { id: "culture", name: "Local Culture Tour", zone: "AR", ll: [138.19529, 36.85459], geo: "pub", art: [36.51, 54.43], cat: "culture",
      u: 1, w: "pm", ef: 3, price: 3500, months: ALL, host: "Myoko Connect", src: "ours",
      ph: "Shrine steps in cedar forest",
      desc: "An afternoon by bus along the old North Country Road, from the Sekigawa checkpoint to Arai.",
      stops: [
        { name: "Sekigawa Guardhouse & Road History Museum", ll: [138.19529, 36.85459], art: [36.51, 54.43] },
        { name: "Sekiyama Shrine", ll: [138.21339, 36.93585], art: [61.31, 61.48] },
        { name: "Kiminoi Sake Brewery, Arai", ll: [138.25164, 37.02956], art: [91.9, 69.51] },
        { name: "Kanzuri Chilli Paste Maker", ll: [138.26896, 37.03011], art: [93.07, 80.74] }
      ] },

    // ---------- More in the Myoko area (desk research) ----------
    { id: "tsubame", name: "Tsubame Onsen Outdoor Bath", zone: "MK", ll: [138.14111, 36.90258], geo: "pub", art: [50.4, 36.99], cat: "onsen",
      u: 1, w: "pm", ef: 3, price: 0, months: [5, 6, 7, 8, 9, 10, 11], host: "Free public bath", src: "desk",
      ph: "Milky hot spring by a mountain river",
      desc: "A free milky-white hot spring by a river, 15 minutes up a mountain trail. Open early May to early November." },
    { id: "onsen", name: "Evening Onsen Hopping", zone: "MK", ll: [138.17683, 36.89437], geo: "pub", art: [48.5, 47.81], cat: "onsen",
      u: 0, slot: "eve", ef: 1, price: AS.price.onsen, months: ALL, host: "Onsen towns", src: "desk",
      ph: "Steam rising over an outdoor bath",
      desc: "Myoko has seven hot springs a few minutes apart, each with different water: clear, black, milky or iron-red." },
    { id: "yume", name: "Yumemidaira Trail", zone: "MK", ll: [138.07195, 36.85772], geo: "pub", art: [40.1, 21.82], cat: "walk",
      u: 1, w: "am", ef: 4, price: 0, months: GS, host: "Self-guided", src: "desk",
      ph: "Trail through beech forest",
      desc: "A 5 km loop from Sasagamine Dam. Steep steps at the start, gentle after." },
    { id: "mtmyoko", name: "Guided Mt Myoko Summit Hike", zone: "MK", ll: [138.14523, 36.90241], geo: "pub", art: [50.39, 38.19], cat: "walk",
      u: 2, w: "full", ef: 5, price: 14100, months: [7, 8, 9, 10], host: "Mountain guide (English)", src: "desk",
      ph: "Mt Myoko summit ridge",
      desc: "A full day: 10.6 km and 1,823 m of climbing to the 2,454 m summit. Starts at 6:00 from Tsubame Onsen." },
    { id: "cosmos", name: "Kurohime Cosmos Garden & Lift", zone: "NJ", ll: [138.16052, 36.82756], geo: "pub", art: [29.89, 44.2], cat: "leaf",
      u: 1, w: "any", ef: 2, price: 2750, months: [9, 10], host: "Kurohime Kogen", src: "desk",
      ph: "Cosmos field with mountains behind",
      desc: "A million cosmos at their peak from mid-September, with a panoramic lift over Lake Nojiri." },
    { id: "foodwalk", name: "Arai Food Walk", zone: "AR", ll: [138.25562, 37.02684], geo: "pub", art: [91.3, 72.53], cat: "food",
      u: 2, w: "full", ef: 3, price: 11300, lunch: true, months: [5, 6, 7, 8, 9, 10], host: "Heartland Japan", src: "desk",
      ph: "Miso barrels in a cellar",
      desc: "Six hours on foot around Arai: rice balls, miso, kanzuri and sake. 4.4 km, flat. Starts at Arai Station." },
    { id: "farmers", name: "Farmers' Shop at Road Station Arai", zone: "AR", ll: [138.22589, 37.02612], geo: "pub", art: [89.64, 65.26], cat: "food",
      u: 0, slot: "stop", ef: 1, price: 0, months: ALL, host: "About 90 local farmers", src: "desk",
      ph: "Shelves of morning vegetables",
      desc: "Vegetables picked that morning, Myoko rice and sasadango to take home." }
  ];

  const courses = {
    restore: { name: "Restore", promise: "Slow days, open views, room to breathe", for: "For escaping the routine",
      ids: ["imori", "picnic", "naena", "forest", "cruise", "winery"], walk: 3, ph: "Imori-ike at dawn" },
    discover: { name: "Discover", promise: "Hands-on with the people who make Myoko", for: "For something new and local",
      ids: ["imori", "soba", "daruma", "culture", "winery"], walk: 3, ph: "Daruma dolls drying" },
    active: { name: "Move", promise: "Move through Myoko, with a little help", for: "For outdoor adventures",
      ids: ["zip", "picnic", "naena", "ebike", "sup"], walk: 5, ph: "Paddleboard on Lake Nojiri" }
  };

  const stations = [
    { name: "Myoko-Kogen", ll: [138.21235, 36.87231], art: [42.03, 58.94] },
    { name: "Kurohime", ll: [138.19715, 36.80731], art: [21.37, 56.57] },
    { name: "Sekiyama", ll: [138.22676, 36.93249], art: [60.61, 67.04] },
    { name: "Arai", ll: [138.25562, 37.02684], art: [91.3, 72.53] },
    { name: "Nagano", ll: [138.1887, 36.6431], note: "Shinkansen", art: null }
  ];

  const peaks = [
    { name: "Mt Myoko", ja: "妙高山", el: "2,454 m", ll: [138.11361, 36.89139], art: [47.09, 26.20] },
    { name: "Mt Kurohime", ja: "黒姫山", el: "2,053 m", ll: [138.12722, 36.81333], art: [28.14, 29.44] },
    { name: "Mt Madarao", ja: "斑尾山", el: "1,382 m", ll: [138.27421, 36.83739], art: [26.40, 82.50] },
    { name: "Mt Iizuna", ja: "飯縄山", el: "1,917 m", ll: [138.13369, 36.73955], art: [7.96, 31.92] }
  ];

/* Landmark labels on the painting (x%, y% of assets/map/myoko-art.jpg). p = priority, 1 = always shown */
  const landmarks = [
    { kind: "lake", name: "Lake Nojiri", ja: "野尻湖", art: [25.70, 66.33], p: 1 },
    { kind: "island", name: "Biwajima", ja: "琵琶島", art: [29.7, 63.0], p: 3 },   // label sits beside the island; the island picture is in js/vignettes.js
    { kind: "plateau", name: "Sasagamine", ja: "笹ヶ峰", art: [40.37, 19.24], p: 2 },
    { kind: "lake", name: "Sasagamine Dam lake", ja: "笹ヶ峰ダム湖", art: [41.46, 24.88], p: 3 },
    { kind: "area", name: "Myoko Kogen", ja: "妙高高原", art: [38.82, 53.07], p: 1 },
    { kind: "area", name: "Madarao Kogen", ja: "斑尾高原", art: [29.50, 92.04], p: 2 },
    { kind: "town", name: "Arai", ja: "新井", art: [91.23, 70.48], p: 2 },
    { kind: "area", name: "Shinanomachi", ja: "信濃町", art: [17.08, 53.07], p: 2 },
    { kind: "sea", name: "Sea of Japan", ja: "日本海", art: [95.89, 14.10], p: 2 }
  ];

  /* The four ways to stay. The three PCG properties are map landmarks; "own" means the days start from Myoko-Kogen Station.
     ll = [longitude, latitude]. Sources and accuracy are in ASSUMPTIONS.md, A-S10:
       Madarao Kogen Hotel  36.85148, 138.29085  OpenStreetMap-based listing; agrees with jalan.net (36.85156, 138.2909)
       Lime Resort Myoko    36.86401, 138.17722  Accor listing for 2251-2 Sekigawa, about 250 m from Imori-ike
       Six Senses Myoko     36.85665, 138.15501  the Suginohara gondola base: the site is "slopeside" on the resort grounds and
                                                 PCG has not published a site point yet (accurate to a few hundred metres) */
  const ST = MD.stay.OPTIONS;
  const bases = {
    madarao:   { name: ST.madarao.name,   place: "Iiyama, Nagano",          ll: [138.29085, 36.85148], art: [31.93, 91.76], token: "hotel" },
    lime:      { name: ST.lime.name,      place: "Sekigawa, Myoko Kogen",   ll: [138.17722, 36.86401], art: null, token: "akakura" },
    sixsenses: { name: ST.sixsenses.name, place: "Suginohara, Myoko Kogen", ll: [138.15501, 36.85665], art: null, token: "sixsenses" },
    own:       { name: ST.own.name,       place: "Myoko-Kogen Station",     ll: [138.21235, 36.87231], art: null, token: null }
  };


  const transport = {
    MK: [["bus", "Keinan bus, Myoko-Kogen Station to Ikenotaira Imori-ike, about 10 min"],
         ["van", "Sasagamine, Naena Falls and Tsubame: Myoko Loop shuttle", true]],
    NJ: [["rail", "Shinano Railway, Myoko-Kogen to Kurohime, one stop"],
         ["taxi", "Kurohime Station to the lakeshore, short taxi or shuttle"]],
    MD: [["van", "Madarao Kogen Hotel van (a taxi from Myoko-Kogen is about ¥5,600–7,500)"]],
    IZ: [["van", "Hotel van or taxi to St Cousair Winery, then on to Nagano Station"]],
    AR: [["rail", "Myoko Haneuma Line, Myoko-Kogen to Sekiyama or Arai"],
         ["bus", "Culture tour bus run by Myoko Connect"]]
  };

  const hosts = [
    ["Kotaro Nomura", "Myoko Coffee", "A café perspective on local life"],
    ["Seiko Ohata", "Myoko Connect", "Licensed English guide-interpreter"],
    ["Nanase Iyoshi", "E-bike guide", "Rides the Kurohime farm roads"],
    ["Haruna Maruyama", "SLOPE PLANNING", "Paddleboard guide on Lake Nojiri"]
  ];

  const months = { 7: "July", 8: "August", 9: "September", 10: "October" };
  const events = AS.monthLine;

  /* Placeholder photos from our fieldwork folders, in assets/img. Swap the file, keep the name.
     Activities without a photo show a green placeholder instead. */
  const IMG = {
    naena: "falls", sup: "lake", kayak: "lake", cruise: "cruise", forest: "forest", picnic: "mist",
    ebike: "rice", rice: "rice-harvest", winery: "grapes", culture: "road", farmers: "apples", madarao: "valley-view"
  };
  activities.forEach(a => { a.img = IMG[a.id] || null; });
  courses.restore.img = "mist"; courses.discover.img = "road"; courses.active.img = "lake";
  const photos = { hero: "hero", strip: [["falls", "Naena Falls"], ["lake", "Lake Nojiri"], ["grapes", "St Cousair vineyard"]], cta: "valley-view" };

  return {
    photos, zones, activities, courses, stations, peaks, landmarks, bases, transport, hosts, months, events,
    effort: ["", "Seated", "Gentle", "Easy", "Moderate", "Active"],
    walk: [[3, "Flat and short"], [4, "Some hills and steps"], [5, "Active days"]],
    who: [["couple", "Couple"], ["family", "Family with parents"], ["friends", "Friends"], ["solo", "Solo"]],
    yenPerSgd: AS.yenPerSgd,
    railReturn: AS.railReturn,
    byId: Object.fromEntries(activities.map(a => [a.id, a]))
  };
})();
