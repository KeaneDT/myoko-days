# Myoko Days: assumptions

Every figure or detail on the site that was set by the team, rather than published by an operator, is listed here. They all live in one file, `js/assumptions.js`, so they can be reviewed and replaced in a single edit. This document is generated from that file (`node tools/gen-assumptions.js`); change the numbers there, not here.

## Stay

Room rates are modelled, not quoted. They are priced by the night of arrival, per room, and change with the season and the day of the week.

| ID | Assumption | Value | Used in | Basis | To confirm with |
|---|---|---|---|---|---|
| A-S1 | Six Senses Myoko is open and bookable on every date the site offers | Open year-round, including green season | js/stay.js, Plan page | Six Senses Myoko is planned as a year-round destination. PCG's own target for opening is later than the dates the prototype accepts, so the site treats it as operating. | PCG to confirm opening date and green-season operation |
| A-S2 | Madarao Kogen Hotel, weeknight room rate | ¥18,000 per room per night | js/stay.js | Modelled for a green-season midweek night, room only, tax included. | PCG revenue team |
| A-S3 | Lime Resort Myoko, weeknight room rate | ¥34,000 per room per night | js/stay.js | Modelled as a step above Madarao for a wellness resort with onsen. | PCG revenue team |
| A-S4 | Six Senses Myoko, weeknight room rate | ¥95,000 per room per night | js/stay.js | Modelled for a luxury suite with private onsen. | PCG revenue team / Six Senses |
| A-S5 | Season factor | Jul ×0.95, Aug ×1.2, Obon nights (12–16 Aug) ×1.5, Sep ×1, 1–9 Oct ×1.05, foliage nights (10–25 Oct) ×1.25, 26–31 Oct ×1.05 | js/stay.js | Typical Japanese resort pattern: school holidays and Obon dearest, early July and September calmest. | PCG revenue team |
| A-S6 | Day-of-week factor (Madarao and Lime) | Sun–Thu ×1, Fri ×1.15, Sat ×1.35 | js/stay.js | A night is priced by the day you arrive, so Friday and Saturday nights cost more. | PCG revenue team |
| A-S7 | Day-of-week factor (Six Senses) | Sun–Thu ×1, Fri ×1.2, Sat ×1.45 | js/stay.js | Luxury properties usually carry a steeper weekend premium. | PCG revenue team |
| A-S8 | Long-weekend factor | ×1.3 (never below the day-of-week factor) | js/stay.js | Nights inside a run of three or more days off that includes a Japanese public holiday, such as Silver Week or a Sports Day weekend. Holidays are computed by rule. | PCG revenue team |
| A-S9 | Rooms and what a rate includes | Two guests per room, so rooms = party ÷ 2 rounded up; room only, tax included; rates rounded to the nearest ¥500 | js/stay.js | Keeps the per-person figure simple and comparable. | PCG |
| A-S10 | Map positions of the three PCG properties | Madarao Kogen Hotel 36.8515 N, 138.2909 E; Lime Resort Myoko 36.8640 N, 138.1772 E; Six Senses Myoko 36.8567 N, 138.1550 E | assets/diorama/data/layout.json (hotel, akakura and sixsenses markers), js/data.js (bases) | Madarao Kogen Hotel: published listing coordinates, which agree with jalan.net. Lime Resort Myoko: the Accor listing for 2251-2 Sekigawa, about 250 m from Imori-ike. Six Senses Myoko: no site point is published and the hotel is still to be built; it is placed at the Suginohara gondola base because PCG describes it as slopeside on the resort grounds, so it is accurate to a few hundred metres. Each point is converted to the map by the same method as the activity pins. The map is illustrated and foreshortened, so the three PCG markers are moved from their surveyed points to keep the cluster legible: on the board Lime Resort Myoko sits about 0.8 km further along the foot of Mt Myoko than in the previous version, and Six Senses Myoko about 3.6 km up the Myoko slope from the previous version, closer to the base of the mountain. Other pins are also moved on the board for the same reason: Imori-ike about 1.9 km, Soba making about 2.3 km, the e-bike ride about 1.6 km, the winery about 2.4 km, Sekiyama Shrine about 1.6 km, the rice harvest about 1.7 km and Daruma painting about 0.1 km from their true points (Daruma stays beside the visitor centre, with the Seki River running below both). Sasagamine highland picnic is drawn about 1.5 km towards Mt Kurohime from its surveyed point. Madarao Kogen Hotel is drawn about 0.5 km further down the board than its previous position to give the cluster room. | PCG to confirm the Six Senses site and the exact building positions |
| A-S11 | Calendar price colours and own-stay comparison | Lower: within 2% of the displayed month's minimum nightly rate; standard: up to 20% above it; higher: above 20%. Own-stay comparisons use Madarao Kogen Hotel without adding accommodation to the trip. | js/calendar.js | Interface comparison bands for the existing modelled room-night rates, not live prices or availability. Adjacent-date arrows compare the complete stay total for the same trip length, party and property. | Team to review before launch |

