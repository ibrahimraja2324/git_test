#!/usr/bin/env python3
"""Generate the public catalogue exclusively from reviewed and actually hosted editions.

The legal intake queue remains in content/rights_manifest.json, NOT the reader UI.
All chapter counts, titles and reading lengths come from the stored source text.
"""
from pathlib import Path
import json
import math

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'content' / 'rights_manifest.json'
BOOK_DIR = ROOT / 'public' / 'data' / 'books'
OUT = ROOT / 'public' / 'data' / 'catalog.json'


def build():
    manifest = json.loads(SOURCE.read_text(encoding='utf-8'))
    catalog = []
    seen = set()
    for item in manifest:
        book_id = item['id']
        if book_id in seen:
            raise ValueError('Duplicate catalogue ID: ' + book_id)
        seen.add(book_id)
        path = BOOK_DIR / f'{book_id}.json'
        if item['rights']['decision'] != 'approved' or not path.is_file():
            continue  # A reviewed candidate is not a publicly listed/readable book.
        payload = json.loads(path.read_text(encoding='utf-8'))
        if payload.get('id') != book_id:
            raise ValueError('Book payload does not match rights record: ' + book_id)
        chapters = payload.get('chapters')
        if not isinstance(chapters, list) or not chapters:
            raise ValueError('Reviewed edition has no chapters: ' + book_id)
        if any(not isinstance(ch.get('paragraphs'), list) or not ch['paragraphs'] for ch in chapters):
            raise ValueError('Missing chapter text: ' + book_id)
        titles = [str(ch.get('title') or f'Section {i}') for i, ch in enumerate(chapters, 1)]
        chapter_words = [
            sum(len(str(paragraph).split()) for paragraph in ch['paragraphs'])
            for ch in chapters
        ]
        total_words = sum(chapter_words)
        if not total_words:
            raise ValueError('Empty published edition: ' + book_id)
        rights = item['rights']
        catalog.append({
            'id': book_id, 'title': item['title'], 'author': item['author'],
            'genre': item['genre'], 'blurb': item['blurb'],
            'colors': item['colors'], 'mark': item['mark'],
            'sourceUrl': item['sourceUrl'], 'status': 'ready',
            'publicationYear': item['firstPublicationYear'],
            'language': item['originalLanguage'],
            'chapterCount': len(chapters), 'chapterTitles': titles,
            'chapterWordCounts': chapter_words, 'wordCount': total_words,
            'readingMinutes': math.ceil(total_words / 230),
            'hostedScope': rights.get('hostedScope', 'reviewed-edition'),
            'license': {
                'type': 'REVIEWED-PUBLIC-DOMAIN',
                'edition': rights.get('edition') or 'Original-language edition',
                'jurisdictions': rights.get('jurisdictions', []),
                'note': rights.get('notes', '')
            }
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Published {len(catalog)} readable editions with {sum(b["chapterCount"] for b in catalog)} actual sections.')


if __name__ == '__main__':
    build()
