import {requestArgs,searchEventIndex,readEventIndex} from '../server/narrative_service.mjs';
/** Only approved public-domain original-language samples. Author licensing and
 * authenticated chapter entitlement MUST precede proprietary story ingestion.
 */
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'GET only'});}
 try{
  const args=requestArgs({query:req.query?.q,bookId:req.query?.bookId,
                         reveal:req.query?.reveal,chapterLimit:req.query?.chapterLimit});
  return res.status(200).json(searchEventIndex(args,readEventIndex()));
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'Narrative search unavailable'});}
}
