import {requestStaticArgs,searchStaticEvidence,readStaticEvidence} from '../server/static_observation_service.mjs';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'GET only'})}
 try{
  const args=requestStaticArgs({query:req.query?.q,bookId:req.query?.bookId,
    reveal:req.query?.reveal,chapterLimit:req.query?.chapterLimit});
  return res.status(200).json(searchStaticEvidence(args,readStaticEvidence(args.bookId)));
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'Textual evidence search unavailable'});}
}
