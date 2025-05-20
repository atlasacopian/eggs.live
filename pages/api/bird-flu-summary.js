import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req,res){
  const { data, error } = await sb.from('bird_flu_outbreaks').select('report_date,birds_affected,depop_status')
  if(error) return res.status(500).json({error:'supabase'});
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const weekAgoStr = new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10);
  const ytdStartStr = new Date(today.getFullYear(),0,1).toISOString().slice(0,10);

  let stats = {
    todayOutbreaks:0,
    todayBirds:0,
    weekOutbreaks:0,
    weekBirds:0,
    ytdOutbreaks:0,
    ytdBirds:0,
    birdsCulledYTD:0,
    birdsPending:0
  };

  data.forEach(r=>{
    const date=r.report_date;
    const birds=r.birds_affected||0;
    const culled=r.depop_status?.startsWith('DEP COMP');
    const pending=!culled;

    if(date>=ytdStartStr){
      stats.ytdOutbreaks++;
      stats.ytdBirds+=birds;
      if(culled) stats.birdsCulledYTD+=birds;
      if(pending) stats.birdsPending+=birds;
    }
    if(date>=weekAgoStr){
      stats.weekOutbreaks++;
      stats.weekBirds+=birds;
    }
    if(date===todayStr){
      stats.todayOutbreaks++;
      stats.todayBirds+=birds;
    }
  })

  res.setHeader('Cache-Control','public,max-age=900,stale-while-revalidate=1800')
  return res.status(200).json({...stats,lastUpdated:todayStr})
} 