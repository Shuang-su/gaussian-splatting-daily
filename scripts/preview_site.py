#!/usr/bin/env python3
"""Serve the exported portal locally at its GitHub Pages project path."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

BASE = '/gaussian-splatting-daily'
ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == BASE or path.startswith(BASE + '/'):
            path = path[len(BASE):] or '/'
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path == '/':
            self.send_response(302)
            self.send_header('Location', BASE + '/')
            self.end_headers()
            return
        super().do_GET()

    def log_message(self, format, *args):
        if len(args) > 1 and str(args[1]) not in ('200', '304'):
            super().log_message(format, *args)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4337)
    args = parser.parse_args()
    output = ROOT / 'site/out'
    if not (output / 'index.html').is_file():
        parser.error('Build the portal first: npm run build --prefix site')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(output)))
    print(f'Serving {output} at http://127.0.0.1:{args.port}{BASE}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
