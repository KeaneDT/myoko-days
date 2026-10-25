"""Serve this prototype locally. No external service or dependency installation."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=8770)
args = parser.parse_args()

class PreviewHandler(SimpleHTTPRequestHandler):
    # Browsers need byte ranges for reliable MP4 seeking, including preloaded clips.
    def send_head(self):
        self._media_length = None
        path = Path(self.translate_path(self.path))
        if path.suffix.lower() != '.mp4' or not path.is_file():
            return super().send_head()
        source = path.open('rb')
        size = path.stat().st_size
        start, end = 0, size - 1
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested.strip())
            if not match or not any(match.groups()):
                source.close()
                self.send_error(416, 'Unsupported byte range')
                return None
            left, right = match.groups()
            if left:
                start = int(left)
                end = min(int(right), end) if right else end
            else:
                start = max(0, size - int(right))
            if start > end or start >= size:
                source.close()
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        source.seek(start)
        self._media_length = end - start + 1
        return source

    def copyfile(self, source, outputfile):
        if self._media_length is None:
            return super().copyfile(source, outputfile)
        remaining = self._media_length
        try:
            while remaining:
                block = source.read(min(65536, remaining))
                if not block:
                    break
                outputfile.write(block)
                remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Navigation or a new seek may cancel an in-flight clip request.

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

with ThreadingHTTPServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=str(Path(__file__).resolve().parent))) as server:
    print(f'Local preview: http://127.0.0.1:{args.port}/#home', flush=True)
    print('Press Ctrl+C to stop. Nothing is published.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

