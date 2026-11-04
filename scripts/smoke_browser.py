"""Browser smoke with fully inlined local sources, no external or localhost network."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'dist/index.html').read_text()
html=re.sub(r'<link\b[^>]*>', '',html)
html=re.sub(r'<script\b[^>]*></script>','',html)
html=html.replace('</head>','<style>'+ (ROOT/'src/styles.css').read_text()+'</style></head>')
js=''
for name in ['engine.js','knowledge.js','app.js']:
    raw=(ROOT/'src'/name).read_text()
    raw=re.sub(r'^import .*?;\s*$', '',raw,flags=re.M)
    raw=re.sub(r'\bexport (?=(?:const|function|async))','',raw)
    js+='\n'+raw
catalog=json.loads((ROOT/'public/data/catalog.json').read_text())
index=json.loads((ROOT/'public/data/story_index.json').read_text())
book=json.loads((ROOT/'public/data/books/pride-and-prejudice.json').read_text())
js='''window.fetch = async function(url){const key=String(url);const data=key.includes('catalog.json')?'''+json.dumps(catalog)+''':key.includes('story_index.json')?'''+json.dumps(index)+''':key.includes('books/pride-and-prejudice')?'''+json.dumps(book)+''':null;return {ok:!!data,json:async()=>data}};\n'''+js
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-web-security'])
    for width in [390,1280]:
        page=b.new_page(viewport={'width':width,'height':844})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.add_script_tag(content=js)
        page.wait_for_timeout(100)
        assert page.locator('#searchInput').count()==1,errors
        assert page.locator('.book-card').count()>0
        if width==390:
            assert page.locator('.mobile-dock a').count()==4
            page.screenshot(path='/mnt/data/novalume_current_mobile.png',full_page=False)
        else:page.screenshot(path='/mnt/data/novalume_current_desktop.png',full_page=False)
        page.locator('a[href="#assistant"]').first.click() if width==1280 else page.locator('a[href="#assistant"]').last.click()
        page.wait_for_timeout(100)
        assert page.locator('#aiQuestion').count()==1,errors
        page.locator('a[href="#home"]').first.click()
        page.wait_for_timeout(100)
        page.locator('.book-card').first.click()
        assert '#book/pride-and-prejudice' in page.url,page.url
        assert not errors,errors
        print('PASS',width,'page render, books, assistant, nav, no JS errors')
        page.close()
    b.close()
