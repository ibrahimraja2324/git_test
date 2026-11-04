/** Search endpoint for readers; private phrase graph never leaves the server. */
import {searchBooks,readSearchData,safeQuery} from '../server/search_service.mjs';
export default function handler(req,res){
  res.setHeader('Cache-Control','public,max-age=60,s-maxage=300');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'GET only'})}
  try{
    const args=safeQuery({q:req.query?.q,interests:typeof req.query?.interests==='string'?req.query.interests.split('|'):[],avoid:typeof req.query?.avoid==='string'?req.query.avoid.split('|'):[],requiredConcepts:typeof req.query?.requiredConcepts==='string'?req.query.requiredConcepts.split('|'):[]});
    const data=readSearchData();
    return res.status(200).json({schema:'novalume.safe-search.v1',query:args.query,
      results:searchBooks(args,data.catalog,data.indexes),spoilerPolicy:'no-private-evidence-in-responses',
      processing:'offline-precomputed; no cloud AI inference'});
  }catch(e){return res.status(e.status||500).json({error:e.status?e.message:'Search temporarily unavailable'})}
}
