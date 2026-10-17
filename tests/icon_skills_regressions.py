"""Local-only draft persistence checks. Never publishes or overwrites concurrent edits."""
import copy,json,uuid,urllib.request,urllib.error
BASE='http://127.0.0.1:5173'
def request(method='GET',body=None):
 headers={'Origin':BASE,'Cookie':'__sites_local_auth=1','Content-Type':'application/json'}
 try:
  with urllib.request.urlopen(urllib.request.Request(BASE+'/api/admin/content',method=method,headers=headers,data=json.dumps(body).encode() if body is not None else None)) as r:return r.status,json.loads(r.read())
 except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
def write(content,revision):return request('PUT',{'content':content,'revision':revision,'publish':False})
status,original=request();assert status==200
content=copy.deepcopy(original['content']);content['skillItems']=[{'id':str(uuid.uuid4()),'name':'TypeScript','category':'Frontend'}];content['iconAssets']=[{'id':str(uuid.uuid4()),'name':'Local QA','kind':'company','image':'/assets/brands/ideal-it.png','themed':True}];content['iconStyle']='themed';content['iconPromptTemplate']='Local QA icon for {name}, foreground {foreground}, accent {accent}.'
revision=None
try:
 status,result=write(content,original['revision']);assert status==200,(status,result);revision=result['revision']
 _,saved=request();assert saved['content']['skillItems']==content['skillItems'];assert saved['content']['iconAssets']==content['iconAssets'];assert saved['content']['iconPromptTemplate']==content['iconPromptTemplate'];assert saved['published']==original['published']
 duplicate=copy.deepcopy(content);duplicate['iconAssets'].append({**content['iconAssets'][0],'id':str(uuid.uuid4()),'name':' local qa '});assert write(duplicate,revision)[0]==422
 invalid=copy.deepcopy(content);invalid['skillItems'][0]['category']='Invented';assert write(invalid,revision)[0]==422
 assert write(content,original['revision'])[0]==409
 print('PASS: skill/icon/template draft persistence, duplicate icon validation, skill validation, and stale revision. Published content unchanged.')
finally:
 if revision is not None:
  _,latest=request()
  if latest['revision']==revision and latest['content']==content:
   assert write(original['content'],revision)[0]==200
   print('Original local draft restored.')
  else:
   raise RuntimeError('Concurrent changes detected; preserving the latest draft instead of restoring over them.')
