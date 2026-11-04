#!/usr/bin/env python3
"""Inspect ranking quality on actual sampled classic-fiction prose; no paid inference."""
import json
from pathlib import Path
from dynamic_narrative import mine_book,score_query,ROOT

CASES=[
  {'query':'Mr Bennet Elizabeth marriage and the ball','expected':'pride-and-prejudice'},
  {'query':'Travel to the Carpathians and Transylvania','expected':'dracula'},
  {'query':'a strange castle and the count','expected':'dracula'},
  {'query':'time machine geometry and a laboratory','expected':'the-time-machine'},
  {'query':'time traveller missing at dinner','expected':'the-time-machine'},
  {'query':'royal cultivation sect battles','expected':None}
]

def evaluate():
    corpus=json.loads((ROOT/'tests/fixtures/verified_public_domain_excerpts.json').read_text())['samples']
    idx={book['id']:mine_book(book['id'],book['chapters']) for book in corpus}
    results=[];top1=0
    for c in CASES:
        rankings=sorted(((id,*score_query(model,c['query'])) for id,model in idx.items()),key=lambda x:(-x[1],x[0]))
        predicted=rankings[0][0] if rankings and rankings[0][1]>0 else None
        success=predicted==c['expected']
        top1+=success
        results.append({**c,'predicted':predicted,'correct':success,'topScores':[{'book':n,'score':score,'matchedPhrases':matches} for n,score,matches in rankings]})
    summary={'scope':'24 hand-sampled paragraphs across six chapters of three actual public-domain English novels; not whole books',
             'queryCount':len(CASES),'top1Count':top1,'top1Accuracy':round(top1/len(CASES),4),
             'counts':{id:{'dynamicPhrases':len(d['dynamicPhrases']),'candidateEntities':len(d['candidateEntities']),'pairs':len(d['coMentions'])} for id,d in idx.items()},
             'results':results,
             'limitations':['Data are real excerpts, not full novels; no evaluated plot-event understanding',
                            'Queries are handcrafted and not an unbiased reader sample',
                            'Lexical overlap has no synonym guarantee',
                            'Private metadata must not ship in public static bundle']}
    path=ROOT/'docs/real-data-evaluation.json'
    path.write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'queries':len(CASES),'top1':top1,'accuracy':summary['top1Accuracy'],'counts':summary['counts']},indent=2))
    return summary
if __name__=='__main__':evaluate()
