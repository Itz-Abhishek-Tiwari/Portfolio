"""Integration checks against the local Vinext development server."""
import json, urllib.request, urllib.error, pathlib
BASE='http://localhost:3000'
def request(path, method='GET', body=None, auth=False, origin=None, content_type='application/json'):
    headers={}
    if auth: headers['Cookie']='__sites_local_auth=1'
    if origin: headers['Origin']=origin
    if body is not None: headers['Content-Type']=content_type
    req=urllib.request.Request(BASE+path,data=body,headers=headers,method=method)
    try:
        with urllib.request.urlopen(req) as r: return r.status,r.headers,r.read()
    except urllib.error.HTTPError as e: return e.code,e.headers,e.read()
assert request('/')[0]==200
assert request('/api/admin/content')[0]==403
assert request('/admin/preview')[0]==200  # redirects anonymous visitors to sign-in
code,_,raw=request('/api/admin/content',auth=True)
assert code==200
saved=json.loads(raw)
body=json.dumps({'content':saved['content'],'revision':saved['revision'],'publish':False}).encode()
assert request('/api/admin/content','PUT',body,True,'https://example.com')[0]==403
stale=json.dumps({'content':saved['content'],'revision':9999,'publish':False}).encode()
assert request('/api/admin/content','PUT',stale,True,BASE)[0]==409
invalid=dict(saved['content']);invalid['github']='javascript:alert(1)'
assert request('/api/admin/content','PUT',json.dumps({'content':invalid,'revision':saved['revision'],'publish':False}).encode(),True,BASE)[0]==400
for filename, mime in [('abhishek.jpg','image/jpeg'),('abhishek-tiwari-cv.pdf','application/pdf')]:
    boundary='PortfolioSmokeBoundary'
    data=(pathlib.Path('public/assets')/filename).read_bytes()
    payload=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+data+f'\r\n--{boundary}--\r\n'.encode())
    code,_,raw=request('/api/admin/upload','POST',payload,True,BASE,'multipart/form-data; boundary='+boundary)
    assert code==200,(code,raw)
    media=json.loads(raw)['url'];code,headers,raw=request(media)
    assert code==200 and raw==data and headers['Content-Type']==mime
    assert headers['X-Content-Type-Options']=='nosniff'
assert json.loads(request('/api/content')[2])['content']['availability']=='Let’s build something thoughtful'
print('PASS: public content, authorization, CSRF, stale revision, URL validation, image/PDF upload and exact download.')
