#!/usr/bin/env python3
import os
import sys
import json
import datetime
import subprocess
from dotenv import load_dotenv
from supabase import create_client

# Load environment
load_dotenv('.env.local')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print('Missing Supabase env vars')
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Determine yesterday/today
today = datetime.date.today().isoformat()
yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

# Ensure data dir exists
os.makedirs('data', exist_ok=True)
out_file = 'data/wahis_birdflu.json'

# Run WAHIS retriever CLI (adjust flags if needed)
cmd = [
    'python', 'wahis-retriever/report_retriever.py',
    '-c', 'United States',
    '-d', 'Avian influenza',
    '-sd', yesterday,
    '-ed', today,
    '--format', 'json',
    '-o', out_file
]
print('Running WAHIS retriever:', ' '.join(cmd))
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print('Error running retriever:', res.stderr)
    sys.exit(1)

# Load JSON records
with open(out_file) as f:
    records = json.load(f)

# Map and upsert
mapped = []
for r in records:
    mapped.append({
        'report_date': r.get('report_date') or r.get('startDate') or r.get('confirmation_date'),
        'state': r.get('province') or r.get('state'),
        'county': r.get('subRegion') or r.get('county'),
        'flock_type': r.get('hostCategory') or r.get('production_type'),
        'birds_affected': r.get('casesConfirmed') or r.get('birds_affected'),
        'depop_status': r.get('controlMeasure') or r.get('depopulation_status')
    })

print(f"Upserting {len(mapped)} records to Supabase...")
response = sb.from_('bird_flu_outbreaks').upsert(mapped, on_conflict=['report_date','state','county','flock_type']).execute()
if response.error:
    print('Upsert error:', response.error)
    sys.exit(1)

print('✅ WAHIS HPAI data upsert complete.') 