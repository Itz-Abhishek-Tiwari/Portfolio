"""Isolated local journal lifecycle test; fixture is archived afterward."""
import json,uuid,urllib.request,urllib.error
from local_env import BASE,COOKIE
def call(path,method='GET',body=None,auth=True):
 h={'Origin':BASE,'Content-Type':'application/json'}
 if auth:h['Cookie']=COOKIE
 try:
  with urllib.request.urlopen(urllib.request.Request(BASE+path,headers=h,data=json.dumps(body).encode() if body is not None else None,method=method)) as r:return r.status,json.loads(r.read()) if path.startswith('/api') else r.read().decode()
 except urllib.error.HTTPError as e:return e.code,e.read().decode()
id=str(uuid.uuid4());slug='local-qa-'+id[:8];post={'title':'Local QA article','slug':slug,'excerpt':'Temporary local fixture','body':'## Verified journal\n\n**Markdown** article.','cover':'','tags':['QA']};revision=0
try:
 assert call('/api/admin/posts',auth=False)[0]==403
 status,result=call('/api/admin/posts','PUT',{'id':id,'content':post,'revision':0,'publish':False});assert status==200,(status,result);revision=result['revision']
 assert call('/blog/'+slug,auth=False)[0]==404
 status,result=call('/api/admin/posts','PUT',{'id':id,'content':post,'revision':revision,'publish':True});assert status==200,(status,result);revision=result['revision']
 assert 'Verified journal' in call('/blog/'+slug,auth=False)[1]
 assert call('/api/admin/posts','PUT',{'id':id,'content':post,'revision':1,'publish':True})[0]==409
 post['slug']=slug+'-draft'
 status,result=call('/api/admin/posts','PUT',{'id':id,'content':post,'revision':revision,'publish':False});assert status==200;revision=result['revision']
 assert call('/blog/'+slug,auth=False)[0]==200
 assert call('/blog/'+post['slug'],auth=False)[0]==404
 status,result=call('/api/admin/posts','PATCH',{'id':id,'revision':revision,'action':'unpublish'});assert status==200;revision=result['revision']
 assert call('/blog/'+slug,auth=False)[0]==404
 print('PASS: journal authorization, draft privacy, publish, stale revision, stable published slug, and unpublish.')
finally:
 if revision:assert call('/api/admin/posts','PATCH',{'id':id,'revision':revision,'action':'archive'})[0]==200
