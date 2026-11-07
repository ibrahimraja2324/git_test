"""Validate public Novalume series directory data and external-link safety."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'content' / 'series_registry.json'
ALLOWED = {'www.novelupdates.com', 'www.royalroad.com', 'www.wuxiaworld.com', 'fanqienovel.com', 'www.tadu.com'}
ALLOWED_STATUS = {'Completed', 'Ongoing', 'Discontinued', 'Unknown'}


def validate_registry(data):
    assert data['schema'] == 'novalume.external-series.v1'
    ids, urls = set(), set()
    assert len(data['series']) >= 40
    for item in data['series']:
        assert item['id'].replace('-', '').isalnum() and item['id'] not in ids
        ids.add(item['id'])
        url = urlparse(item['sourceUrl'])
        assert url.scheme == 'https' and url.hostname in ALLOWED and not url.username and not url.password
        assert item['sourceUrl'] not in urls
        urls.add(item['sourceUrl'])
        assert item['kind'] == 'external-index' and item['workStatus'] in ALLOWED_STATUS
        art = item.get('coverArt')
        if art is not None:
            assert art.get('provider') == 'openlibrary' and art.get('mode') == 'remote-display'
            assert __import__('re').fullmatch(r'20[0-9]{2}-[0-9]{2}-[0-9]{2}', art.get('sourceCheckedAt',''))
            if 'coverId' in art:
                assert isinstance(art['coverId'],int) and 0<art['coverId']<100000000000
                assert __import__('re').fullmatch(r'OL[0-9]{1,12}W',art.get('workId',''))
                assert art.get('workUrl')=='https://openlibrary.org/works/'+art['workId']
            else:
                assert __import__('re').fullmatch(r'OL[0-9]{1,12}M', art.get('editionId',''))
                assert art.get('editionUrl','').startswith('https://openlibrary.org/books/'+art['editionId']+'/')
            assert not art.get('localFile')
        assert item.get('sourcePolicy') in ('legacy-human-curated-source-link','manual-facts-and-editorial-summary')
        assert item['originalLanguage'] in ('Chinese', 'Korean', 'English')
        for key in ('title', 'author', 'summary', 'verifiedAt', 'sourcePlatform'):
            assert isinstance(item[key], str) and item[key].strip()
        assert isinstance(item['genres'], list) and item['genres'] and len(item['genres']) <= 8
        assert len(item['summary']) < 300
        assert not any(k in item for k in ('chapters', 'chapterText', 'ratings', 'reads', 'followers', 'views', 'content', 'html'))
    return True


class SeriesRegistryTests(unittest.TestCase):
    def test_cited_external_metadata_not_fabricated_readers(self):
        self.assertTrue(validate_registry(json.loads(REGISTRY.read_text(encoding='utf-8'))))

    def test_rejects_content_and_unsupported_external_host(self):
        data = json.loads(REGISTRY.read_text(encoding='utf-8'))
        data['series'][0]['sourceUrl'] = 'https://example.org/fiction'
        with self.assertRaises(AssertionError):
            validate_registry(data)
        data['series'][0]['sourceUrl'] = 'https://www.novelupdates.com/series/lord-of-the-mysteries/'
        data['series'][0]['content'] = 'not licensed'
        with self.assertRaises(AssertionError):
            validate_registry(data)


if __name__ == '__main__':
    unittest.main()
