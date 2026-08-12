#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Server-side script: Checks ETags of R2 product images to detect OYP placeholders.
Upload to /tmp/oyp_head.py on server and run: python3 /tmp/oyp_head.py
"""
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

# URLs will be injected here at runtime
URLS_FILE = '/tmp/oyp_urls.txt'

with open(URLS_FILE) as f:
    urls = [l.strip() for l in f if l.strip().startswith('https://')]

sys.stderr.write(f'Checking {len(urls)} URLs...\n')
sys.stderr.flush()

def head(url):
    try:
        r = subprocess.run(
            ['curl', '-sI', '--max-time', '8', url],
            capture_output=True, text=True, timeout=10
        )
        etag = ''
        size = ''
        for line in r.stdout.splitlines():
            ll = line.lower()
            if ll.startswith('etag:'):
                etag = line.split(':', 1)[1].strip().strip('"')
            elif ll.startswith('content-length:'):
                size = line.split(':', 1)[1].strip()
        return etag, size
    except Exception as e:
        sys.stderr.write(f'Error: {url}: {e}\n')
        return '', ''

done = 0
with ThreadPoolExecutor(max_workers=25) as ex:
    futs = {ex.submit(head, u): u for u in urls}
    for f in as_completed(futs):
        e, s = f.result()
        done += 1
        if done % 50 == 0:
            sys.stderr.write(f'  {done}/{len(urls)}\n')
            sys.stderr.flush()
        if e or s:
            print(f'{e}|{s}')
            sys.stdout.flush()
