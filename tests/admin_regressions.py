"""Checks admin state transitions against a local development preview only."""
import copy,json,os,urllib.request,urllib.error,concurrent.futures
from local_env import BASE,COOKIE
def call(path,method='GET',body=None):
    headers={'Cookie':COOKIE,'Origin':BASE}
    if body is not None:headers['Content-Type']='application/json';body=json.dumps(body).encode()
    req=urllib.request.Request(BASE+path,data=body,headers=headers,method=method)
    try:
        with urllib.request.urlopen(req) as r:return r.status,r.read()
    except urllib.error.HTTPError as e:return e.code,e.read()
def state():return json.loads(call('/api/admin/content')[1])
def write(content,publish=False,revision=None):
    if revision is None:revision=state()['revision']
    return call('/api/admin/content','PUT',{'content':content,'publish':publish,'revision':revision})
original=state();original_public=original['published'];original_draft=original['content']
try:
    for theme in ['night','forest','sunset']:
        draft=copy.deepcopy(original_draft);draft['theme']=theme
        status,_=write(draft);assert status==200
        assert state()['content']['theme']==theme
        assert json.loads(call('/api/content')[1])['content']==original_public
        html=call('/admin/preview')[1].decode();assert 'theme-'+theme in html
    for theme in ['night','forest','sunset']:
        draft=copy.deepcopy(original_draft);draft['theme']=theme
        status,_=write(draft,True);assert status==200
        assert json.loads(call('/api/content')[1])['content']['theme']==theme
        assert 'theme-'+theme in call('/')[1].decode()
    shared_revision=state()['revision']
    a=copy.deepcopy(original_draft);b=copy.deepcopy(original_draft)
    a['intro']='Concurrent writer A';b['intro']='Concurrent writer B'
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        futures=[pool.submit(write,entry,False,shared_revision) for entry in [a,b]]
        codes=sorted(f.result()[0] for f in futures)
    assert codes==[200,409],codes
    stale_revision=state()['revision'];assert write(original_draft)[0]==200
    assert write(original_draft,revision=stale_revision)[0]==409
    for field,value in [('name','  '),('email','invalid'),('github','https://github.com/user/repository')]:
        broken=copy.deepcopy(original_draft);broken[field]=value
        code,raw=write(broken);assert code==422
        assert any(issue['path']==[field] for issue in json.loads(raw)['issues'])
    broken=copy.deepcopy(original_draft);broken['projects'].append(copy.deepcopy(broken['projects'][0]));assert write(broken)[0]==422
    for endpoint in ['/api/admin/content','/api/admin/github']:
        req=urllib.request.Request(BASE+endpoint)
        try:urllib.request.urlopen(req);raise AssertionError('Anonymous access was accepted')
        except urllib.error.HTTPError as e:assert e.code==403
    print('PASS: all theme draft/preview/publish transitions, structured field errors, duplicate IDs, concurrent writes, stale revisions, and admin authorization.')
finally:
    assert write(original_public,True)[0]==200
    assert write(original_draft,False)[0]==200
    restored=state();assert restored['content']==original_draft and restored['published']==original_public
    print('Original local draft and published content restored.')