### Worked examples (per room, per night, in yen)

| Night | Weeknight (Tue) | Saturday | Holiday-weekend Sunday | Obon Sunday | Obon Friday | Autumn colour Tuesday |
|---|---:|---:|---:|---:|---:|---:|
| Madarao Kogen Hotel | ¥18,000 | ¥24,500 | ¥23,500 | ¥27,000 | ¥31,000 | ¥22,500 |
| Lime Resort Myoko | ¥34,000 | ¥46,000 | ¥44,000 | ¥51,000 | ¥58,500 | ¥42,500 |
| Six Senses Myoko | ¥95,000 | ¥138,000 | ¥123,500 | ¥142,500 | ¥171,000 | ¥119,000 |

The dates are examples of how the rule behaves, not offers. A trip of N days is N − 1 nights, each priced by its own arrival date; rooms = party ÷ 2, rounded up.

## Getting around

Transport figures used to total a trip.

| ID | Assumption | Value | Used in | Basis | To confirm with |
|---|---|---|---|---|---|
| A-T1 | Chartered van | ¥30,000 per day for the group | js/app.js (getAround) | About five hours of hire a day for a nine-seat van with driver, fuel and tolls, at about ¥6,000 an hour. | PCG transport |
| A-T2 | Party sizes | Solo 1, couple 2, friends 4, family with parents 4 | js/assumptions.js | Used to split the van and the rooms. | Team |
| A-T3 | Tokyo–Nagano return rail | ¥16,680 per person | js/data.js, Review page | Two reserved-seat fares of ¥8,340 each. | Re-check against JR East before launch |
| A-T4 | Currency conversion | ¥120 = S$1 | js/data.js | The conversion used in the course. | Team |

## Activities

Prices, meeting points and hosts that were not published when the activities were researched.

| ID | Assumption | Value | Used in | Basis | To confirm with |
|---|---|---|---|---|---|
| A-P1 | Daruma painting price | ¥2,500 | js/data.js | Modelled on a one-hour craft session with materials. | Host to confirm |
| A-P2 | Evening onsen hopping price | ¥1,500 | js/data.js | Modelled on two or three public-bath entries. | Onsen towns |
| A-P3 | Free activities | Shown as free | js/data.js | Public paths, baths and boardwalks with no entry charge at the time of research. | Re-check before launch |
| A-M1 | Meeting points for Rice Harvest and Forest Therapy | Myoko Connect meeting point, Sekigawa; Nojiri Lake visitor point | js/data.js | No venue was published, so a plausible meeting point is used for the map. | Host to confirm |
| A-M2 | Hosts for Daruma, picnic and forest walk | Venue or supplier described generically | js/data.js | Individual hosts were not agreed at the time of writing. | Team |

## Map

How the diorama draws the valley.

| ID | Assumption | Value | Used in | Basis | To confirm with |
|---|---|---|---|---|---|
| A-R1 | Railway line and stations | One continuous line from the north edge (towards Takada) through Myoko-Kogen to the south edge (towards Nagano); stations at Kurohime, Myoko-Kogen, Sekiyama, Nihongi and Arai | assets/diorama/data/layout.json, assets/diorama/kit/trains.js | Myoko-Kogen is where the Kita-Shinano Line (Shinano Railway, to Nagano) meets the Myoko Haneuma Line (Echigo Tokimeki Railway, to Arai and Takada). Station order and distances from Myoko-Kogen are from public line data (Sekiyama 6.4 km, Nihongi 14.7 km, Arai 21.0 km); the drawn curve and the position of Nihongi are interpolated and the map is foreshortened. | Team |
| A-R2 | Trains | A Shinano Railway train from Kurohime and an Echigo Tokimeki train from Sekiyama, taking turns to arrive, wait at Myoko-Kogen and leave | assets/diorama/kit/trains.js | Illustrative movement only; it is not the real timetable. Both lines share the one drawn track and platform, where in reality the Shinano trains use platform 2 and the Echigo Tokimeki trains platform 3. | Team |

## Copy

Wording that describes rather than reports.

| ID | Assumption | Value | Used in | Basis | To confirm with |
|---|---|---|---|---|---|
| A-C1 | Seasonal lines for each month | One descriptive line per month | js/data.js | General seasonal character, not a forecast. | Team |

## Changing a number

1. Edit `js/assumptions.js` (values in `v`, wording in `items`).
2. Run `node tools/gen-assumptions.js` to refresh this file.
3. Run `node verification/test-stay.cjs` and `node verification/test-assumptions.cjs`.
