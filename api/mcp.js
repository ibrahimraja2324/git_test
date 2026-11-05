/** Experimental stateless MCP tool endpoint for connected reader-owned AI.
 * Does not accept user keys, never exposes private narrative index contents.
 */
import {searchBooks,readSearchData,safeQuery} from '../server/search_service.mjs';
const TOOL={name:'search_novalume',description:'Discover authorised books matching a highly specific story description. Returns spoiler-safe rankings based on private text-derived indexing. Matching is lexical and tentative; never imply events are confirmed.',inputSchema:{type:'object',properties:{query:{type:'string',description:'Describe the precise narrative premise, pacing, archetype, relationships, reveals or conflicts sought.'},interests:{type:'array',items:{type:'string'},description:'Optional other preferred textual concepts.'},avoid:{type:'array',items:{type:'string'},description:'Optional topics to avoid.'},requiredConcepts:{type:'array',items:{type:'string'},description:'Strict lexical requirements: all meaningful words in each supplied concept must co-occur in a single paragraph; no semantic guarantee.'},samePassage:{type:'boolean',description:'If true, all requiredConcepts must have word overlap in one paragraph. Still not proof the described event occurred.'}},required:['query']}};
const jsonrpc=(id,result)=>({jsonrpc:'2.0',id,result});
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET')return res.status(200).json({description:'Novalume experimental MCP Streamable HTTP endpoint',endpoint:'/api/mcp',availableTool:TOOL.name});
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  let msg;try{msg=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return res.status(400).json({error:'Invalid JSON payload'})}
  if(!msg||typeof msg.method!=='string')return res.status(400).json({error:'Invalid MCP request'});
  if(msg.method==='notifications/initialized')return res.status(202).end();
  if(!('id' in msg))return res.status(400).json({error:'Missing request id'});
  if(msg.method==='initialize')return res.status(200).json(jsonrpc(msg.id,{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'Novalume Search',version:'0.2.0'}}));
  if(msg.method==='tools/list')return res.status(200).json(jsonrpc(msg.id,{tools:[TOOL]}));
  if(msg.method==='tools/call'&&msg.params?.name===TOOL.name){
    try{const args=safeQuery(msg.params.arguments||{});const {catalog,indexes}=readSearchData();const results=searchBooks(args,catalog,indexes);
      return res.status(200).json(jsonrpc(msg.id,{content:[{type:'text',text:JSON.stringify({query:args.query,results,spoilerPolicy:'private metadata not disclosed',certainty:'tentative-text-matches'})}],isError:false}));
    }catch(e){return res.status(200).json(jsonrpc(msg.id,{content:[{type:'text',text:e.status?e.message:'Search failed'}],isError:true}))}
  }
  return res.status(200).json({jsonrpc:'2.0',id:msg.id,error:{code:-32601,message:'Method not found'}});
}
