# V9 media selection and implementation

22 October 2026. Source: the user-authorised `C:/Users/keanedt/Desktop/Myoko` folder. Original files and folders were read, not reorganised or overwritten. V8 remains separate; this implementation is in `prototype-review/v9/`.

## Media coverage

53 gallery images (44 photographs and 9 video-derived stills), plus 28 silent video excerpts and 28 matching video posters. Twelve galleries have four images, sake has three, and Coffee has two. Each of the 14 galleries has two distinct source videos. The table and source manifest distinguish extracted stills from original photographs.

Eleven existing itinerary activities have exact media matches: Imori-ike/Visitor Center, Daruma, Sasagamine picnic, Naena Falls, e-bike, SUP, kayaking, winery, soba and culture tour, plus zip line. Apple School, Myoko Coffee and sake are separate fieldwork galleries under Local perspectives, not invented new bookable planner activities.

No verified media match was established for rice harvest/sasa-zushi, the Mt Madarao hike, forest therapy or the lake cruise. Researched extras also retain their existing illustrative media unless there is an exact match. These activities do not borrow another experience’s footage. The trip film names missing footage and leaves those activities in the written plan. Coffee has two usable counter stills from its two available videos, rather than three near-duplicate images to satisfy a quota.

## Screening method

The activity photo contact sheets and existing video overview sheets in the Desktop folder were visually inspected to identify candidates. 78 candidate videos then received fresh six-frame strips spanning their source duration. All 28 final excerpts received dense, two-frame-per-second inspection sheets across their complete 4.5–5 second edits (one previously shorter kayaking candidate was replaced). Each encoded excerpt was decoded completely by FFmpeg as a separate technical validation. This is multi-frame visual screening, not a claim that every original file in the large Desktop library was watched in real time or that source audio was reviewed.

Selection favoured an identifiable activity, useful composition, correct orientation, a reasonably readable subject and coherent motion. Briefings, incidental travel, close selfies, obstructions, severe rotations and unrelated subject matter were generally set aside. Portrait material is preserved with `object-fit: contain`; it is not stretched or cut into a false landscape. Ordinary source audio is removed from the site excerpts. The existing hero placeholder is unchanged, including its original audio in the separate full-film viewer.

## Editorial choices

| Gallery | Selected source video suffixes and edit | Reason / alternatives set aside |
| --- | --- | --- |
| Zip line | 035, 1–6s; 057, 1–6s | Two actual launches; avoid long indoor briefings, walking-only footage and obstructed platform view 054 |
| Sasagamine picnic | 174, 5–10s; 181, 0.4–5.4s | Open meadow and grazing cattle; avoid finger/rotation at edges of 175 and ground-only 160/163 |
| Naena Falls | 111, 4–9s; 116, 3–8s | Clear falls views in two orientations; omit bridge/dam-only footage and people blocking the falls |
| E-bike | 162, 5–10s; 186, 0.4–5.4s | Farm-road landscape and riders; omit the obstructed end of 161 and later tilted section of 186 |
| SUP | 094, 0.3–5.3s; 086, 0.4–5.4s | Standing paddlers and balance; the initial 088 excerpt had a swimmer/empty board distracting from the paddler and was replaced |
| Kayaking | 079, 0.8–5.8s; 091, 7–12s | Seated double-blade paddling and a wider kayak view; 084 is rotated/underwater and was rejected; a dark 089 candidate was replaced with the clearer 079 |
| Imori-ike | 003, 1–6s; 079, 3–8s | Pond panorama and visitor-centre view; avoid a briefing-only sequence as the primary destination scene |
| Daruma | 035, 0.5–5.5s; 036, 32–37s | Finished doll and marker work; avoid outdoor 032, instruction-sheet-only 031 and long indoor briefing 034 |
| Winery | 168, 2–7s; 170, 4–9s | Vines and the winery’s view; avoid the phone/selfie-led 071 sequence and long conversations |
| Soba | 004, 0.7–5.7s; 036, 4–9s | Mixing and rolling close-ups; avoid wide briefing/selfie sequences and obstructed 021 |
| Culture tour | 215, 1–6s; 121, 0.8–5.8s | Local explanation and wooded cultural stop; 234 brewery footage is retained as a candidate but not needed for this short pair |
| Apple School | 019, 0.5–5.5s; 024, 1–6s | Visit context and apple products; avoid the incidental travel/rotation in 026/027 and selfie turn in 023 |
| Coffee | 009, 1–6s; 010, 0.2–4.7s | The two available counter views; only two distinct usable still compositions retained |
| Sake | 003, 0.3–5.3s; 013, 19–24s | Tasting glasses and bottle introduction; avoid the turn away/floor at the end of 008 |

