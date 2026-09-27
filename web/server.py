#!/usr/bin/env python3
"""Local server for Work Handoff: serves web/ and POST /api/draft.

/api/draft sends the prompt built in the browser to the already signed-in local Claude CLI
(`claude -p`) and returns Claude's raw reply. The browser validates the reply with
validateDraft; nothing here marks anything as reviewed or confirmed.
Standard library only. Binds 127.0.0.1. Request bodies and Claude output are never logged.
"""
import argparse
import json
import os
import subprocess
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

WEB_DIR = os.path.dirname(os.path.abspath(__file__))
MAX_BODY_BYTES = 256 * 1024       # UTF-8 of a prompt with <=20,000 source characters fits easily
MAX_PROMPT_CHARS = 40000          # template + titles + 20,000 characters of records
MAX_OUTPUT_BYTES = 1024 * 1024    # CLI JSON envelope
MAX_DRAFT_CHARS = 200000          # same as MAX_DRAFT_LENGTH in handoff.js
# WORK_HANDOFF_CLAUDE_BIN / WORK_HANDOFF_CLAUDE_TIMEOUT (seconds) override the CLI path and timeout,
# e.g. for a fake CLI in tests.
CLAUDE_BIN = os.environ.get('WORK_HANDOFF_CLAUDE_BIN') or 'claude'
TIMEOUT_SECONDS = float(os.environ.get('WORK_HANDOFF_CLAUDE_TIMEOUT') or 180)
SYSTEM_PROMPT = (
    'You turn AI-agent work records into a JSON handoff draft. '
    'Follow the user message exactly and output only the JSON object.'
)
CLAUDE_ARGS = [
    '-p', '--output-format', 'json',
    '--tools', '',                                   # no built-in tools
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',  # no MCP servers
    '--setting-sources', '',                         # no user/project settings or hooks
    '--disable-slash-commands',
    '--no-session-persistence',
    '--system-prompt', SYSTEM_PROMPT,
]
# Keep the CLI on its own sign-in: drop API keys and alternate API/billing routes from its environment.
STRIPPED_ENV = frozenset((
    'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL',
    'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY',
    'ANTHROPIC_BEDROCK_BASE_URL', 'AWS_BEARER_TOKEN_BEDROCK',
    'ANTHROPIC_VERTEX_PROJECT_ID', 'ANTHROPIC_VERTEX_BASE_URL',
    'ANTHROPIC_FOUNDRY_API_KEY', 'ANTHROPIC_FOUNDRY_BASE_URL', 'ANTHROPIC_FOUNDRY_RESOURCE',
))

draft_lock = threading.Lock()


class DraftError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def classify_cli_failure(text, returncode):
    lowered = text.lower()
    if any(k in lowered for k in ('not logged in', '/login', 'authenticat', 'invalid api key', 'oauth', '401')):
        return DraftError(502, 'Claude CLI 로그인이 필요합니다. 터미널에서 claude를 실행해 /login으로 로그인한 뒤 다시 누르세요. 그동안은 아래 수동 방식을 쓸 수 있습니다.')
    if any(k in lowered for k in ('usage limit', 'rate limit', 'limit reached', 'quota', '429')):
        return DraftError(429, 'Claude 사용 한도에 도달했습니다. 한도가 풀린 뒤 다시 시도하거나 아래 수동 방식을 쓰세요. (이 앱은 요금제나 결제를 바꾸지 않습니다.)')
    if 'overloaded' in lowered or '529' in lowered:
        return DraftError(503, 'Claude 서버가 혼잡합니다. 잠시 뒤 다시 시도하세요.')
    return DraftError(502, f'Claude CLI가 오류로 끝났습니다(종료 코드 {returncode}). 터미널에서 claude가 정상 동작하는지 확인하거나 아래 수동 방식을 쓰세요.')


