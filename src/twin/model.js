import * as THREE from 'three';
import {floors,units,point,wallSegments,stairs,entranceSteps,LEVEL,PLINTH,WALL_HEIGHT} from './model-data.js';
export function buildBuilding(){
 const root=new THREE.Group();root.name='Napros';
 const mats={
  plaster:new THREE.MeshStandardMaterial({color:0xeee8da,roughness:.89}),
  trim:new THREE.MeshStandardMaterial({color:0xfffdf3,roughness:.75}),
  slab:new THREE.MeshStandardMaterial({color:0xc2b6a1,roughness:.95}),
  tile:new THREE.MeshStandardMaterial({color:0xd9ceba,roughness:.82}),
  wood:new THREE.MeshStandardMaterial({color:0xbba17c,roughness:.85}),
  fabric:new THREE.MeshStandardMaterial({color:0xc7bda9,roughness:1}),
  linen:new THREE.MeshStandardMaterial({color:0xf7f2e8,roughness:1}),
  teal:new THREE.MeshStandardMaterial({color:0x567d7b,roughness:1}),
  glass:new THREE.MeshStandardMaterial({color:0x8db9be,transparent:true,opacity:.48,roughness:.25,metalness:.08}),
  roof:new THREE.MeshStandardMaterial({color:0x859293,roughness:.75,metalness:.16,side:THREE.DoubleSide}),
  metal:new THREE.MeshStandardMaterial({color:0x52615c,roughness:.7})
 };
 function box(parent,x,y,z,w,h,d,mat=mats.plaster){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function poly(parent,coords,y,thickness,mat){
  const shape=new THREE.Shape();coords.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(geo,mat);mesh.position.y=y;mesh.receiveShadow=true;mesh.castShadow=true;parent.add(mesh);return mesh;
 }
 function bar(parent,a,b,r=.035,mat=mats.trim){
  const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),mat);mesh.position.copy(p.add(q).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(mesh);mesh.castShadow=true;return mesh;
 }
 function rail(parent,a,b,y,style='baluster'){
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.floor(len/.24));
  bar(parent,[a[0],y+.97,a[1]],[b[0],y+.97,b[1]],.065);
  bar(parent,[a[0],y+.10,a[1]],[b[0],y+.10,b[1]],.065);
  for(let i=0;i<=n;i++){
   const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   if(style==='baluster'){
    const profile=[new THREE.Vector2(.045,0),new THREE.Vector2(.045,.13),new THREE.Vector2(.075,.23),new THREE.Vector2(.043,.42),new THREE.Vector2(.075,.60),new THREE.Vector2(.04,.79)];
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile,8),mats.trim);mesh.position.set(x,y+.12,z);parent.add(mesh);
   }else bar(parent,[x,y+.12,z],[x,y+.94,z],.025,mats.metal);
  }
 }
 const floorGroups=[],walls=[],openings=[],floorSurfaces=[],pickables=[],furnishings=[];
 for(let index=0;index<floors.length;index++){
  const f=floors[index],base=PLINTH+index*LEVEL,g=new THREE.Group();g.name=f.id;root.add(g);floorGroups.push(g);
  const slab=poly(g,f.outline.map(p=>point(f.id,...p)),base-.19,.19,mats.slab);slab.userData={kind:'floorSlab',floor:index};
  f.regions.forEach(r=>{
   const material=new THREE.MeshStandardMaterial({color:units[r.unit].color,roughness:.95});material.color.lerp(new THREE.Color(0xe9e3d7),.73);
   const mesh=poly(g,r.poly.map(p=>point(f.id,...p)),base+.001,.015,material);mesh.userData={unit:r.unit,kind:'unitFloor',floor:index,originalColor:material.color.clone()};floorSurfaces.push(mesh);pickables.push(mesh);
  });
  for(const wall of f.walls){
   for(const segment of wallSegments(f.id,wall)){
    const [a,b]=[segment.a,segment.b],len=Math.hypot(b[0]-a[0],b[1]-a[1]),height=segment.top-segment.bottom;
    const mesh=box(g,(a[0]+b[0])/2,base+segment.bottom+height/2,(a[1]+b[1])/2,len+.035,height,.13);
    mesh.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);mesh.userData={kind:'wall',wall:wall.id,unit:wall.unit,floor:index,base,bottom:segment.bottom,top:segment.top,segment};walls.push(mesh);
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,30),new THREE.LineBasicMaterial({color:0xaba697,transparent:true,opacity:.38}));mesh.add(edge);
   }
   for(const o of wall.openings){
    const horiz=wall.a[1]===wall.b[1],a=horiz?point(f.id,o.a,wall.a[1]):point(f.id,wall.a[0],o.a),b=horiz?point(f.id,o.b,wall.a[1]):point(f.id,wall.a[0],o.b);
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]),height=o.head-o.sill;
    const og=new THREE.Group();og.position.set((a[0]+b[0])/2,base+o.sill,(a[1]+b[1])/2);og.rotation.y=horiz?0:-Math.PI/2;g.add(og);openings.push(og);
    og.userData={kind:o.kind,wall:wall.id,unit:wall.unit,floor:index};
    box(og,-len/2+.025,height/2,0,.05,height,.18,mats.trim);box(og,len/2-.025,height/2,0,.05,height,.18,mats.trim);box(og,0,height-.025,0,len,.05,.18,mats.trim);
    if(o.kind==='window'){
     box(og,0,.025,0,len,.05,.21,mats.trim);box(og,0,height/2,0,.045,height,.12,mats.trim);box(og,0,height/2,0,len-.08,height-.08,.028,mats.glass);
     // White slatted shutters, a photo-derived finish; do not change opening width.
     for(const side of [-1,1]){
      const shutter=box(og,side*(len/2+.17),height/2,0,.28,height,.045,mats.trim);shutter.rotation.y=side*.10;
      for(let j=0;j<9;j++)box(og,side*(len/2+.17),.12+j*(height-.2)/9,-.027,.23,.018,.012,mats.slab);
     }
    } else {
     const leaf=new THREE.Group();leaf.position.x=-len/2;leaf.rotation.y=-.52;og.add(leaf);
     box(leaf,(len-.07)/2,height/2,0,len-.07,height-.04,.045,len>1.25?mats.glass:mats.wood);
     box(leaf,len-.17,1.0,-.05,.11,.025,.03,mats.metal);
    }
   }
  }
  f.decks.forEach(deck=>{
   let x,z,w,d;if(deck.rect){const a=point(f.id,deck.rect[0],deck.rect[1]),b=point(f.id,deck.rect[2],deck.rect[3]);[x,z]=a;w=b[0]-x;d=b[1]-z;}else [x,z,w,d]=deck.metric;
   const deckMesh=box(g,x+w/2,base-.075,z+d/2,w,.15,d,mats.tile);deckMesh.userData={kind:'deck',name:deck.name,floor:index};
   // Tile joints, restrained enough to keep the wall layout legible.
   const lines=[];for(let ix=x+.6;ix<x+w;ix+=.6)lines.push(ix,base+.022,z,ix,base+.022,z+d);
   for(let iz=z+.6;iz<z+d;iz+=.6)lines.push(x,base+.022,iz,x+w,base+.022,iz);
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));g.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x9e9889,transparent:true,opacity:.35})));
   if(deck.name==='Side access'){
    rail(g,[x+w,z],[x+w,z+d],base,'simple');rail(g,[x,z+d],[x+w,z+d],base,'simple');
    if(index===0){ // Upper side veranda support posts, location inferred from strip corners.
     for(const zz of [z,z+d/2,z+d])box(g,x+w-.07,base+LEVEL/2,zz,.16,LEVEL,.16);
    }
   }
   if(deck.name==='App 4 balcony'){
    rail(g,[x,z],[x+w,z],base);rail(g,[x,z],[x,z+d],base);rail(g,[x+w,z],[x+w,z+d],base);
   }
  });
  const ffront=index===0?point(f.id,1253,352):point(f.id,1300,416);
  const fEnd=index===0?point(f.id,2033,352):point(f.id,2402,416);
  if(index===0){rail(g,ffront,[6.61,ffront[1]],base);rail(g,[9.06,ffront[1]],fEnd,base);}
  else {rail(g,ffront,fEnd,base);}
  // Front gallery columns, inferred only in elevation from direct photographs.
  const colXs=index===0?[3.70,6.35,9.60]:[3.70,7.55,12.71];
  colXs.forEach(x=>box(g,x,base+WALL_HEIGHT/2,-.075,.19,WALL_HEIGHT,.19));
  if(index===0){
   // Shallow curved head under the gallery beam, following photographed terrace arch.
   const xa=6.40,xb=9.50,shape=new THREE.Shape();shape.moveTo(xa,base+2.78);shape.lineTo(xb,base+2.78);shape.lineTo(xb,base+2.06);
   for(let j=0;j<=28;j++){const t=j/28;shape.lineTo(xb-(xb-xa)*t,base+2.06+.51*Math.sin(t*Math.PI));}shape.closePath();
   const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false}),mats.plaster);mesh.position.z=-.15;g.add(mesh);
  }
  for(const [kind,x1,z1,x2,z2,unit] of f.furniture){
   const a=point(f.id,x1,z1),b=point(f.id,x2,z2),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,w=b[0]-a[0],d=b[1]-a[1];
   const fg=new THREE.Group();fg.userData={unit,kind:'furniture',floor:index};g.add(fg);furnishings.push(fg);
   if(kind==='bed'){
    box(fg,x,base+.20,z,w,.30,d,mats.wood);box(fg,x,base+.42,z,w-.04,.20,d-.03,mats.linen);
    box(fg,x,base+.535,z+d*.12,w-.06,.035,d*.67,mats.teal);
    for(const offset of [-.24,.24])box(fg,x+w*offset,base+.57,z-d*.32,w*.43,.13,d*.21,mats.linen);
    box(fg,x,base+.50,z-d/2,w,.80,.075,mats.wood);
   }else if(kind==='sofa'){
    box(fg,x,base+.29,z,w,.46,d,mats.fabric);const long=w>d;
    box(fg,x,base+.70,z-d/2+.07,w,.43,.14,mats.fabric);
    const count=long?3:1;for(let j=0;j<count;j++)box(fg,x-w/2+(j+.5)*w/count,base+.55,z+.04,w/count-.03,.13,d-.18,mats.linen);
   }else if(kind==='table'||kind==='dining'){
    box(fg,x,base+.74,z,w,.07,d,mats.wood);
    for(const sx of [-1,1])for(const sz of [-1,1])box(fg,x+sx*(w/2-.09),base+.36,z+sz*(d/2-.09),.055,.72,.055,mats.metal);
    if(kind==='dining')for(const sx of [-1,1])for(const sz of [-1,1]){
     const cx=x+sx*w*.30,cz=z+sz*(d/2+.24);box(fg,cx,base+.44,cz,.35,.065,.35,mats.trim);box(fg,cx,base+.67,cz+sz*.15,.35,.43,.045,mats.trim);
    }
   }else if(kind==='wardrobe')box(fg,x,base+.90,z,w,1.80,d,mats.wood);
   else if(kind==='counter'){
    box(fg,x,base+.43,z,w,.86,d,mats.trim);box(fg,x,base+.89,z,w+.03,.06,d+.03,mats.wood);box(fg,x,base+.925,z,w*.42,.015,d*.55,mats.metal);
   }else if(kind==='shower'){
    box(fg,x,base+.07,z,w,.14,d,mats.trim);box(fg,x-w/2,base+.95,z,.025,1.9,d,mats.glass);box(fg,x,base+.95,z+d/2,w,1.9,.025,mats.glass);
   }else if(kind==='sink'){
    box(fg,x,base+.40,z,w*.85,.80,d*.85,mats.trim);box(fg,x,base+.84,z,w,.1,d,mats.linen);box(fg,x,base+.90,z,w*.6,.025,d*.55,mats.slab);
   }else if(kind==='toilet'){
    const bowl=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),mats.trim);bowl.scale.set(w/2,.21,d/2);bowl.position.set(x,base+.29,z);fg.add(bowl);box(fg,x,base+.50,z-d*.35,w,.45,d*.25,mats.trim);
   }
  }
 }
 const stairGroup=new THREE.Group();stairGroup.name='External stairs';root.add(stairGroup);
 const stairMeshes=[];
 for(const system of stairs){
  const sg=new THREE.Group();sg.name=system.id;sg.userData={kind:'stairSystem',id:system.id};stairGroup.add(sg);
  for(const flight of system.flights){
   for(let i=0;i<flight.steps;i++){
    const tread=flight.run/flight.steps,height=flight.from+(flight.to-flight.from)*(i+1)/flight.steps;
    const z=flight.z+(flight.direction===1?i+.5:flight.steps-i-.5)*tread;
    const step=box(sg,flight.x+flight.width/2,PLINTH+height/2,z,flight.width,height,tread,mats.tile);step.userData={kind:'stairTread',system:system.id,step:i};stairMeshes.push(step);
   }
   for(const side of [0,flight.width]){
    const z0=flight.direction===1?flight.z:flight.z+flight.run,z1=flight.direction===1?flight.z+flight.run:flight.z;
    bar(sg,[flight.x+side,PLINTH+flight.from+.94,z0],[flight.x+side,PLINTH+flight.to+.94,z1],.035,mats.trim);
    for(let j=0;j<=4;j++){
     const t=j/4,z=z0+(z1-z0)*t,y=PLINTH+flight.from+(flight.to-flight.from)*t;
     bar(sg,[flight.x+side,y,z],[flight.x+side,y+.94,z],.035,mats.trim);
    }
   }
  }
  const [x,z,w,d]=system.landing,landingY=system.id==='paired'?LEVEL/2:LEVEL;
  box(sg,x+w/2,PLINTH+landingY-.09,z+d/2,w,.18,d,mats.tile);
  if(system.id==='paired')rail(sg,[x,z+d],[x+w,z+d],PLINTH+landingY,'simple');
 }
 const e=entranceSteps;
 for(let i=0;i<e.steps;i++){const h=e.rise*(i+1)/e.steps;box(stairGroup,e.x+e.width/2,h/2,e.z+(i+.5)*e.run/e.steps,e.width,h,e.run/e.steps,mats.tile).userData={kind:'entranceStep'};}
 const roof=new THREE.Group();roof.name='Inferred roof';root.add(roof);
 function roofPanel(verts,material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;roof.add(mesh);}
 const eave=PLINTH+LEVEL+WALL_HEIGHT+.13,ridge=eave+1.85;
 roofPanel([[-.30,eave,-.35],[8.30,ridge,-.35],[8.30,ridge,11.45],[-.30,eave,11.45]],mats.roof);
 roofPanel([[8.30,ridge,-.35],[13.10,eave,-.35],[13.10,eave,11.45],[8.30,ridge,11.45]],mats.roof);
 roofPanel([[-.30,eave,11.45],[1.85,eave+.65,11.45],[1.85,eave+.65,15.15],[-.30,eave,15.15]],mats.roof);
 roofPanel([[1.85,eave+.65,11.45],[3.90,eave,11.45],[3.90,eave,15.15],[1.85,eave+.65,15.15]],mats.roof);
 for(const z of [-.12,11.22]){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.10,eave,z,12.87,eave,z,8.30,ridge-.05,z],3));geo.computeVertexNormals();const mat=mats.plaster.clone();mat.side=THREE.DoubleSide;roof.add(new THREE.Mesh(geo,mat));
 }
 for(let z=-.25;z<11.45;z+=.42){bar(roof,[-.3,eave+.01,z],[8.3,ridge+.01,z],.012,mats.roof);bar(roof,[8.3,ridge+.01,z],[13.1,eave+.01,z],.012,mats.roof);}
 bar(roof,[-.3,eave,-.35],[8.3,ridge,-.35],.055,mats.trim);bar(roof,[8.3,ridge,-.35],[13.1,eave,-.35],.055,mats.trim);
 box(roof,8.3,eave+.73,-.145,.62,.77,.06,mats.trim);
 for(let j=0;j<9;j++)box(roof,8.3,eave+.43+j*.065,-.185,.49,.025,.025,mats.slab);
 return {root,floorGroups,walls,openings,floorSurfaces,pickables,furnishings,roof,stairGroup,stairMeshes,mats};
}