Source filenames, exact trim positions, original/derived status and SHA256 hashes are in `verification/media-selection.json` and the CSV. Candidate and final-excerpt inspection boards are in `verification/media-screening/`. Photographic captions describe what is visible; they do not identify unnamed people or promise current experiences.

## Website changes

- Activity details and list cards open a photo/film gallery. Native dialog focus trapping, Escape, previous/next arrows, labelled thumbnails, native video controls and focus restoration are included. Selecting a film starts that silent excerpt; closing or changing media stops it.
- The review film is assembled in the browser from the final scheduled day/block order. Exact activity IDs select the two curated excerpts. Unscheduled choices, unrelated galleries, arrival/departure and activities without footage never enter the sequence. It rebuilds when the itinerary is reviewed again after editing. It is a continuous playback sequence, not a newly exported downloadable MP4.
- Muted autoplay is attempted with an explicit Play fallback, and is suppressed for reduced-motion/data-saving preferences. The player includes pause/replay, previous/next, chapter buttons and a timeline. Two video elements preload the next clip. Navigating away disposes playback. Changing the illustrative base saves it without restarting the film.
- The local Python server supports byte ranges, including HEAD, suffix ranges and unsatisfied ranges, for accurate browser seeking. Use this supplied preview server or a standard host supporting MP4 byte ranges.
- The course-card image container’s inherited aspect ratio was the cause of the exposed green right edge. Its width now exactly equals the card width.
- Six photographs fill an explicit fitted mosaic, with varied tile sizes, even gutters and every label anchored bottom left. The phone uses a complete two-column mosaic without the inherited 75% tile-width rule.
- A three-peak line mark replaces the character in the header/footer, favicon and map loader. The style continues the paper, forest and restrained brass/terracotta palette. The hero MP4 is byte-for-byte identical to v8.

## Verification

27 automated test groups pass, retaining the 108 planner combinations. New tests cover exact film inclusion, missing media, reordered scheduled days, exclusion of unscheduled choices, empty/duplicate IDs and every gallery asset reference. All 28 excerpts decode without errors and are H.264, 8-bit 4:2:0, with no source audio. Local HTTP tests passed bounded, suffix, open-ended and HEAD ranges, plus HTTP 416 for an invalid range.

Browser observations: autoplay and clip advancement; paused chapter selection; keyboard timeline seek settled at 29.9 seconds (the correct last clip at 4.9s in a 30s sequence); removal of Imori changed six film chapters to four and removed both Imori clips; empty itinerary shows an empty-film state with zero video elements; gallery film reached its five-second end; gallery Escape removed the video and restored trigger focus. Desktop course-card right gaps measured zero. Phone collage tiles all measured equal column width with no missing tile area; the page had no horizontal overflow. The phone film uses a compact 16:9 picture with its caption beneath. Final QA tab reported no console errors. Screenshots are in `verification/evidence/`.

These are local browser and logic checks, not physical-phone, full cross-browser, screen-reader or representative-audience testing. They do not establish provider availability, permissions for public distribution or a guaranteed course score. No publication, booking or outreach was performed.
