/* Myoko Days — every modelled figure in one place.
   Anything the site shows that was set by the team rather than taken from an operator lives here, so it can be reviewed and replaced
   in one edit. ASSUMPTIONS.md is generated from this file (node tools/gen-assumptions.js); do not edit the .md by hand. */
window.MD = window.MD || {};

MD.assume = (function () {
  "use strict";

  const v = {
    /* ---- stays ---- */
    stayRate: { madarao: 18000, lime: 34000, sixsenses: 95000 },        // ¥ per room per night, Sunday to Thursday, standard season
    seasonF: { jul: 0.95, aug: 1.20, obon: 1.50, sep: 1.00, octEarly: 1.05, octPeak: 1.25, octLate: 1.05 },
    obonNights: [[8, 12], [8, 16]],                                      // first and last night, month/day, inclusive
    foliageNights: [[10, 10], [10, 25]],
    dowF: { std: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1.15, 6: 1.35 }, top: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1.20, 6: 1.45 } },
    longWeekendF: 1.30,                                                  // nights inside a run of 3+ days off that includes a public holiday
    roundTo: 500,
    perRoom: 2,                                                          // guests per room; rooms = ceil(party / 2)
    party: { solo: 1, couple: 2, friends: 4, family: 4 },
    /* ---- getting around ---- */
    vanPerDay: 30000,                                                    // ¥ per day for the 9-seat chartered van, driver, fuel and tolls
    railReturn: 16680,                                                   // ¥ Tokyo to Nagano return, reserved seats
    yenPerSgd: 120,
    /* ---- activities that had no price or no meeting point ---- */
    price: { daruma: 2500, onsen: 1500 },
    meeting: {
      rice: { name: "Myoko Connect meeting point, Sekigawa", ll: [138.17, 36.847] },
      forest: { name: "Nojiri Lake visitor point", ll: [138.218, 36.818] }
    },
    hosts: { daruma: "Higashihonganji Youth Center", picnic: "Local bento supplier", forest: "Local forest guide" },
    monthLine: {
      7: "Green at its deepest, with cool mornings in the highlands.",
      8: "Warm lake days and cool evenings in the hills.",
      9: "Rice harvest begins and the air turns crisp.",
      10: "Autumn colour moves down the mountainside."
    }
  };

  const yen = n => "¥" + n.toLocaleString("en-US");
  const items = [
    { id: "A-S1", group: "Stay", label: "Six Senses Myoko is open and bookable on every date the site offers", value: "Open year-round, including green season", where: "js/stay.js, Plan page", basis: "Six Senses Myoko is planned as a year-round destination. PCG's own target for opening is later than the dates the prototype accepts, so the site treats it as operating.", owner: "PCG to confirm opening date and green-season operation" },
    { id: "A-S2", group: "Stay", label: "Madarao Kogen Hotel, weeknight room rate", value: yen(v.stayRate.madarao) + " per room per night", where: "js/stay.js", basis: "Modelled for a green-season midweek night, room only, tax included.", owner: "PCG revenue team" },
    { id: "A-S3", group: "Stay", label: "Lime Resort Myoko, weeknight room rate", value: yen(v.stayRate.lime) + " per room per night", where: "js/stay.js", basis: "Modelled as a step above Madarao for a wellness resort with onsen.", owner: "PCG revenue team" },
    { id: "A-S4", group: "Stay", label: "Six Senses Myoko, weeknight room rate", value: yen(v.stayRate.sixsenses) + " per room per night", where: "js/stay.js", basis: "Modelled for a luxury suite with private onsen.", owner: "PCG revenue team / Six Senses" },
    { id: "A-S5", group: "Stay", label: "Season factor", value: `Jul ×${v.seasonF.jul}, Aug ×${v.seasonF.aug}, Obon nights (12–16 Aug) ×${v.seasonF.obon}, Sep ×${v.seasonF.sep}, 1–9 Oct ×${v.seasonF.octEarly}, foliage nights (10–25 Oct) ×${v.seasonF.octPeak}, 26–31 Oct ×${v.seasonF.octLate}`, where: "js/stay.js", basis: "Typical Japanese resort pattern: school holidays and Obon dearest, early July and September calmest.", owner: "PCG revenue team" },
    { id: "A-S6", group: "Stay", label: "Day-of-week factor (Madarao and Lime)", value: `Sun–Thu ×1, Fri ×${v.dowF.std[5]}, Sat ×${v.dowF.std[6]}`, where: "js/stay.js", basis: "A night is priced by the day you arrive, so Friday and Saturday nights cost more.", owner: "PCG revenue team" },
    { id: "A-S7", group: "Stay", label: "Day-of-week factor (Six Senses)", value: `Sun–Thu ×1, Fri ×${v.dowF.top[5]}, Sat ×${v.dowF.top[6]}`, where: "js/stay.js", basis: "Luxury properties usually carry a steeper weekend premium.", owner: "PCG revenue team" },
    { id: "A-S8", group: "Stay", label: "Long-weekend factor", value: `×${v.longWeekendF} (never below the day-of-week factor)`, where: "js/stay.js", basis: "Nights inside a run of three or more days off that includes a Japanese public holiday, such as Silver Week or a Sports Day weekend. Holidays are computed by rule.", owner: "PCG revenue team" },
    { id: "A-S9", group: "Stay", label: "Rooms and what a rate includes", value: "Two guests per room, so rooms = party ÷ 2 rounded up; room only, tax included; rates rounded to the nearest ¥500", where: "js/stay.js", basis: "Keeps the per-person figure simple and comparable.", owner: "PCG" },
    { id: "A-S10", group: "Stay", label: "Map positions of the three PCG properties", value: "Madarao Kogen Hotel 36.8515 N, 138.2909 E; Lime Resort Myoko 36.8640 N, 138.1772 E; Six Senses Myoko 36.8567 N, 138.1550 E", where: "assets/diorama/data/layout.json (hotel, akakura and sixsenses markers), js/data.js (bases)", basis: "Madarao Kogen Hotel: published listing coordinates, which agree with jalan.net. Lime Resort Myoko: the Accor listing for 2251-2 Sekigawa, about 250 m from Imori-ike. Six Senses Myoko: no site point is published and the hotel is still to be built; it is placed at the Suginohara gondola base because PCG describes it as slopeside on the resort grounds, so it is accurate to a few hundred metres. Each point is converted to the map by the same method as the activity pins. The map is illustrated and foreshortened, so the three PCG markers are moved from their surveyed points to keep the cluster legible: on the board Lime Resort Myoko sits about 0.8 km further along the foot of Mt Myoko than in the previous version, and Six Senses Myoko about 3.6 km up the Myoko slope from the previous version, closer to the base of the mountain. Other pins are also moved on the board for the same reason: Imori-ike about 1.9 km, Soba making about 2.3 km, the e-bike ride about 1.6 km, the winery about 2.4 km, Sekiyama Shrine about 1.6 km, the rice harvest about 1.7 km and Daruma painting about 0.1 km from their true points (Daruma stays beside the visitor centre, with the Seki River running below both). Sasagamine highland picnic is drawn about 1.5 km towards Mt Kurohime from its surveyed point. Madarao Kogen Hotel is drawn about 0.5 km further down the board than its previous position to give the cluster room.", owner: "PCG to confirm the Six Senses site and the exact building positions" },
    { id: "A-T1", group: "Getting around", label: "Chartered van", value: yen(v.vanPerDay) + " per day for the group", where: "js/app.js (getAround)", basis: "About five hours of hire a day for a nine-seat van with driver, fuel and tolls, at about ¥6,000 an hour.", owner: "PCG transport" },
    { id: "A-T2", group: "Getting around", label: "Party sizes", value: "Solo 1, couple 2, friends 4, family with parents 4", where: "js/assumptions.js", basis: "Used to split the van and the rooms.", owner: "Team" },
    { id: "A-T3", group: "Getting around", label: "Tokyo–Nagano return rail", value: yen(v.railReturn) + " per person", where: "js/data.js, Review page", basis: "Two reserved-seat fares of ¥8,340 each.", owner: "Re-check against JR East before launch" },
    { id: "A-T4", group: "Getting around", label: "Currency conversion", value: "¥" + v.yenPerSgd + " = S$1", where: "js/data.js", basis: "The conversion used in the course.", owner: "Team" },
    { id: "A-P1", group: "Activities", label: "Daruma painting price", value: yen(v.price.daruma), where: "js/data.js", basis: "Modelled on a one-hour craft session with materials.", owner: "Host to confirm" },
    { id: "A-P2", group: "Activities", label: "Evening onsen hopping price", value: yen(v.price.onsen), where: "js/data.js", basis: "Modelled on two or three public-bath entries.", owner: "Onsen towns" },
    { id: "A-P3", group: "Activities", label: "Free activities", value: "Shown as free", where: "js/data.js", basis: "Public paths, baths and boardwalks with no entry charge at the time of research.", owner: "Re-check before launch" },
    { id: "A-M1", group: "Activities", label: "Meeting points for Rice Harvest and Forest Therapy", value: `${v.meeting.rice.name}; ${v.meeting.forest.name}`, where: "js/data.js", basis: "No venue was published, so a plausible meeting point is used for the map.", owner: "Host to confirm" },
    { id: "A-M2", group: "Activities", label: "Hosts for Daruma, picnic and forest walk", value: "Venue or supplier described generically", where: "js/data.js", basis: "Individual hosts were not agreed at the time of writing.", owner: "Team" },
    { id: "A-C1", group: "Copy", label: "Seasonal lines for each month", value: "One descriptive line per month", where: "js/data.js", basis: "General seasonal character, not a forecast.", owner: "Team" },
    { id: "A-R1", group: "Map", label: "Railway line and stations", value: "One continuous line from the north edge (towards Takada) through Myoko-Kogen to the south edge (towards Nagano); stations at Kurohime, Myoko-Kogen, Sekiyama, Nihongi and Arai", where: "assets/diorama/data/layout.json, assets/diorama/kit/trains.js", basis: "Myoko-Kogen is where the Kita-Shinano Line (Shinano Railway, to Nagano) meets the Myoko Haneuma Line (Echigo Tokimeki Railway, to Arai and Takada). Station order and distances from Myoko-Kogen are from public line data (Sekiyama 6.4 km, Nihongi 14.7 km, Arai 21.0 km); the drawn curve and the position of Nihongi are interpolated and the map is foreshortened.", owner: "Team" },
    { id: "A-R2", group: "Map", label: "Trains", value: "A Shinano Railway train from Kurohime and an Echigo Tokimeki train from Sekiyama, taking turns to arrive, wait at Myoko-Kogen and leave", where: "assets/diorama/kit/trains.js", basis: "Illustrative movement only; it is not the real timetable. Both lines share the one drawn track and platform, where in reality the Shinano trains use platform 2 and the Echigo Tokimeki trains platform 3.", owner: "Team" }
  ];

  return { v, items };
})();
