#!/usr/bin/env python3
import os
import sys
import json
import datetime
import subprocess
from dotenv import load_dotenv
from supabase import create_client
import report_retriever

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

print('Fetching WAHIS reports via Python module...')
reports_json = report_retriever.get_report_list(
    country=['United States'],
    region=[],
    disease=['Avian influenza'],
    start_date=yesterday,
    end_date=today
)
reports_for_disease = reports_json.get('homePageDto', [])
print(f'Found {len(reports_for_disease)} reports.')

mapped = []
for rep in reports_for_disease:
    rid = rep.get('reportInfoId')
    if rid is None:
        continue
    contents = report_retriever.get_report_contents(rid)
    outbreaks = report_retriever.make_list_of_outbreaks_in_report(contents)
    outbreaks = report_retriever.append_report_data_to_outbreak(outbreaks, contents)
    for r in outbreaks:
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