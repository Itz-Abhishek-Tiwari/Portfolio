"""Shared test setup: the local server URL and a real studio session (credentials from .env.local)."""
import json,os,pathlib,urllib.request
env=pathlib.Path('.env.local')
if env.exists():
    for line in env.read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value=line.split('=',1);os.environ.setdefault(key.strip(),value.strip().strip('"\''))
BASE=os.environ.get('PORTFOLIO_TEST_URL','http://localhost:3000')
assert BASE.startswith(('http://localhost:','http://127.0.0.1:')),'Run the tests against a local dev server, never production.'
def _sign_in():
    body=json.dumps({'email':os.environ['PORTFOLIO_ADMIN_EMAIL'],'password':os.environ['PORTFOLIO_ADMIN_PASSWORD']}).encode()
    request=urllib.request.Request(BASE+'/api/auth/login',data=body,method='POST',headers={'Origin':BASE,'Content-Type':'application/json'})
    with urllib.request.urlopen(request) as r:return r.headers['Set-Cookie'].split(';')[0]
COOKIE=_sign_in()
