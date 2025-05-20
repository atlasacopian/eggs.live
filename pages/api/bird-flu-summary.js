import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req,res){
  const { data, error } = await sb.from('bird_flu_outbreaks').select('report_date,birds_affected,depop_status')
  if(error) return res.status(500).json({error:'supabase'});
  const today = new Date().toISOString().slice(0,10)
  const weekAgo = new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10)
  let todayTotal=0, weekTotal=0, culledTotal=0
  data.forEach(r=>{
    if(r.report_date===today) todayTotal+=r.birds_affected
    if(r.report_date>=weekAgo) weekTotal+=r.birds_affected
    if(r.depop_status?.startsWith('DEP')) culledTotal+=r.birds_affected
  })
  res.setHeader('Cache-Control','public,max-age=900,stale-while-revalidate=1800')
  return res.status(200).json({todayTotal,weekTotal,culledTotal,lastUpdated:today})
} 