def run_claude(prompt):
    try:
        stdin = prompt.encode('utf-8')
    except UnicodeEncodeError:
        raise DraftError(400, '기록에 UTF-8로 보낼 수 없는 문자가 있습니다. 깨진 글자를 지우고 다시 시도하세요.')
    env = {k: v for k, v in os.environ.items() if k not in STRIPPED_ENV}
    # An empty working directory keeps project files and CLAUDE.md out of the session.
    with tempfile.TemporaryDirectory(prefix='work-handoff-') as cwd:
        try:
            proc = subprocess.run(
                [CLAUDE_BIN, *CLAUDE_ARGS], input=stdin, capture_output=True,
                cwd=cwd, env=env, timeout=TIMEOUT_SECONDS, shell=False, check=False,
            )
        except FileNotFoundError:
            raise DraftError(503, 'Claude CLI(claude 명령)를 찾지 못했습니다. Claude Code를 설치하고 로그인한 터미널에서 서버를 실행하거나 아래 수동 방식을 쓰세요.')
        except subprocess.TimeoutExpired:
            raise DraftError(504, f'Claude가 {TIMEOUT_SECONDS:g}초 안에 답하지 않아 중단했습니다. 기록을 줄여 다시 시도하거나 아래 수동 방식을 쓰세요.')
        except OSError as err:
            raise DraftError(503, f'Claude CLI를 실행하지 못했습니다(OS 오류 {err.errno}). 설치와 실행 권한을 확인하거나 아래 수동 방식을 쓰세요.')
    if len(proc.stdout) > MAX_OUTPUT_BYTES:
        raise DraftError(502, 'Claude 출력이 너무 길어 받지 않았습니다. 아래 수동 방식을 쓰세요.')
    stdout = proc.stdout.decode('utf-8', 'replace')
    try:
        envelope = json.loads(stdout)
    except ValueError:
        envelope = None
    if not isinstance(envelope, dict):
        if proc.returncode != 0:
            raise classify_cli_failure(stdout + proc.stderr.decode('utf-8', 'replace'), proc.returncode)
        raise DraftError(502, 'Claude CLI 출력 형식을 읽지 못했습니다. CLI 버전을 확인하거나 아래 수동 방식을 쓰세요.')
    result = envelope.get('result')
    if envelope.get('is_error') or proc.returncode != 0:
        detail = f"{result or ''} {envelope.get('api_error_status') or ''} {proc.stderr.decode('utf-8', 'replace')}"
        raise classify_cli_failure(detail, proc.returncode)
    if not isinstance(result, str) or result.strip() == '':
        raise DraftError(502, 'Claude가 빈 답변을 돌려주었습니다. 다시 시도하거나 아래 수동 방식을 쓰세요.')
    if len(result) > MAX_DRAFT_CHARS:
        raise DraftError(502, f'Claude 답변이 {len(result)}자로 한도 {MAX_DRAFT_CHARS}자를 넘어 받지 않았습니다.')
    return result


class Handler(SimpleHTTPRequestHandler):
    server_version = 'WorkHandoff'
    sys_version = ''

    def allowed_hosts(self):
        port = self.server.server_address[1]
        return {f'127.0.0.1:{port}', f'localhost:{port}'}

    def host_ok(self):
        # Rejects DNS-rebinding requests that reach 127.0.0.1 under another host name.
        return self.headers.get('Host', '') in self.allowed_hosts()

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.host_ok():
            self.send_error(421, 'Misdirected Request')
            return
        super().do_GET()

    def do_HEAD(self):
        if not self.host_ok():
            self.send_error(421, 'Misdirected Request')
            return
        super().do_HEAD()

    def do_POST(self):
        if self.path != '/api/draft':
            self.send_json(404, {'error': '없는 경로입니다.'})
            return
        origin = self.headers.get('Origin', '')
        if not self.host_ok() or origin not in {f'http://{h}' for h in self.allowed_hosts()}:
            self.send_json(403, {'error': '이 페이지에서 보낸 요청만 받습니다.'})
            return
        content_type = self.headers.get('Content-Type', '').split(';')[0].strip().lower()
        if content_type != 'application/json':
            self.send_json(415, {'error': '요청 형식은 application/json이어야 합니다.'})
            return
        try:
            length = int(self.headers.get('Content-Length', ''))
        except ValueError:
            self.send_json(411, {'error': '요청 길이가 없습니다.'})
            return
        if length < 0 or length > MAX_BODY_BYTES:
            self.send_json(413, {'error': '요청이 너무 큽니다. 작업 기록 합계는 20,000자 이하여야 합니다.'})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
        except (UnicodeDecodeError, ValueError):
            self.send_json(400, {'error': '요청 본문이 올바른 JSON이 아닙니다.'})
            return
        prompt = payload.get('prompt') if isinstance(payload, dict) else None
        if not isinstance(prompt, str) or prompt.strip() == '':
            self.send_json(400, {'error': '보낼 프롬프트가 없습니다.'})
            return
        if len(prompt) > MAX_PROMPT_CHARS:
            self.send_json(413, {'error': f'프롬프트가 {len(prompt)}자로 한도 {MAX_PROMPT_CHARS}자를 넘습니다. 기록이나 제목을 줄이세요.'})
            return
        if not draft_lock.acquire(blocking=False):
            self.send_json(409, {'error': '이미 초안을 만드는 중입니다. 끝난 뒤 다시 누르세요.'})
            return
        try:
            self.send_json(200, {'draft': run_claude(prompt)})
        except DraftError as err:
            self.send_json(err.status, {'error': err.message})
        except Exception as err:  # never drop the connection or log the prompt
            self.log_error('draft failed: %s', type(err).__name__)
            self.send_json(500, {'error': '초안을 만드는 중 서버 오류가 났습니다. 아래 수동 방식을 쓰세요.'})
        finally:
            draft_lock.release()


def main():
    parser = argparse.ArgumentParser(description='Serve Work Handoff on 127.0.0.1.')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=WEB_DIR))
    print(f'Work Handoff: http://127.0.0.1:{server.server_address[1]}/  (Ctrl+C to stop)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
