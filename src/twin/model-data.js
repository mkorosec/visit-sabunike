// All pixel coordinates refer to complete 3508 × 2481 page-1 renderings.
// X follows drawing right; Z follows drawing down. No compass rotation.
export const LEVEL = 3.05;
export const PLINTH = 0.42;
export const WALL_HEIGHT = 2.78;
export const anchors = {
  ground: {x:[[759,0],[1253,3.70],[2440,12.71]], z:[[362,0],[731,2.78],[1372,7.578093306288],[1832,11.11],[2325,14.84]]},
  upper: {x:[[840,0],[1300,3.70],[2402,12.71]], z:[[425,0],[681,2.08],[1800,11.11],[2249,14.84]]}
};
export function interpolate(v, list) {
  let i=list.findIndex(([p])=>p>=v); if(i<0)i=list.length-1; else if(i===0)i=1;
  const [a,b]=[list[i-1],list[i]];
  return a[1]+(v-a[0])/(b[0]-a[0])*(b[1]-a[1]);
}
export function point(floor,x,z){const a=anchors[floor];return [interpolate(x,a.x),interpolate(z,a.z)];}
// Opening endpoints are traced along the wall. Sill/head are inferred elevations.
const d=(a,b)=>({a,b,kind:'door',sill:0,head:2.12});
const w=(a,b)=>({a,b,kind:'window',sill:.90,head:2.12});
const h=(id,x1,x2,z,openings=[],unit='')=>({id,a:[x1,z],b:[x2,z],openings,unit});
const v=(id,x,z1,z2,openings=[],unit='')=>({id,a:[x,z1],b:[x,z2],openings,unit});
export const units={
  app1:{name:'Apartment 1',label:'App 1',floor:0,color:'#be995e',area:'68 m²',position:[9.0,6.6],description:'Two rear bedrooms, a large living room, front terrace and a separate front kitchen. Bathroom beside the side entrance.',source:'12.Etaža1.pdf · p. 1',note:'Area is owner supplied. The plan governs the walls and openings.'},
  app2:{name:'Apartment 2',label:'App 2',floor:1,color:'#c69f58',area:'57 m²',position:[9.0,5.8],description:'Two bedrooms beside the living and dining space. Front terrace, kitchen and a bathroom at the front right.',source:'11.Etaža2.pdf · p. 1',note:'The front terrace is shallower here than on the ground sheet.'},
  app3:{name:'Apartment 3',label:'App 3',floor:1,color:'#bf8181',area:'46 m²',position:[9.0,9.45],description:'Rear apartment with a bedroom to the left, living and dining area to the right, and an inset bathroom.',source:'11.Etaža2.pdf · p. 1',note:'A separate kitchen fixture is not clear on this sheet; no extra partition is invented.'},
  app4:{name:'Apartment 4',label:'App 4',floor:1,color:'#6c9b9b',area:'Unspecified',position:[1.6,7.0],description:'Long left wing: front bedroom, living and kitchen space, glazed recess, rear entrance and rear bathroom. Small front balcony.',source:'11.Etaža2.pdf · p. 1',note:'The drawing differs from the owner’s “similar to Apartment 3” description.'},
  app5:{name:'Apartment 5',label:'App 5',floor:0,color:'#bf8181',area:'Unspecified',position:[1.7,11.8],description:'Rear left wing with a bedroom, cooking and entry area, and a separate bathroom.',source:'12.Etaža1.pdf · p. 1',note:'The owner calls this a caretaker room. The architectural sheet labels it App 5 and shows a self-contained layout.'},
  garage:{name:'Garage',label:'Garaža',floor:0,color:'#6c9b9b',area:'Plan label',position:[1.7,3.1],description:'Front left garage with double doors to the front façade. Kept as a garage, as drawn.',source:'12.Etaža1.pdf · p. 1',note:'The upper left wing has a different layout and is not a copy of this floor.'}
};
export const floors=[{
  id:'ground',name:'Ground floor',title:'Pritličje',image:'ground-floor-page-1.png',pdf:'12.Etaža1.pdf',
  outline:[[748,352],[2449,352],[2449,1841],[1261,1841],[1261,2334],[748,2334]],
  walls:[
    v('g-left',748,352,2334),h('g-garage-front',748,1246,352,[d(865,1149)],'garage'),
    v('g-wing-divider',1246,352,1841),v('g-wing-rear-right',1261,1841,2334,[d(1882,1975)],'app5'),
    h('g-garage-rear',748,1246,1332,[],'garage'),h('g-app5-bedroom',748,1261,1782,[d(842,935)],'app5'),
    h('g-app5-bath',748,1261,2046,[d(1084,1177)],'app5'),h('g-wing-rear',748,1261,2334,[],'app5'),
    h('g-kitchen-front',2033,2449,352,[w(2192,2309)],'app1'),
    v('g-right',2449,352,1841,[d(1198,1291)],'app1'),
    h('g-main-rear',1246,2449,1841,[w(1506,1624),w(2101,2218)],'app1'),
    h('g-bedroom-front',1246,2449,1372,[d(1687,1780),d(1965,2058)],'app1'),
    v('g-bedroom-divider',1884,1372,1841,[],'app1'),
    h('g-terrace-divider',1246,2449,736,[d(1407,1617),w(1783,1901),w(2147,2253)],'app1'),
    v('g-front-kitchen-divider',2040,352,736,[d(572,665)],'app1'),
    v('g-bath-left',2043,736,1134,[],'app1'),h('g-bath-bottom',2043,2449,1134,[d(2080,2173)],'app1')
  ],
  regions:[
    {unit:'garage',poly:[[759,362],[1239,362],[1239,1326],[759,1326]],kind:'garage'},
    {unit:'app5',poly:[[759,1339],[1241,1339],[1241,1841],[1252,1841],[1252,2325],[759,2325]],kind:'tile'},
    {unit:'app1',poly:[[1253,362],[2440,362],[2440,1832],[1253,1832]],kind:'tile'}
  ],
  decks:[{name:'Front terrace',rect:[1253,362,2033,731],unit:'app1'}, {name:'Side access',metric:[12.85,2.78,2.22,8.33]}],
  // Fittings follow the drawing symbols; sizes below are traced rectangle bounds.
  furniture:[
    ['bed',900,1365,1140,1640,'app5'],['counter',770,1935,1015,2027,'app5'],['shower',770,2200,880,2310,'app5'],['sink',985,2218,1070,2300,'app5'],['toilet',795,2070,850,2150,'app5'],
    ['bed',1480,1525,1718,1802,'app1'],['bed',2145,1487,2420,1727,'app1'],
    ['wardrobe',1263,1450,1320,1790,'app1'],['wardrobe',1900,1480,1960,1790,'app1'],
    ['sofa',1270,1190,1635,1310,'app1'],['sofa',1265,955,1370,1160,'app1'],['table',1410,990,1515,1150,'app1'],
    ['counter',2340,375,2430,722,'app1'],['counter',2057,375,2135,555,'app1'],
    ['dining',1340,440,1560,580,'app1'],['shower',2310,756,2420,850,'app1'],['sink',2150,755,2240,820,'app1'],['toilet',2340,880,2410,935,'app1']
  ]
},{
  id:'upper',name:'Upper floor',title:'Etaža',image:'upper-floor-page-1.png',pdf:'11.Etaža2.pdf',
  outline:[[831,416],[2410,416],[2410,1800],[1307,1800],[1307,2258],[831,2258]],
  walls:[
    v('u-left',831,416,2258,[w(1162,1271),w(1473,1582),w(1773,1882)],'app4'),
    h('u-wing-front',831,1294,416,[w(1024,1172)],'app4'),h('u-app4-bedroom',831,1294,922,[d(1116,1203)],'app4'),
    v('u-wing-divider-top',1294,416,1187,[],'app4'),v('u-wing-divider-bottom',1294,1296,1800,[],'app4'),
    // Three glazed sides of the source recess; shared divider glazing closes the fourth.
    h('u-recess-top',1155,1294,1155,[w(1175,1285)],'app4'),
    v('u-recess-left',1155,1155,1340,[w(1187,1296)],'app4'),
    h('u-recess-bottom',1155,1294,1340,[w(1175,1285)],'app4'),
    v('u-recess-right',1294,1187,1296,[w(1187,1296)],'app4'),
    h('u-kitchen-return',831,1100,1728,[],'app4'),
    v('u-wing-rear-right',1307,1800,2258,[d(1885,1972)],'app4'),
    h('u-app4-bath',831,1307,1980,[d(1095,1180)],'app4'),h('u-wing-rear',831,1307,2258,[w(1078,1187)],'app4'),
    v('u-right',2410,416,1800,[d(1244,1330),d(1492,1578),w(1640,1749)]),
    h('u-main-rear',1294,2410,1800,[w(1442,1551),w(1894,2003)]),
    h('u-front-divider',1294,2410,687,[w(1448,1557),d(1799,1993),w(2283,2393)],'app2'),
    v('u-bedroom-divider',1713,687,1800,[d(791,878),d(1135,1222),d(1542,1629)]),
    h('u-app2-bedroom-mid',1294,1713,1095,[],'app2'),
    h('u-app2-app3',1294,2410,1443),
    v('u-app2-bath-left',2143,687,1046,[],'app2'),h('u-app2-bath-bottom',2143,2410,1046,[d(2230,2313)],'app2'),
    v('u-app3-bath-left',2127,1622,1800,[],'app3'),h('u-app3-bath-top',2127,2410,1622,[d(2304,2387)],'app3')
  ],
  regions:[
    {unit:'app4',poly:[[840,425],[1288,425],[1288,2250],[840,2250]],kind:'tile'},
    {unit:'app2',poly:[[1300,425],[2402,425],[2402,1437],[1300,1437]],kind:'tile'},
    {unit:'app3',poly:[[1300,1449],[2402,1449],[2402,1791],[1300,1791]],kind:'tile'}
  ],
  decks:[{name:'Front terrace',rect:[1300,425,2402,681],unit:'app2'}, {name:'Side access',metric:[12.85,2.08,2.22,9.03]}, {name:'App 4 balcony',metric:[-.03,-1.16,3.78,1.10],unit:'app4'}],
  furniture:[
    ['bed',857,505,1100,730,'app4'],['wardrobe',850,840,1030,895,'app4'],['sofa',855,962,950,1150,'app4'],
    ['counter',853,1630,1090,1715,'app4'],['sofa',855,1745,1040,1850,'app4'],['shower',854,2010,946,2110,'app4'],['sink',850,2155,930,2230,'app4'],['toilet',1000,2170,1060,2230,'app4'],
    ['bed',1310,775,1570,1000,'app2'],['bed',1310,1145,1570,1369,'app2'],['wardrobe',1642,905,1695,1070,'app2'],
    ['counter',2045,700,2132,1040,'app2'],['dining',1800,1230,2005,1380,'app2'],['dining',2145,475,2355,620,'app2'],['shower',2157,710,2265,819,'app2'],['sink',2160,860,2225,940,'app2'],['toilet',2320,720,2380,780,'app2'],
    ['bed',1315,1510,1575,1735,'app3'],['wardrobe',1640,1650,1698,1780,'app3'],['dining',1778,1470,1940,1570,'app3'],['sofa',1765,1690,1950,1780,'app3'],['shower',2142,1680,2240,1777,'app3'],['sink',2300,1700,2370,1760,'app3'],['toilet',2155,1635,2220,1685,'app3']
  ]
}];
export const stairs=[
  {id:'straight',name:'Straight external stair',flights:[{x:14.00,z:-1.95,width:1.12,run:4.03,steps:20,from:0,to:LEVEL,direction:1}],landing:[14.00,2.08,1.12,.58],floor:'both'},
  {id:'paired',name:'Paired external stair',flights:[{x:5.05,z:11.60,width:.82,run:2.34,steps:9,from:0,to:LEVEL/2,direction:1},{x:3.88,z:11.60,width:.82,run:2.34,steps:9,from:LEVEL/2,to:LEVEL,direction:-1}],landing:[3.88,13.94,1.99,.91],floor:'both'}
];
export const entranceSteps={x:6.61,z:-.76,width:2.45,run:.76,steps:3,rise:PLINTH};
export function wallSegments(floor,wall){
  const horizontal=wall.a[1]===wall.b[1];
  const [start,end]=horizontal?[wall.a[0],wall.b[0]]:[wall.a[1],wall.b[1]];
  const at=n=>horizontal?point(floor,n,wall.a[1]):point(floor,wall.a[0],n);
  let cursor=start;const pieces=[];
  for(const opening of [...wall.openings].sort((a,b)=>a.a-b.a)){
    if(opening.a>cursor)pieces.push({a:at(cursor),b:at(opening.a),bottom:0,top:WALL_HEIGHT});
    if(opening.sill>0)pieces.push({a:at(opening.a),b:at(opening.b),bottom:0,top:opening.sill});
    pieces.push({a:at(opening.a),b:at(opening.b),bottom:opening.head,top:WALL_HEIGHT});cursor=opening.b;
  }
  if(cursor<end)pieces.push({a:at(cursor),b:at(end),bottom:0,top:WALL_HEIGHT});
  return pieces;
}
