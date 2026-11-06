# Novalume multi-source factual coverage pipeline

This product is a **webnovel DISCOVERY database**, not a mirror of copyrighted books or a copy
of Novel Updates, Royal Road, AniList, Wuxiaworld, Qidian, Tapas, KakaoPage, or their databases.

## Rights and source hierarchy

| Source | Sustainable permitted use | Product treatment |
| --- | --- | --- |
| **Wikidata** | CC0 structured statements; follow etiquette, User-Agent, rate limits | Work/author ID, alternative names, language, country, genre; disambiguate original novel from animated/comic adaptations |
| **Open Library** | CC0 bibliographic metadata; use bulk monthly dumps for bulk integration, not its live API | Publication/edition/ISBN/translator identity where genuinely relevant; distinguish a *book edition* from a serialized original |
| **Official publisher/author** | Independently sourced public facts & source links; permissioned feeds only for automated intake | Official work identity, hosting/rights holder, edition links, creator-uploaded updates |
| **Novel Updates** | Manually researched individual factual references and outbound links only; do NOT scrape/mass harvest/copy compiled tags/reviews | Cross-check translators, original status, community-discovered aliases; retain individual attribution |
| **Royal Road / Scribble Hub** | Source-profile links and independently written descriptions; no prohibited bulk crawling | Primary self-published novel entry link; never lift chapters, cover art or user reviews |
| **AniList / MAL / Google Books** | Restricted for competing tracking or permanent bulk mirrors; do not bulk-ingest from their APIs | Human context only unless an explicit suitable licence is negotiated |
| **Author opt-in / community contributions** | Licensed submissions and member-generated signals with consent, moderation, revocation | Future freshness and niche metadata where no open knowledge base exists |

**Australian copyright rule:** Facts/information and titles are not themselves copyrighted, but
creative prose, imagery, translations, and sufficiently original compilations may be protected.
Separate EU database rights and provider terms can also matter. A link is not a licence to mirror.
We do not claim blanket legal clearance for every downstream use.

Sources:
- https://www.ag.gov.au/rights-and-protections/copyright/copyright-basics
- https://www.wikidata.org/wiki/Help:Data_access
- https://openlibrary.org/developers/api
- https://openlibrary.org/developers/dumps
- https://docs.anilist.co/guide/terms-of-use
- https://www.novelupdates.com/terms-of-service/
- https://digital-strategy.ec.europa.eu/en/policies/protection-databases

## Data model — one original work, many other identities

- **Original work**: stable Novalume ID, native name, author identity, first-publication information.
- **Aliases and translations**: each language/title is a variant; never confuse English translation progress with original-country completion.
- **External editions**: source platform, exact series URL, official/publisher/author flags, licence evidence.
- **Serial releases**: original story status, translation status, site-specific available chapter range, last checked date, source-snapshot timestamp.
- **Genres/tropes**: precise claims with per-source attribution, review status and a spoiler-scope or confidence. Don't equate a tag with an actual verified plot event.
- **Reader data**: private list + progress; public reviews/tags only from authenticated users with moderation and consent.
- **Other**: adaptations, related series, shared universes, source record history and redirects are separate entity edges, not merged novels.

Do not publish unreviewed values under a confident-looking label. Multiple sources can still
repeat the same inaccurate claim; confidence needs independent provenance.

## Already implemented

1. `content/series_registry.json`: 43 real curated webnovel profiles. The oldest 17 are kept in the
   directory; unaudited statuses are now labelled Unknown pending independent source checks.
2. `content/series_evidence.json`: date-stamped separate claims from primary and corroborating
   publishers, reader directories and two correctly disambiguated Wikidata records.
3. `scripts/fuse_series_metadata.py`: source/URL allowlist and licence-policy validation;
   field-level provenance, provider independence, conflicting claims exposed and completion status
   set to Unknown on disagreement. Builds the public dataset for `dist/data/series_registry.json`.
4. `scripts/propose_wikidata.py`: accepts a local Wikidata SPARQL JSON export. It rejects
   adaptation types and ambiguous identities, and outputs a **quarantined review queue**, not
   automatic public publication. No live network requests are made. Example:

   ```sh
   python3 scripts/propose_wikidata.py /path/to/query-results.json > candidate-review.json
   ```

5. Author-composed one-sentence summaries. Text, rating tables, review bodies, copyright artwork,
   scraped full tag lists, and fan translations are NOT stored or served.

## Next scale gate

- Build and test explicit Open Library bulk-dump and publisher opt-in import adapters.
- Review 100+ entries across Asian and English serial fiction; audit QID/ISBN/alias and
  duplicate detection, source deprecation and source identity.
- Add type-safe, dimension-specific fields and source time stamps. Validate stale/conflicted
  metadata and maintain a human moderation/review queue.
- Publish a rights/metadata correction form and a takedown process before community scale.

Use `npm test && npm run build`. Do not claim live link checks or mobile user journeys are
verified merely because CI and Vercel return success.
