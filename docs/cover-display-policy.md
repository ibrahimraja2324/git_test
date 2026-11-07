# Novalume original cover display, 8 November 2026

The Australian Copyright Act protects artwork, and a public book-cover image
does not automatically grant a right to copy it. IMDb confirms its images
are often licensed only to IMDb: https://help.imdb.com/article/imdb/general-information/can-i-use-a-photo-or-video-from-your-site-for-my-web-site-or-publication/G7V6PHXKDLLK7AS6

Open Library expressly documents third-party display through its remote
covers API: https://openlibrary.org/dev/docs/api/covers

Novalume only embeds exact previously reviewed Open Library edition IDs.
It does not download or store that image. If unavailable, the CSS cover
returns. Source attribution appears on the series detail view. The pilot
uses OL31573848M (Mother of Learning) and OL32614650M
(He Who Fights with Monsters). Their bibliographic identities are independently
matched, but live browser image loading and underlying artwork permissions
require monitoring. This is NOT a general right to scrape Royal Road,
Webnovel, Qidian or publisher cover art. Authors can request correction/removal.

## 8 Nov follow-up: cover cards on real Discover home
The primary Discover view previously called only its CSS `cover()` function,
despite a prior directory-specific real-image implementation. Shared remote
Open Library cover rendering now reaches the homepage hero, collection rails,
results, and #taste view. Six exact source-matched edition records are now
stored (including Azarinth Healer, Primal Hunter book one, Beginning After the
End book one, Defiance of the Fall book one). Author/title/edition names were
cross-checked against public Open Library edition pages. An edition cover
is not necessarily the original serial's exact native platform cover.
S/M thumbnails are requested directly from `covers.openlibrary.org` by
the visitor browser; no images hosted by Novalume, no automatic crawler,
and no copyrighted cover file committed to the Git repo.
The `?default=false` URL permits the onerror CSS fallback if unavailable.
Do NOT imply all six actual image requests or underlying rights were verified
in a live browser; follow up with visual QA and takedown responsiveness.

## Homepage-first art selection
Because the original hero originally used four series with only one matched Open Library cover, the Discover hero now prioritises four titles with matched book edition records. This ensures the new remote-image functionality is actually exercised on first load (subject to real image availability). An additional matched All the Skills edition (OL52618166M) brings the small pilot to seven records. The series page now offers a direct 'Did it deliver?' navigation tab into voluntary private reader feedback. Live browser rendering and actual image endpoint responses remain a separate QA gate.
