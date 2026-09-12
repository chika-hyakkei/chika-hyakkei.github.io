import assert from "node:assert/strict";
import test from "node:test";
import {createDescent,advanceDescent,descentTargetFloor,descentSupplyAward,DESCENT_MAX_PROGRESS} from "../app/descent.ts";
test("checkpoints are only post-boss floors and the course is seeded",()=>{
 assert.equal(descentTargetFloor(47),41);assert.equal(descentTargetFloor(100),91);assert.equal(descentTargetFloor(10),1);
 assert.deepEqual(createDescent(41,99),createDescent(41,99));assert.equal(createDescent(41,99).status,"ready");
 assert.equal(createDescent(41,99).events.filter(e=>e.kind==="crate").length,5);
});
test("movement is continuous, bounded and independent of render frequency",()=>{
 const start={...createDescent(11,12),status:"falling",events:[]};
 const one=advanceDescent(start,{axis:1},250);
 let many=start;for(let i=0;i<25;i++)many=advanceDescent(many,{axis:1},10);
 assert.ok(Math.abs(one.x-many.x)<1e-10);assert.ok(one.x>0&&one.x<.86);
 assert.equal(advanceDescent(start,{axis:1},2000).x,.86);
 assert.equal(advanceDescent(start,{targetX:.13},1000).x,.13);
 assert.equal(advanceDescent({...start,status:"ready"},{axis:1},1000).x,0);
});
test("crossed collisions are detected once and hits grant brief invulnerability",()=>{
 const state={...createDescent(11,1),status:"falling",events:[{id:1,progress:100,x:0,radius:.13,kind:"rock"},{id:2,progress:200,x:0,radius:.13,kind:"bat"},{id:3,progress:1400,x:0,radius:.13,kind:"rock"}]};
 const first=advanceDescent(state,{},250);assert.equal(first.integrity,2);assert.equal(first.resolvedEventIds.length,2);
 assert.equal(advanceDescent(first,{},100).integrity,2);
 assert.equal(advanceDescent(first,{},1200).integrity,1);
});
test("supplies are distinct from hazards; 20 seconds lands and three hits fails",()=>{
 const start={...createDescent(91,1),status:"falling",events:[{id:1,progress:100,x:0,radius:.09,kind:"crate"}]};
 const next=advanceDescent(start,{},200);assert.equal(next.crates,1);assert.equal(next.integrity,3);
 assert.equal(advanceDescent(next,{},DESCENT_MAX_PROGRESS).status,"landed");
 const failed=advanceDescent({...start,integrity:1,events:[{...start.events[0],kind:"rock"}]}, {},200);assert.equal(failed.status,"failed");
 assert.deepEqual(descentSupplyAward({...next,crates:5}),{potions:3,bombs:2,starHoney:2});
});
