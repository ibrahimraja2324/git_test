import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/mcp.js';

function mock(method,body){
 let statusCode=200, output;
 const response={setHeader(){return this;},status(code){statusCode=code;return this;},json(value){output=value;return this;},end(){return this;}};
 handler({method,body},response);
 return {statusCode,output};
}
test('MCP GET discovery works without private metadata',()=>{
 const r=mock('GET');
 assert.equal(r.statusCode,200);
 assert.equal(r.output.availableTool,'search_novalume');
 assert.equal(r.output.endpoint,'/api/mcp');
});
test('MCP initialize and tools/list expose a safe tool schema',()=>{
 const init=mock('POST',{jsonrpc:'2.0',id:1,method:'initialize'});
 assert.equal(init.statusCode,200);
 assert.equal(init.output.result.serverInfo.name,'Novalume Search');
 const listed=mock('POST',{jsonrpc:'2.0',id:2,method:'tools/list'});
 assert.equal(listed.statusCode,200);
 assert.equal(listed.output.result.tools[0].name,'search_novalume');
 assert.ok(!JSON.stringify(listed.output).includes('narrative.sqlite'));
});
test('Invalid MCP requests reject safely',()=>{
 assert.equal(mock('POST','{broken').statusCode,400);
 assert.equal(mock('DELETE').statusCode,405);
 assert.equal(mock('POST',{method:'unknown',id:3}).output.error.code,-32601);
});
