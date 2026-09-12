import assert from "node:assert/strict";
import test from "node:test";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import worker,{valid} from "../ranking-api/src/index.ts";
import {JOB_IDS} from "../shared/jobs.ts";
import {flushPendingRankings,submitRankingReliably,PENDING_RANKING_KEY,FAILED_RANKING_KEY} from "../app/ranking.ts";
const payload={submissionId:"11111111-1111-4111-8111-111111111111",playerId:"22222222-2222-4222-8222-222222222222",name:"探索者",job:"warrior",floor:20,score:21000,kills:5,bosses:1,result:"dead"};
const envFor=()=>{
 const db=new DatabaseSync(":memory:");
 for(const file of ["0001_ranking_records.sql","0002_ranking_run_history.sql","0003_ranking_submission_id.sql"])db.exec(readFileSync(new URL("../ranking-api/migrations/"+file,import.meta.url),"utf8"));
 return {db,env:{ALLOWED_ORIGIN:"https://chika-hyakkei.github.io",DB:{prepare(sql){let args=[];return{bind(...params){args=params;return this;},async all(){return{results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args)??null;},async run(){return db.prepare(sql).run(...args);}};}}}};
};
test("all 8 jobs x 4 endings are accepted by the actual API and duplicate submissions stay singular",async()=>{
 const {env,db}=envFor();
 try{
  let i=0;
  for(const job of JOB_IDS)for(const result of ["dead","return","abandon","clear"]){
   const data={...payload,job,result,submissionId:"11111111-1111-4111-8111-"+String(++i).padStart(12,"0")};
   assert.equal(valid(data),true);
   const request=()=>new Request("https://ranking.test/submit",{method:"POST",headers:{origin:env.ALLOWED_ORIGIN,"content-type":"application/json"},body:JSON.stringify(data)});
   const first=await worker.fetch(request(),env),second=await worker.fetch(request(),env);
   assert.equal(first.status,200);assert.deepEqual(await first.json(),await second.json());
  }
  assert.equal(db.prepare("SELECT COUNT(*) n FROM ranking_runs").get().n,32);
 }finally{db.close();}
});
test("a submission outside the top 100 is returned with its real rank",async()=>{
 const {env,db}=envFor();
 try{
  const insert=db.prepare("INSERT INTO ranking_runs(submission_id,player_id,display_name,job,floor,score,kills,bosses,result,played_at,week_key) VALUES(?,?,?,?,?,?,?,?,?,?,?)");
  for(let i=1;i<=105;i++)insert.run("s"+i,"p","n","warrior",1,106-i,0,0,"dead","2026-09-12T00:00:00Z","2026-37");
  const response=await worker.fetch(new Request("https://ranking.test/leaderboard?highlight=105"),env),body=await response.json();
  assert.equal(body.entries.length,100);assert.equal(body.currentEntry.rank,105);assert.equal(body.currentEntry.highlighted,true);
 }finally{db.close();}
});
test("one permanent failure is retained separately and does not block a later valid submission",async()=>{
 const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 globalThis.window={__CHIKA_RANKING_API_URL__:"https://ranking.test"};
 const bad={...payload,job:"missing"},good={...payload,submissionId:"33333333-3333-4333-8333-333333333333"};
 values.set(PENDING_RANKING_KEY,JSON.stringify([bad,good]));
 globalThis.fetch=async(_url,init)=>JSON.parse(init.body).job==="missing"?new Response(JSON.stringify({error:"invalid job"}),{status:400}):new Response(JSON.stringify({entryId:"7"}));
 const result=await flushPendingRankings();assert.deepEqual(result,{sent:1,remaining:0,rejected:1});
 assert.equal(JSON.parse(values.get(FAILED_RANKING_KEY))[0].submission.job,"missing");
});
