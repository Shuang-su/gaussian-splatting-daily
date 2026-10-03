#!/usr/bin/env python3
"""Bound daily-publication attachments to dated raster files and provenance manifests."""
import argparse,hashlib,json,re
from datetime import date,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LIMIT=40*1024*1024
SAFE=re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:png|jpg|jpeg|webp)$')
def validate_directory(folder:Path):
 errors=[]
 def require(ok,message):
  if not ok:errors.append(f'{folder.name}: {message}')
 try:date.fromisoformat(folder.name);manifest=json.loads((folder/'manifest.json').read_text())
 except (ValueError,OSError):return [f'{folder}: missing or invalid dated manifest']
 require(manifest.get('schemaVersion')==1 and manifest.get('date')==folder.name,'manifest version/date mismatch')
 assets=manifest.get('assets',[]);images=manifest.get('images',{});expected={'manifest.json'};prefix=f'/daily-media/{folder.name}/'
 require(isinstance(assets,list) and 0<len(assets)<=20,'expected 1–20 assets')
 if not isinstance(assets,list) or not isinstance(images,dict):return errors+['invalid assets/images']
 seen=set()
 for asset in assets:
  try:
   original=asset['original'];name=original.removeprefix(prefix)
   require(original.startswith(prefix) and bool(SAFE.fullmatch(name)),'original must be a dated raster file')
   if not original.startswith(prefix) or not SAFE.fullmatch(name):continue
   expected.add(name);file=folder/name
   require(not file.is_symlink(),'symlinks are not permitted')
   if file.is_symlink():continue
   payload=file.read_bytes();require(len(payload)<=12*1024*1024,'original exceeds 12 MiB')
   require(hashlib.sha256(payload).hexdigest()==asset['originalSha256'],'original checksum mismatch')
   require(bool(re.fullmatch('[a-f0-9]{64}',asset['sourceSha256'])),'source checksum missing')
   require(payload.startswith(b'\x89PNG\r\n\x1a\n') or payload.startswith(b'\xff\xd8\xff') or payload[:4]==b'RIFF' and payload[8:12]==b'WEBP','unrecognized raster signature')
   require(asset['remoteUrl'].startswith('https://') and asset['image']['source'].startswith('https://'),'source URLs must use HTTPS')
   require(asset['remoteUrl'] not in seen,'duplicate remote source');seen.add(asset['remoteUrl'])
   require(bool(asset['image']['alt'].strip()) and bool(asset['image']['credit'].strip()),'alt text and attribution required')
   datetime.fromisoformat(asset['retrievedAt'].replace('Z','+00:00'))
   require(date.fromisoformat(asset['sourcePublishedAt'])<=date.fromisoformat(folder.name),'image postdates the report')
   image=images[asset['remoteUrl']];require(image['originalUrl']==original,'original URL mismatch')
   require(0<image['width']<=20000 and 0<image['height']<=20000,'invalid image dimensions')
   widths=[]
   for variant in image['variants']:
    name=variant['url'].removeprefix(prefix);require(variant['url'].startswith(prefix) and bool(SAFE.fullmatch(name)) and name.endswith('.webp'),'invalid variant path')
    if not variant['url'].startswith(prefix) or not SAFE.fullmatch(name):continue
    expected.add(name);file=folder/name;require(file.is_file() and not file.is_symlink(),'variant missing or symlink')
    if file.is_file():
     data=file.read_bytes();require(len(data)<=4*1024*1024 and data[:4]==b'RIFF' and data[8:12]==b'WEBP','invalid or oversized WebP')
    widths.append(variant['width'])
   require(sorted(widths)==sorted(set(min(size,image['width']) for size in [640,960,1600])),'variants must be 640/960/1600 without upscaling')
   require(image['url'] in [v['url'] for v in image['variants']],'default variant is missing')
  except (KeyError,TypeError,ValueError,OSError) as exc:errors.append(f'{folder.name}: incomplete media record: {exc}')
 require(set(images)==seen,'unlisted image mappings are not permitted')
 files=list(folder.iterdir());require(sum(f.stat().st_size for f in files if f.is_file())<=LIMIT,'date exceeds 40 MiB')
 require({f.name for f in files}==expected,'unlisted files or missing assets');require(all(f.is_file() and not f.is_symlink() for f in files),'directories and symlinks are not permitted')
 return errors

def validate(root=ROOT):
 folder=Path(root)/'site/public/daily-media'
 if not folder.exists():return []
 return [error for child in folder.iterdir() for error in (validate_directory(child) if child.is_dir() and not child.is_symlink() else [f'invalid media directory: {child}'])]
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=ROOT);args=parser.parse_args();errors=validate(args.root)
 if errors:raise SystemExit('\n'.join(errors))
 print('Daily media provenance and attachment limits passed')
