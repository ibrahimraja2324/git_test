# Rights and catalogue policy

**Public-domain in one country does not necessarily mean public-domain worldwide.**

- Source libraries such as Standard Ebooks dedicate **their own** editorial contributions to the public domain, but do not clear rights outside the United States. See https://standardebooks.org/about/standard-ebooks-and-the-public-domain
- Australian literary works generally use life + 70 years with special historical rules. See https://www.ag.gov.au/rights-and-protections/copyright/copyright-basics and https://www.library.gov.au/services/copyright-library-collections/how-long-does-copyright-last
- Translators, illustrators, modern introductions, cover designers and editors may have separate rights; translated texts are not automatically cleared because the original writer is old.
- Open access, freely readable or fan-translated content is **not** a licence to republish. Do not scrape/pirate Webnovel, Royal Road, Novel Updates or unofficial translation sites.
- There must be rights to **redistribute** the text, not only personal use or links.

## Permission gate

Only `content/rights_manifest.json` records with `rights.decision=approved`, nonempty `reviewer`, `reviewedAt`, source, publication and author history, and translation clearance where relevant, can enter `scripts/ingest_standardebooks.py`. `scripts/build_catalog.py` only publishes a book as `ready` if a hosted chapter asset exists too. Pre-clearance catalogue entries remain *external links*.

## Initial edition

Jane Austen's original **Pride and Prejudice** (1813), English original, author died 1817. One source-text first chapter is included for reader testing. No modern translation, introduction or cover image is reproduced. Editorial additions from the Standard Ebooks edition are dedicated CC0; public-domain status for the original is not in dispute under the reviewed AU/US basis. Broader international distribution should still get jurisdiction-specific legal review before commercial scale.

## Next legal review

Review each candidate's exact Standard Ebooks source GitHub repo, edition, author (and translator if any), rights in AU and intended markets, and inspect for reused protected illustrations/modern commentary. Record source URL, reviewed-by, reviewed-at, and disposition. Perform *manual* import only after review; verify imported chapter count and text quality. No automatic approval solely on a death-year heuristic.

## Takedowns

At production launch, publish a real rights complaint address and handling procedure; log requests; freeze questioned work; remove access promptly if evidence warrants; allow an appeal with audit trail. Do not claim live takedown support before the service is operational.
