import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3,Raycaster} from 'three';
import {buildBuilding} from '../src/twin/model.js';
import {floors,point,PLINTH,LEVEL,stairs,interpolate} from '../src/twin/model-data.js';
const model=buildBuilding();model.root.updateMatrixWorld(true);
const bounds=id=>{const b=new Box3();model.walls.filter(m=>m.userData.wall===id).forEach(m=>b.expandByObject(m));return b;};
const near=(a,b,tolerance=.03)=>assert.ok(Math.abs(a-b)<=tolerance,`${a.toFixed(4)} differs from ${b} by more than ${tolerance} m`);

test('actual ground walls preserve the 12.71 m frontage and 14.84 m wing depth',()=>{
 near(bounds('g-right').min.x-bounds('g-left').max.x,12.71);
 near(bounds('g-wing-rear').min.z-bounds('g-garage-front').max.z,14.84);
});
test('main block has a 9.01 m clear span and 11.11 m depth',()=>{
 near(bounds('g-right').min.x-bounds('g-wing-divider').max.x,9.01);
 near(bounds('g-main-rear').min.z-bounds('g-garage-front').max.z,11.11);
});
test('documented ground bedroom depth constrains actual clear wall faces',()=>{
 near(bounds('g-main-rear').min.z-bounds('g-bedroom-front').max.z,3.47,.00001);
});
test('upper and ground façade datums align within traced line thickness',()=>{
 near(bounds('u-left').max.x,bounds('g-left').max.x);
 near(bounds('u-right').min.x,bounds('g-right').min.x);
 near(bounds('u-wing-front').max.z,bounds('g-garage-front').max.z);
 near(bounds('u-wing-rear').min.z,bounds('g-wing-rear').min.z);
});
test('actual side deck geometry preserves separate dimensioned lengths and 2.22 m width',()=>{
 const decks=[];model.root.traverse(m=>{if(m.userData.kind==='deck'&&m.userData.name==='Side access')decks.push(m);});assert.equal(decks.length,2);
 decks.forEach((mesh,i)=>{const b=new Box3().setFromObject(mesh);near(b.max.x-b.min.x,2.22,.00001);near(b.max.z-b.min.z,i?9.03:8.33,.00001);near(b.min.z,i?2.08:2.78,.00001);});
});
test('every drawn door and window is an actual structural void at opening height',()=>{
 for(const f of floors)for(const wall of f.walls)for(const opening of wall.openings){
  const midpoint=(opening.a+opening.b)/2,horizontal=wall.a[1]===wall.b[1];
  const p=horizontal?point(f.id,midpoint,wall.a[1]):point(f.id,wall.a[0],midpoint);
  const q=new Vector3(p[0],PLINTH+(f.id==='upper'?LEVEL:0)+1.3,p[1]);
  const solids=model.walls.filter(m=>m.userData.wall===wall.id);
  assert.ok(!solids.some(m=>new Box3().setFromObject(m).containsPoint(q)),`${wall.id}: obstructed ${opening.kind}`);
 }
 assert.equal(model.openings.length,40);
});
test('both actual slabs have the L-shaped rear notch, with aligned wing extension',()=>{
 model.floorGroups.forEach((g,i)=>{
  const slab=g.children.find(c=>c.userData.kind==='floorSlab');
  const cast=(x,z)=>new Raycaster(new Vector3(x,20,z),new Vector3(0,-1,0)).intersectObject(slab).length;
  assert.equal(cast(8,13),0);assert.ok(cast(2,13)>0);assert.ok(cast(8,8)>0);
  const b=new Box3().setFromObject(slab);near(b.max.y,PLINTH+i*LEVEL,.000001);
 });
});
test('two external staircase systems contain three flights and reach the upper floor',()=>{
 const systems=model.stairGroup.children.filter(g=>g.userData.kind==='stairSystem');assert.equal(systems.length,2);assert.equal(stairs.reduce((s,x)=>s+x.flights.length,0),3);
 assert.equal(model.stairMeshes.filter(m=>m.userData.system==='straight').length,20);
 assert.equal(model.stairMeshes.filter(m=>m.userData.system==='paired').length,18);
 for(const id of ['straight','paired'])near(Math.max(...model.stairMeshes.filter(m=>m.userData.system===id).map(m=>new Box3().setFromObject(m).max.y)),PLINTH+LEVEL,.000001);
 const paired=model.stairMeshes.filter(m=>m.userData.system==='paired');assert.ok(paired.every(m=>m.position.x>3.7&&m.position.x<6&&m.position.z>11.1));
 const straight=model.stairMeshes.filter(m=>m.userData.system==='straight');assert.ok(straight.every(m=>m.position.x>12.71&&m.position.z<2.78));
});
test('front entrance has three separate low steps, rather than replacing an external stair',()=>{
 const steps=model.stairGroup.children.filter(m=>m.userData.kind==='entranceStep');assert.equal(steps.length,3);near(Math.max(...steps.map(m=>new Box3().setFromObject(m).max.y)),PLINTH,.000001);
 assert.ok(steps.every(m=>m.position.z<0&&m.position.x>6&&m.position.x<10));
});
test('labels are floor-specific and garage is represented by real floor geometry',()=>{
 const sets=model.floorGroups.map(g=>g.children.filter(m=>m.userData.kind==='unitFloor').map(m=>m.userData.unit).sort());
 assert.deepEqual(sets,[['app1','app5','garage'],['app2','app3','app4']]);
 assert.ok(model.walls.some(m=>m.userData.wall==='g-garage-rear'));assert.ok(model.walls.some(m=>m.userData.wall==='u-app2-app3'));
});
test('calibration extrapolates from the nearest endpoint segment, preserving rear geometry',()=>{
 near(interpolate(2500,[[0,0],[100,1],[200,3]]),49,.00001);
 const p=point('ground',2440,2325);near(p[0],12.71,.00001);near(p[1],14.84,.00001);
});
