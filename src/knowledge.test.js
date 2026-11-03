import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceForQuestion,buildContextPacket,contextPrompt,askLocalModel} from './knowledge.js';
const book={id:'sample',title:'Sample',author:'A',blurb:'Basic story',status:'ready',chapterCount:3};
const knowledge={schema:'novalume.narrative-evidence.v1',bookId:'sample',chapterCount:3,chapters:[
 {number:1,observations:[{chapter:1,paragraph:2,label:'Family',matchedTerms:['father'],excerpt:'His father frowned.',verification:'lexical-observation',sourceHash:'a'}]},
 {number:2,observations:[{chapter:2,paragraph:4,label:'Revelations',matchedTerms:['revealed'],excerpt:'The real secret was revealed.',verification:'lexical-observation',sourceHash:'b'}]},
 {number:3,observations:[{chapter:3,paragraph:8,label:'Revelations',matchedTerms:['revealed'],excerpt:'The villain was the father.',verification:'lexical-observation',sourceHash:'c'}]}
]};
test('context never contains future clues even with direct future-related question',()=>{
 const p=buildContextPacket(book,knowledge,'father revealed',1,['family']);
 assert.equal(p.readThroughChapter,1);
 assert.equal(p.observations.length,1);
 assert(!JSON.stringify(p).includes('villain'));
 assert(!contextPrompt(p).includes('villain'));
});
test('zero chapters exposes no excerpts',()=>assert.equal(buildContextPacket(book,knowledge,'father',0).observations.length,0));
test('unknown story or unapproved book denied',()=>assert.throws(()=>buildContextPacket({...book,status:'external'},knowledge,'x',1)));
test('local model adapter rejects arbitrary hosts and bogus model names',async()=>{
 await assert.rejects(()=>askLocalModel(buildContextPacket(book,knowledge,'father',1),{provider:'remote',model:'x'}));
 await assert.rejects(()=>askLocalModel(buildContextPacket(book,knowledge,'father',1),{provider:'ollama',model:'http://evil.com'}));
});
test('local call restricts URL, response and context to cutoff',async()=>{
 let url,body;
 const fake=async (u,opts)=>{url=u;body=JSON.parse(opts.body);return {ok:true,json:async()=>({message:{content:'I cannot confirm that.'}})}};
 const p=buildContextPacket(book,knowledge,'father',1);
 const reply=await askLocalModel(p,{provider:'ollama',model:'tinyllama',fetchImpl:fake});
 assert.equal(reply,'I cannot confirm that.');
 assert.equal(url,'http://127.0.0.1:11434/api/chat');
 assert(!JSON.stringify(body).includes('villain'));
});
test('relevance sorted and hard capped',()=>assert.equal(evidenceForQuestion(knowledge,'reveal',3,1).length,1));
