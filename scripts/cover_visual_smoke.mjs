/** Real-browser evidence, never asserts that absent copyrighted covers are available. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.env.NOVALUME_URL||'https://novalume-story-search.vercel.app';
const out='artifacts/novalume-cover-smoke';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={origin:ROOT,checkedAt:new Date().toISOString(),runs:[]};
try{
 for(const [name,width,height,dpr] of [['mobile',390,844,2],['desktop',1440,900,1]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
  const errorMessages=[];
  page.on('pageerror',e=>errorMessages.push(String(e.message).slice(0,180)));
  await page.goto(ROOT+'/#home',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('.nov-hero').waitFor({timeout:18000});
  await page.waitForTimeout(5000);
  await page.screenshot({path:path.join(out,'homepage-'+name+'.png'),fullPage:false});
  const metrics=await page.evaluate(()=>{
   const art=[...document.querySelectorAll('img[data-nov-cover]')];
   const hero=[...document.querySelectorAll('.nov-floating img[data-nov-cover]')];
   const mobileHero=[...document.querySelectorAll('.nov-mobile-covers img[data-nov-cover]')];
   const heroTitle=[...document.querySelectorAll('.nov-floating a')].map(n=>n.getAttribute('href'));
   return {
    mappedImages:art.length,
    heroImages:hero.length,mobileHeroImages:mobileHero.length,
    heroTitle,
    coverSrcSample:art.slice(0,6).map(i=>i.src),
    loaded:art.filter(i=>i.complete&&i.naturalWidth>=100).length,
    lowResolution:art.filter(i=>i.complete&&i.naturalWidth<100).length,
    media:art.slice(0,8).map(i=>({width:i.naturalWidth,height:i.naturalHeight,
       rectWidth:Math.round(i.getBoundingClientRect().width),
       rectHeight:Math.round(i.getBoundingClientRect().height),
       fit:getComputedStyle(i).objectFit}))
   };
  });
  await page.goto(ROOT+'/#series/mother-of-learning',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#novExperience').waitFor({timeout:18000});
  await page.waitForTimeout(2500);
  await page.screenshot({path:path.join(out,'detail-'+name+'.png'),fullPage:false});
  report.runs.push({name,width,height,dpr,home:metrics,jsErrors:errorMessages});
  await page.close();
 }
}catch(err){
 report.failure=String(err.stack||err).slice(0,4000);
}finally{
 await browser.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 if(report.failure||report.runs.length!==2||report.runs.some(x=>x.jsErrors.length))process.exitCode=1;
}
