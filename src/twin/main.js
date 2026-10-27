import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildBuilding} from './model.js';
import {floors,units,point,anchors,PLINTH,LEVEL} from './model-data.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const assets=import.meta.glob('./assets/*',{eager:true,query:'?url',import:'default'});
const asset=name=>assets[`./assets/${name}`] || `${import.meta.env.BASE_URL}photos/web/${name}`;
const interpretationURL=new URL('./plan-interpretation.md',import.meta.url).href;
const validationURLs=[new URL('./validation/ground-overlay.png',import.meta.url).href,new URL('./validation/upper-overlay.png',import.meta.url).href];
const photoNames=['414970668.jpg','20210720_171634.jpg','20210720_171929.jpg','20210810_184724.jpg','app1-terrace.jpg','app1-bedroom.jpg','app1-livingroom.jpg','app1-kitchen.jpg','app1-bathroom.jpg','app2-terrace.jpg','app2-terrace2.jpg','app2-livingroom.jpg','app2-bathroom.jpg','app3-entrance.jpg','driveway.jpg','grillarea.jpg'];
const captions=['Front façade & gate number 60','Front façade, garden & roof','Front terrace & straight stair','Façade with awnings','App 1 · terrace','App 1 · bedroom','App 1 · living room','App 1 · kitchen','App 1 · bathroom','App 2 · terrace','App 2 · terrace glazing','App 2 · living room','App 2 · bathroom','App 3 · entrance veranda','Driveway & garage','Grill area'];
let sourceFloor=0,tab='plans';
function showLibrary(nextTab='plans',floor=sourceFloor){tab=nextTab;sourceFloor=floor;renderLibrary();if(!$('#library').open)$('#library').showModal();}
function renderLibrary(){
 $$('.library-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 const content=$('#library-content');
 if(tab==='plans'){
  const f=floors[sourceFloor],owner=sourceFloor?'upper floor.png':'ground floor.png';
  content.innerHTML=`<div class="plans-layout"><div class="plan-nav">${floors.map((p,i)=>`<button data-source-floor="${i}" class="${i===sourceFloor?'active':''}">${p.name}<small>${p.title} · PDF page 1</small></button>`).join('')}<p>Priority 1 · Architectural evidence<br><br>Complete upright images. Owner images show the same sheets rotated 180°. No compass direction is established.</p></div><div><div class="source-links"><a href="${asset(f.pdf)}" target="_blank" rel="noopener">Original PDF · page 1 ↗</a><a href="${asset(f.image)}" target="_blank" rel="noopener">Full-resolution page ↗</a><a href="${asset(owner)}" target="_blank" rel="noopener">Owner PNG ↗</a><label>Zoom <select id="source-zoom"><option value="100">Fit</option><option value="175">175%</option><option value="250">250%</option></select></label></div><div class="plan-image-wrap"><img id="plan-image" src="${asset(f.image)}" alt="Complete ${f.title} plan, ${f.pdf}, page 1, showing apartment labels, dimension chains, openings and two external staircase systems"></div><p class="image-caption">${f.pdf} · page 1 → ${f.image} · 3508 × 2481 pixels, 300 DPI. No date or revision visible.</p></div></div>`;
  $$('[data-source-floor]').forEach(b=>b.onclick=()=>{sourceFloor=Number(b.dataset.sourceFloor);renderLibrary();});
  $('#source-zoom').onchange=e=>$('#plan-image').style.width=`${e.target.value}%`;
 }else if(tab==='photos'){
  content.innerHTML=`<p class="image-caption">Priority 3 · Sixteen supplied photographs. Click to open a photo. Filename associations do not override drawing geometry.</p><div class="photo-grid">${photoNames.map((name,i)=>`<a href="${asset(name)}" target="_blank" rel="noopener"><img src="${asset(name)}" alt="${captions[i]}" loading="lazy"><small>${captions[i]}</small></a>`).join('')}</div>`;
 }else{
  content.innerHTML=`<article class="library-note"><span class="eyebrow">A PROVISIONAL RECONSTRUCTION</span><h3>The drawings come first.</h3><p>The two architectural sheets govern the footprint, floor-specific partitions, openings and stair positions. Photographs supply the warm stucco, white shutters, rails and roof appearance. No external websites were used.</p><h3>What is known</h3><p>The ground sheet labels App 1, App 5 and Garaža; the upper sheet labels App 2, App 3 and App 4. Each shows two external stair systems: one straight and one paired. Ground entrance steps are separate.</p><h3>What remains uncertain</h3><ul><li>The upper sheet places 12.71 over the right block, whose lower width is 9.01. Its terrace also carries 10.00. The model retains the shared wall alignment and ground frontage, with this conflict unresolved.</li><li>The right access strips are marked 8.33 m ground and 9.03 m upper. Their different front edges are preserved.</li><li>Floor-to-floor height (3.05 m), roof pitch, opening heights and vertical stair dimensions are inferred; no section or elevation was supplied.</li><li>The owner calls App 5 a caretaker room, while the plan shows bedroom, kitchen and bathroom. App 4 has a different layout from App 3 despite the textual similarity.</li><li>The address is 60 on the drawing titles and photographed gate; a background URL says 608.</li></ul><h3>Read the full record</h3><p><a href="${interpretationURL}" target="_blank" rel="noopener">Open plan interpretation & validation ↗</a></p><p>Analytical mesh projections: <a href="${validationURLs[0]}" target="_blank" rel="noopener">ground overlay ↗</a> · <a href="${validationURLs[1]}" target="_blank" rel="noopener">upper overlay ↗</a>. These are not browser screenshots.</p><p>Traceable geometry, source mappings, calibration, conflicts and validation limitations are documented in the deliverable. Model units are metres; drawing top is not compass north. Owner apartment areas are descriptive figures, not dimensions.</p></article>`;
 }
}
$('#sources').onclick=()=>showLibrary();$('#read-notes').onclick=()=>showLibrary('notes');$('#assumptions').onclick=()=>showLibrary('notes');
$('#close-library').onclick=()=>$('#library').close();$$('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderLibrary();});
$('#help').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();
$$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));

try { init(); } catch(error){
 console.error(error);$('#loading').hidden=true;$('#graphics-error').hidden=false;
 $('#graphics-error').textContent='The 3D viewer could not initialize graphics. Enable WebGL in your browser and reload. The source library and interpretation remain available. '+error.message;
}
function init(){
 if(new URLSearchParams(location.search).has('nogl'))throw new Error('3D disabled with ?nogl');
 const container=$('#scene'),scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 container.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D Napros model. Arrow keys orbit; plus and minus zoom. Press question mark for controls.');
 const perspective=new THREE.PerspectiveCamera(38,1,.1,150),ortho=new THREE.OrthographicCamera(-12,12,12,-12,.1,150);
 let camera=perspective,controls,frame=0,selected=null,currentFloor='all',roofVisible=true,cutaway=false,furnitureVisible=true,currentView='perspective',comparing=false,comparison=null,perspectiveFit=1;
 const model=buildBuilding();scene.add(model.root);
 scene.add(new THREE.HemisphereLight(0xffffff,0xc5c4b2,2.7));
 const sun=new THREE.DirectionalLight(0xfff3d9,3.0);sun.position.set(-9,26,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-21;sun.shadow.camera.right=21;sun.shadow.camera.top=21;sun.shadow.camera.bottom=-21;sun.shadow.normalBias=.04;sun.shadow.bias=-.0003;scene.add(sun);sun.target.position.set(6,0,6);scene.add(sun.target);
 const site=new THREE.Group();scene.add(site);
 const pad=new THREE.Mesh(new THREE.BoxGeometry(22,.14,24),new THREE.MeshStandardMaterial({color:0xe0dfd0,roughness:1}));pad.position.set(6.7,-.09,6.0);pad.receiveShadow=true;site.add(pad);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-.17;scene.add(ground);
 const paving=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.0),new THREE.MeshStandardMaterial({color:0xd0d0bd,roughness:1}));paving.rotation.x=-Math.PI/2;paving.position.set(1.9,-.013,-2.1);paving.receiveShadow=true;site.add(paving);
 for(const [x,z,s] of [[-2.2,-2,1],[16.6,8,.8],[-2.1,13,.85]]){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.13,1.8,8),new THREE.MeshStandardMaterial({color:0x91856b}));trunk.position.set(x,.9,z);site.add(trunk);
  const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05*s,2),new THREE.MeshStandardMaterial({color:0x91a184,roughness:1,flatShading:true}));foliage.scale.y=1.35;foliage.position.set(x,2.1*s,z);foliage.castShadow=true;site.add(foliage);
 }
 const labelElements={};for(const [id,u] of Object.entries(units)){
  const el=document.createElement('button');el.className='model-label';el.textContent=u.label;el.setAttribute('aria-label',`Inspect ${u.name}`);el.onclick=()=>selectUnit(id);$('#labels').append(el);labelElements[id]=el;
 }
 function invalidate(){if(!document.hidden&&!frame)frame=requestAnimationFrame(draw);}
 function attachControls(target=new THREE.Vector3(6.5,2.7,6.4)){
  controls?.dispose();controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=false;controls.minDistance=10;controls.maxDistance=70;controls.minZoom=.45;controls.maxZoom=3.5;controls.maxPolarAngle=Math.PI*.48;controls.addEventListener('change',invalidate);controls.update();
 }
 function resize(){
  const width=container.clientWidth,height=container.clientHeight;renderer.setSize(width,height);perspective.aspect=width/height;perspective.updateProjectionMatrix();
  const aspect=width/height;
  // Preserve user zoom while fitting the whole house into a narrow viewport.
  if(camera===perspective){
   const fit=Math.max(1,1/aspect);controls.maxDistance=70*fit;
   camera.position.sub(controls.target).multiplyScalar(fit/perspectiveFit).add(controls.target);perspectiveFit=fit;controls.update();
  }
  const fitWidth=currentView==='front'?18.5:19.2,fitHeight=currentView==='front'?11.0:20.0;
  const halfHeight=Math.max(fitHeight/2,fitWidth/(2*aspect));ortho.left=-halfHeight*aspect;ortho.right=-ortho.left;ortho.top=halfHeight;ortho.bottom=-halfHeight;ortho.updateProjectionMatrix();invalidate();
 }
 function setView(view){
  currentView=view;const target=new THREE.Vector3(6.6,view==='overhead'?0:3.0,6.2);camera=view==='perspective'?perspective:ortho;
  camera.up.set(0,1,0);camera.zoom=1;
  if(view==='overhead'){camera.position.set(7.2,45,6.3);camera.up.set(0,0,-1);target.set(7.2,0,6.3);}
  else if(view==='front'){camera.position.set(6.6,4,-35);target.set(6.6,4,0);}
  else {camera.position.set(-20,20,-25);perspectiveFit=1;}
  attachControls(target);$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));resize();
 }
 function applyState(){
  model.floorGroups.forEach((g,i)=>g.visible=currentFloor==='all'||String(i)===currentFloor);
  model.roof.visible=roofVisible&&!cutaway&&!comparing&&currentFloor==='all';
  model.walls.forEach(mesh=>{
   const {base,bottom,top}=mesh.userData,limit=cutaway||comparing?1.00:Infinity,height=Math.max(0,Math.min(top,limit)-bottom);
   mesh.visible=height>0;mesh.scale.y=height/(top-bottom);mesh.position.y=base+bottom+height/2;
  });
  model.openings.forEach(g=>g.visible=!cutaway&&!comparing);
  model.furnishings.forEach(g=>g.visible=furnitureVisible&&!comparing);
  model.floorSurfaces.forEach(mesh=>{mesh.material.color.copy(mesh.userData.originalColor);if(selected){if(mesh.userData.unit===selected)mesh.material.color.set(units[selected].color).lerp(new THREE.Color(0xf7f0db),.28);else mesh.material.color.lerp(new THREE.Color(0xeee9de),.72);}});
  $('#roof').setAttribute('aria-pressed',String(roofVisible));$('#roof .toggle').classList.toggle('on',roofVisible);
  $('#cutaway').setAttribute('aria-pressed',String(cutaway));$('#cutaway .toggle').classList.toggle('on',cutaway);
  $('#furniture').setAttribute('aria-pressed',String(furnitureVisible));$('#furniture .toggle').classList.toggle('on',furnitureVisible);
  $$('[data-floor]').forEach(b=>b.classList.toggle('active',b.dataset.floor===currentFloor));
  $$('.space-card').forEach(b=>b.classList.toggle('active',b.dataset.unit===(selected||'all')));
  $('#scene-title').textContent=selected?units[selected].name:currentFloor==='all'?'Entire building':floors[Number(currentFloor)].name;
  if(comparing)createComparison();invalidate();
 }
 function selectUnit(id){
  if(id==='all'){selected=null;currentFloor='all';roofVisible=true;cutaway=false;if(comparing)endComparison();$('#selection').hidden=true;}
  else {selected=id;currentFloor=String(units[id].floor);cutaway=true;roofVisible=false;$('#selection').hidden=comparing;
   const u=units[id];$('#unit-source').textContent=u.source;$('#unit-name').textContent=u.name;$('#unit-area').textContent=u.area.includes('m²')?`${u.area} · owner supplied`:`Area · ${u.area.toLowerCase()}`;$('#unit-description').textContent=u.description;$('#unit-note').textContent=u.note;
  }
  applyState();
 }
 function setFloor(floor){
  currentFloor=floor;if(floor!=='all')roofVisible=false;
  if(selected&&String(units[selected].floor)!==floor){selected=null;$('#selection').hidden=true;}
  if(comparing&&floor==='all')currentFloor='0';
  applyState();
 }
 function draw(){frame=0;if(document.hidden)return;
  renderer.render(scene,camera);
  for(const [id,el] of Object.entries(labelElements)){
   const u=units[id],visible=!comparing&&(currentFloor==='all'?u.floor===1:String(u.floor)===currentFloor);
   el.hidden=!visible;if(!visible)continue;
   const p=new THREE.Vector3(u.position[0],PLINTH+u.floor*LEVEL+(cutaway?1.13:2.9),u.position[1]).project(camera);
   el.style.left=`${(p.x*.5+.5)*container.clientWidth}px`;el.style.top=`${(-p.y*.5+.5)*container.clientHeight}px`;el.classList.toggle('selected',id===selected);el.hidden=p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1;
  }
 }
 const textureLoader=new THREE.TextureLoader(),planTextures=new Map();
 function createComparison(){
  if(comparison){scene.remove(comparison);comparison.geometry.dispose();comparison.material.dispose();comparison=null;}
  const idx=Number(currentFloor),f=floors[idx],a=anchors[f.id];let texture=planTextures.get(idx);
  if(!texture){texture=textureLoader.load(asset(f.image),invalidate,undefined,()=>{$('#compare-source').textContent='Source image could not load. Open it in the source library.';});texture.colorSpace=THREE.SRGBColorSpace;planTextures.set(idx,texture);}
  // Subdivide at the calibration anchors, so reference pixels and model geometry share the same map.
  const xs=[0,...a.x.map(v=>v[0]),3508],zs=[0,...a.z.map(v=>v[0]),2481],positions=[],uvs=[],indices=[];
  zs.forEach(z=>xs.forEach(x=>{const p=point(f.id,x,z);positions.push(p[0],PLINTH+idx*LEVEL+1.08,p[1]);uvs.push(x/3508,1-z/2481);}));
  for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){const k=j*xs.length+i;indices.push(k,k+xs.length,k+1,k+1,k+xs.length,k+xs.length+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  comparison=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:Number($('#opacity').value)/100,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));comparison.renderOrder=100;scene.add(comparison);
  $('#compare-source').textContent=`${f.name} · ${f.pdf} · page 1`;
 }
 function startComparison(){comparing=true;if(currentFloor==='all')currentFloor='0';$('#compare-panel').hidden=false;$('#selection').hidden=true;setView('overhead');applyState();}
 function endComparison(){comparing=false;if(comparison){scene.remove(comparison);comparison.geometry.dispose();comparison.material.dispose();comparison=null;}$('#compare-panel').hidden=true;$('#selection').hidden=!selected;applyState();}
 function zoom(factor){if(camera.isPerspectiveCamera){const delta=camera.position.clone().sub(controls.target).multiplyScalar(factor);delta.setLength(THREE.MathUtils.clamp(delta.length(),10,70*perspectiveFit));camera.position.copy(controls.target).add(delta);}else{camera.zoom=THREE.MathUtils.clamp(camera.zoom/factor,.45,3.5);camera.updateProjectionMatrix();}controls.update();invalidate();}
 $$('.space-card').forEach(b=>b.onclick=()=>{selectUnit(b.dataset.unit);if(window.innerWidth<=580)$('.viewport').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});$$('[data-floor]').forEach(b=>b.onclick=()=>setFloor(b.dataset.floor));
 $$('[data-view]').forEach(b=>b.onclick=()=>{if(comparing&&b.dataset.view!=='overhead')endComparison();setView(b.dataset.view);});
 $('#roof').onclick=()=>{if(comparing)endComparison();roofVisible=!roofVisible;if(roofVisible){cutaway=false;setFloor('all');}applyState();};
 $('#cutaway').onclick=()=>{cutaway=!cutaway;if(cutaway)roofVisible=false;applyState();};
 $('#furniture').onclick=()=>{furnitureVisible=!furnitureVisible;applyState();};$('#clear-selection').onclick=()=>selectUnit('all');
 $('#unit-plan').onclick=()=>showLibrary('plans',units[selected].floor);
 $('#compare').onclick=()=>comparing?endComparison():startComparison();$('#close-compare').onclick=endComparison;
 $('#opacity').oninput=()=>{if(comparison)comparison.material.opacity=Number($('#opacity').value)/100;$('#opacity-value').textContent=`${$('#opacity').value}%`;invalidate();};
 $('#zoom-in').onclick=()=>zoom(.85);$('#zoom-out').onclick=()=>zoom(1.18);$('#reset').onclick=()=>{if(comparing)endComparison();selectUnit('all');setView('perspective');};
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5||comparing)return;
  const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(model.pickables.filter(m=>m.parent.visible));if(hits.length)selectUnit(hits[0].object.userData.unit);
 });
 document.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,textarea')||$('#library').open||$('#help-dialog').open)return;
  const key=e.key.toLowerCase();
  if(['+','=','-','1','2','3','f','r','c','s','?','escape'].includes(key)){
   if(key==='+'||key==='=')zoom(.85);if(key==='-')zoom(1.18);
   if(['1','2','3'].includes(key)){if(comparing&&key!=='2')endComparison();setView({'1':'front','2':'overhead','3':'perspective'}[key]);}
   if(key==='f')setFloor(currentFloor==='all'?'0':currentFloor==='0'?'1':'all');
   if(key==='r')$('#roof').click();if(key==='c')$('#cutaway').click();if(key==='s')showLibrary();if(key==='?')$('#help-dialog').showModal();if(key==='escape'){if(comparing)endComparison();else selectUnit('all');}e.preventDefault();
  }
  if(e.target===renderer.domElement&&e.key.startsWith('Arrow')){
   const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);
   if(e.key==='ArrowLeft')spherical.theta-=.09;if(e.key==='ArrowRight')spherical.theta+=.09;if(e.key==='ArrowUp')spherical.phi-=.07;if(e.key==='ArrowDown')spherical.phi+=.07;
   spherical.phi=THREE.MathUtils.clamp(spherical.phi,.02,Math.PI*.48);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();invalidate();e.preventDefault();
  }
 });
 new ResizeObserver(resize).observe(container);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;$('#graphics-error').hidden=false;$('#graphics-error').textContent='The graphics context was lost. Reload to restore the 3D model. Source drawings remain available.';});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{$('#graphics-error').hidden=true;invalidate();});
 setView('perspective');applyState();$('#loading').hidden=true;
 // Read-only diagnostics for inspection; no animation loop or background polling.
 window.napros={model,scene,renderer,get camera(){return camera;},get state(){return {selected,currentFloor,roofVisible,cutaway,currentView,comparing};},setFloor,setView,selectUnit,startComparison};
}
