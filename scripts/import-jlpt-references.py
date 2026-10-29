"""Opt-in, build-time reference capture. Never used by the static app.

Keeps raw third-party pages in the OS temp directory; exports only factual
Japanese headwords/readings, source locations and hashes (no lesson prose).
Run with the bundled Python (pdfplumber required).
"""
import hashlib
import json
import re
import tempfile
import urllib.request
import sys
from html.parser import HTMLParser
from pathlib import Path

CACHE = Path(tempfile.gettempdir()) / 'language-journey-jlpt-reference-20261029'
CACHE.mkdir(exist_ok=True)

def fetch(url):
    print('Read ' + url, flush=True)
    file = CACHE / hashlib.sha256(url.encode()).hexdigest()
    if not file.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'LanguageJourney curriculum reference audit'})
        file.write_bytes(urllib.request.urlopen(request, timeout=45).read())
    return file.read_bytes()

class Tables(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.rows, self.row, self.cell, self.inside = [], [], '', False
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        if tag in ('tr', 'td', 'th', 'tbody', 'thead', 'table') and self.inside:
            self.row.append(' '.join(self.cell.split())); self.inside = False
        if tag in ('tr', 'tbody', 'thead', 'table') and self.row:
            self.rows.append(self.row); self.row = []
        if tag in ('td', 'th'): self.cell, self.inside = '', True
        if tag in ('br', 'rt') and self.inside: self.cell += ' '
    def handle_data(self, text):
        if self.inside: self.cell += text
    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.inside:
            self.row.append(' '.join(self.cell.split())); self.inside = False
        if tag in ('tr', 'tbody', 'thead', 'table'):
            if self.inside: self.row.append(' '.join(self.cell.split())); self.inside = False
            if self.row: self.rows.append(self.row); self.row = []

def capture(url):
    data = fetch(url)
    rows = Tables(data.decode('utf-8')).rows
    return {'url': url, 'sha256': hashlib.sha256(data).hexdigest(), 'rows': rows,
            'status': 'table-extracted' if rows else 'no-table-verify-source-format'}

def family(url):
    html = fetch(url).decode('utf-8')
    pages = sorted(set([url] + re.findall(re.escape(url) + r'page/\d+/', html)))
    return [capture(page) for page in pages]

def main():
    # Page links are discovered from the first authoritative list, not guessed.
    first = 'https://jlptsensei.com/jlpt-n5-vocabulary-list/'
    html = fetch(first).decode('utf-8')
    pages = sorted(set([first] + re.findall(r'https://jlptsensei.com/jlpt-n5-vocabulary-list/page/\d+/', html)))
    result = {'capturedAt': '2026-10-29', 'senseiVocabulary': [capture(url) for url in pages]}
    for key, url in {
        'senseiGrammar': 'https://jlptsensei.com/jlpt-n5-grammar-list/',
        'senseiKanji': 'https://jlptsensei.com/jlpt-n5-kanji-list/',
        'jtestVocabulary': 'https://japanesetest4you.com/jlpt-n5-vocabulary-list/',
        'jtestGrammar': 'https://japanesetest4you.com/jlpt-n5-grammar-list/',
        'mlcOverview': 'https://www.mlcjapanese.co.jp/n5.html',
        'mlcVocabulary': 'https://www.mlcjapanese.co.jp/n5_04_01.html',
    }.items():
        try:
            if '--skip-unreachable-mlc' in sys.argv and key.startswith('mlc'):
                raise RuntimeError('MLC host timed out on 2026-10-29; indexed overview compared separately')
            result[key] = capture(url)
        except Exception as error:
            result[key] = {'url': url, 'unavailable': str(error)}
    result['senseiGrammarPages'] = family(result['senseiGrammar']['url'])
    result['senseiKanjiPages'] = family(result['senseiKanji']['url'])
    # JTest headwords occur in paragraphs rather than a table.
    text = fetch(result['jtestVocabulary']['url']).decode('utf-8')
    result['jtestVocabulary']['headwords'] = re.findall(r'([\u3040-\u30ff\u3400-\u9fffー/]+)\s*\(([a-zA-Z /]+)\)\s*:', re.sub(r'<[^>]+>', '', text))
    grammar = fetch(result['jtestGrammar']['url']).decode('utf-8')
    result['jtestGrammar']['links'] = re.findall(r'<a[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>([\s\S]*?)</a>', grammar)
    result['jtestGrammar']['links'] = [[url, re.sub('<[^>]+>', '', label)] for url, label in result['jtestGrammar']['links'] if 'learn-japanese-grammar' in url]
    if result['mlcVocabulary'].get('unavailable'):
        target = CACHE / 'parsed.json'
        target.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
        print(json.dumps({'path': str(target), 'senseiPages': len(pages), 'limitation': 'MLC unavailable; do not classify two-source overlap as three-source core.'}))
        return
    html = fetch(result['mlcVocabulary']['url']).decode('utf-8')
    links = re.findall(r'href=[\"\']([^\"\']+\.pdf)[\"\']', html)
    result['mlcVocabulary']['pdfLinks'] = links
    from urllib.parse import urljoin
    pdf_url = urljoin(result['mlcVocabulary']['url'], next(link for link in links if 'Vocabulary' in link or 'vocabulary' in link))
    pdf = fetch(pdf_url)
    import io, pdfplumber
    with pdfplumber.open(io.BytesIO(pdf)) as document:
        result['mlcVocabulary']['pdf'] = {'url': pdf_url, 'sha256': hashlib.sha256(pdf).hexdigest(), 'pages': [page.extract_text() for page in document.pages]}
        document.pages[0].to_image(resolution=100).save(CACHE / 'mlc-page1.png')
    target = CACHE / 'parsed.json'
    target.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'path': str(target), 'senseiPages': len(pages), 'mlcPDF': pdf_url, 'preview': str(CACHE / 'mlc-page1.png')}, ensure_ascii=False))

if __name__ == '__main__': main()
