import {LIBRARY_BOOKS} from '../world/library';
import media from '../world/media-catalog.json';
export type AssetCategory = "CHARACTERS" | "COLLECTIBLES" | "WEAPONS" | "VEHICLES" | "PROPS" | "BUILDINGS" | "ANATOMY" | "NATURE" | "LIBRARY" | "IMAGES";

export type SiteAsset = {
  id: string;
  label: string;
  category: AssetCategory;
  builder: "alien" | "shared-prop" | "sandbox" | "world" | "image";
  model?:string;url?:string;
  source: string;
  character?: "zix" | "pip" | "vex" | "pongo";
  prop?: "rat-meat" | "rat-meat-gold" | "yoohoo" | "banana" | "oil-drum" | "penguin";
  sandbox?: "vehicle" | "jetpack" | "ak47" | "revolver" | "bow" | "arrow" | "pepsi" | "yoohoo" | "monster" | "rat-meat" | "biplane" | "penguin" | "bongo";
  scale?: number;
};

/**
 * The canonical inventory for the Assets Room. New Blender replacements can
 * keep these stable IDs while their builders or model URLs change underneath.
 */
export const SITE_ASSETS: SiteAsset[] = [
  {id:"can001-ratmeat-glb",label:"Can001 — original Rat Meat GLB",category:"COLLECTIBLES",builder:"world",model:"glb:/models/urf-can-ratmeat.glb",source:"GitHub original model file"},
  {id:"can002-yoohoo-glb",label:"Can002 — original Yoo-hoo GLB",category:"COLLECTIBLES",builder:"world",model:"glb:/models/urf-can-yoohoo.glb",source:"GitHub original model file"},
  { id:"goopy", label:"Goopy", category:"CHARACTERS", builder:"alien", character:"zix", source:"Alien Game", scale:.9 },
  { id:"doopy", label:"Doopy", category:"CHARACTERS", builder:"alien", character:"pip", source:"Alien Game", scale:.82 },
  { id:"doorp", label:"Doorp", category:"CHARACTERS", builder:"alien", character:"vex", source:"Alien Game", scale:.9 },
  { id:"tongo001", label:"Tongo001 — original alien-game Pongo", category:"CHARACTERS", builder:"alien", character:"pongo", source:"Home + Alien Game", scale:.85 },
  { id:"penguin", label:"Penguin", category:"CHARACTERS", builder:"shared-prop", prop:"penguin", source:"Penguin Town", scale:1.1 },
  { id:"rat-meat", label:"Rat Meat Can", category:"COLLECTIBLES", builder:"shared-prop", prop:"rat-meat", source:"Site Economy" },
  { id:"rat-meat-gold", label:"Gold Rat Meat", category:"COLLECTIBLES", builder:"shared-prop", prop:"rat-meat-gold", source:"Site Economy" },
  { id:"yoohoo", label:"Yoo-hoo", category:"COLLECTIBLES", builder:"shared-prop", prop:"yoohoo", source:"Yoo-hoo Room" },
  { id:"pepsi", label:"Pepsi Ammo", category:"COLLECTIBLES", builder:"sandbox", sandbox:"pepsi", source:"Alien Game" },
  { id:"monster", label:"Monster Can", category:"COLLECTIBLES", builder:"sandbox", sandbox:"monster", source:"Alien Game" },
  { id:"banana", label:"Banana", category:"COLLECTIBLES", builder:"shared-prop", prop:"banana", source:"Bongo Lab" },
  { id:"revolver", label:"Revolver", category:"WEAPONS", builder:"sandbox", sandbox:"revolver", source:"Alien Game", scale:1.4 },
  { id:"ak47", label:"AK-47", category:"WEAPONS", builder:"sandbox", sandbox:"ak47", source:"Alien Game", scale:1.25 },
  { id:"bow", label:"Bow", category:"WEAPONS", builder:"sandbox", sandbox:"bow", source:"Urf Archer", scale:1.1 },
  { id:"arrow", label:"Arrow", category:"WEAPONS", builder:"sandbox", sandbox:"arrow", source:"Urf Archer", scale:.9 },
  { id:"biplane", label:"Penguin Biplane", category:"VEHICLES", builder:"sandbox", sandbox:"biplane", source:"Penguin Town", scale:.55 },
  { id:"urf-rover", label:"Urf Rover", category:"VEHICLES", builder:"sandbox", sandbox:"vehicle", source:"HexTrip", scale:.65 },
  { id:"jetpack", label:"Jetpack", category:"PROPS", builder:"sandbox", sandbox:"jetpack", source:"Alien Game", scale:.85 },
  { id:"oil-drum", label:"Oil Drum", category:"PROPS", builder:"shared-prop", prop:"oil-drum", source:"Planet Urf" },
  { id:"zongo001", label:"Zongo001 — original ragdoll", category:"PROPS", builder:"world", model:"sandbox-old:bongo", source:"Original assets room", scale:.75 },
  ...[{"id":"pongo","label":"Pongo","category":"CHARACTERS","builder":"world","model":"brain:pongo","source":"Brain world + Home"},{"id":"rat","label":"Lab Rat","category":"CHARACTERS","builder":"world","model":"brain:rat","source":"Brain world"},{"id":"bongo","label":"Dr. Bongo","category":"CHARACTERS","builder":"world","model":"brain:bongo","source":"Bongo lab"},{"id":"mongo","label":"Mongo — gorilla","category":"CHARACTERS","builder":"world","model":"specimen:gorilla","source":"Bongo lab"},{"id":"gongo","label":"Gongo — chimpanzee","category":"CHARACTERS","builder":"world","model":"specimen:chimpanzee","source":"Bongo lab"},{"id":"baboogoo","label":"Baboogoo — baboon","category":"CHARACTERS","builder":"world","model":"specimen:baboon","source":"Bongo lab"},{"id":"yongo001","label":"Yongo001 — yeti","category":"CHARACTERS","builder":"world","model":"specimen:yeti","source":"Bongo lab"},{"id":"longo001","label":"Longo001 — legacy Bongo","category":"CHARACTERS","builder":"world","model":"legacy:buildBongo","source":"GitHub original"},{"id":"rat001","label":"Lab Rat001 — original","category":"CHARACTERS","builder":"world","model":"legacy:buildLabRat","source":"GitHub original"},{"id":"cow","label":"Cow001 — meadow","category":"CHARACTERS","builder":"world","model":"cow","source":"Brain world"},{"id":"cow002","label":"Cow002 — original","category":"CHARACTERS","builder":"world","model":"legacy:buildCow","source":"GitHub original"},{"id":"pig001","label":"Pig001","category":"CHARACTERS","builder":"world","model":"legacy:buildPig","source":"GitHub original"},{"id":"sheep001","label":"Sheep001","category":"CHARACTERS","builder":"world","model":"legacy:buildSheep","source":"GitHub original"},{"id":"alien001","label":"Alien001 — original scout","category":"CHARACTERS","builder":"world","model":"legacy:buildAlienScout","source":"GitHub original"},{"id":"penguin002","label":"Penguin002 — town","category":"CHARACTERS","builder":"world","model":"town:penguin","source":"Penguin Town"},{"id":"penguin003","label":"Penguin003 — original scout","category":"CHARACTERS","builder":"world","model":"legacy:buildPenguinCharacter","source":"GitHub original"},{"id":"monkey-centipede","label":"Longo096 — monkey centipede","category":"CHARACTERS","builder":"world","model":"fbx:/models/monkey-centipede.fbx","source":"Home brain"},{"id":"brain001","label":"Brain001worminfested","category":"PROPS","builder":"world","model":"living-brain","source":"Home brain"},{"id":"brain069","label":"Brain069room","category":"BUILDINGS","builder":"world","model":"glb:/brain-room/brain-room.glb","source":"Brain world"},{"id":"brain","label":"Brain002organ","category":"ANATOMY","builder":"world","model":"loose:brain","source":"Brain world"},{"id":"beanbag001","label":"Brain003beanbag","category":"PROPS","builder":"world","model":"legacy:buildBeanbag","source":"GitHub original"},{"id":"cortex-eraser","label":"Cortex Eraser","category":"WEAPONS","builder":"world","model":"evil-laser","source":"Bongo lab"},{"id":"alien-laser","label":"Alien laser gun","category":"WEAPONS","builder":"world","model":"fixture:alien-laser","source":"Unified armory"},{"id":"cannon","label":"Cannon","category":"WEAPONS","builder":"world","model":"fixture:cannon","source":"Unified armory"},{"id":"anti-air","label":"Anti-aircraft gun","category":"WEAPONS","builder":"world","model":"fixture:anti-air","source":"Unified armory"},{"id":"warship","label":"Warship","category":"VEHICLES","builder":"world","model":"fixture:warship","source":"Unified armory"},{"id":"ammo","label":"Ammo001 — rounds","category":"COLLECTIBLES","builder":"world","model":"fixture:ammo","source":"Unified armory"},{"id":"satellite","label":"Satellite001","category":"PROPS","builder":"world","model":"fixture:satellite","source":"Urf sky"},{"id":"crystal","label":"Crystal001 — garden cluster","category":"NATURE","builder":"world","model":"fixture:crystal","source":"Crystal graveyard"},{"id":"crystal002","label":"Crystal002 — home glass","category":"NATURE","builder":"world","model":"home:crystal","source":"Home"},{"id":"jungle-tree","label":"Tree001 — jungle","category":"NATURE","builder":"world","model":"home:tree","source":"Home"},{"id":"dream-tree","label":"Tree002 — dream tree","category":"NATURE","builder":"world","model":"dream-tree","source":"Brain world"},{"id":"fence","label":"Fence001 — pasture section","category":"BUILDINGS","builder":"world","model":"fixture:fence","source":"Cow field"},{"id":"tombstone","label":"Tombstone001","category":"PROPS","builder":"world","model":"fixture:tombstone","source":"Crystal graveyard"},{"id":"altar","label":"Altar001 — polished gold","category":"LIBRARY","builder":"world","model":"fixture:altar","source":"Crystal graveyard"},{"id":"book","label":"Book001 — haunted volume","category":"LIBRARY","builder":"world","model":"fixture:book","source":"Crystal graveyard"},{"id":"island","label":"Island001 — archer platform","category":"NATURE","builder":"world","model":"island","source":"Urf world select"},{"id":"barn","label":"Barn001 — red meadow barn","category":"BUILDINGS","builder":"world","model":"level:barn","source":"Cow field"},{"id":"lab","label":"Lab001 — Bongo warehouse","category":"BUILDINGS","builder":"world","model":"level:lab","source":"Brain world"},{"id":"mushroom","label":"Mushroom001 — psychedelic","category":"NATURE","builder":"world","model":"mushroom","source":"Brain world"},{"id":"lungs","label":"Lungs","category":"ANATOMY","builder":"world","model":"loose:lungs","source":"Brain world"},{"id":"heart","label":"Heart","category":"ANATOMY","builder":"world","model":"loose:heart","source":"Brain world"},{"id":"liver","label":"Liver","category":"ANATOMY","builder":"world","model":"loose:liver","source":"Brain world"},{"id":"bones","label":"Bones","category":"ANATOMY","builder":"world","model":"loose:bones","source":"Brain world"},{"id":"stomach","label":"Stomach","category":"ANATOMY","builder":"world","model":"loose:stomach","source":"Brain world"},{"id":"dentures","label":"Dentures","category":"ANATOMY","builder":"world","model":"loose:dentures","source":"Brain world"},{"id":"eyes","label":"Eyes","category":"ANATOMY","builder":"world","model":"loose:eyes","source":"Brain world"},{"id":"rock","label":"Rock","category":"NATURE","builder":"world","model":"loose:rock","source":"Brain world"},{"id":"worm","label":"Worm","category":"CHARACTERS","builder":"world","model":"loose:worm","source":"Brain world"},{"id":"rat-meat-silver","label":"Silver Rat Meat","category":"COLLECTIBLES","builder":"world","model":"loose:rat-meat-silver","source":"Brain world"},{"id":"bone-skull","label":"Bone050 — skull","category":"ANATOMY","builder":"world","model":"fixture:bone-skull","source":"Anatomy garden"},{"id":"bone-ribcage","label":"Bone051 — ribcage","category":"ANATOMY","builder":"world","model":"fixture:bone-ribcage","source":"Anatomy garden"},{"id":"bone-spine","label":"Bone052 — spine","category":"ANATOMY","builder":"world","model":"fixture:bone-spine","source":"Anatomy garden"},{"id":"bone-pelvis","label":"Bone053 — pelvis","category":"ANATOMY","builder":"world","model":"fixture:bone-pelvis","source":"Anatomy garden"},{"id":"bone-humerus","label":"Bone054 — humerus","category":"ANATOMY","builder":"world","model":"fixture:bone-humerus","source":"Anatomy garden"},{"id":"bone-forearm","label":"Bone055 — forearm","category":"ANATOMY","builder":"world","model":"fixture:bone-forearm","source":"Anatomy garden"},{"id":"bone-femur","label":"Bone056 — femur","category":"ANATOMY","builder":"world","model":"fixture:bone-femur","source":"Anatomy garden"},{"id":"bone-hand","label":"Bone057 — hand","category":"ANATOMY","builder":"world","model":"fixture:bone-hand","source":"Anatomy garden"},{"id":"bone-foot","label":"Bone058 — foot","category":"ANATOMY","builder":"world","model":"fixture:bone-foot","source":"Anatomy garden"},{"id":"town-plane","label":"Town biplane","category":"VEHICLES","builder":"world","model":"town:plane","source":"Penguin Town"},{"id":"town-telescope","label":"Telescope — wood","category":"BUILDINGS","builder":"world","model":"town:telescope","source":"Penguin Town"},{"id":"town-telescope-metal","label":"Telescope — metal","category":"BUILDINGS","builder":"world","model":"town:telescope-metal","source":"Penguin Town"},{"id":"town-magic","label":"Circus","category":"BUILDINGS","builder":"world","model":"town:magic","source":"Penguin Town"},{"id":"town-igloo","label":"Igloo","category":"BUILDINGS","builder":"world","model":"town:igloo","source":"Penguin Town"},{"id":"town-sweatshop","label":"Sweatshop","category":"BUILDINGS","builder":"world","model":"town:sweatshop","source":"Penguin Town"},{"id":"town-docks","label":"Cargo ship","category":"VEHICLES","builder":"world","model":"town:docks","source":"Penguin Town"},{"id":"town-arena","label":"Arena","category":"BUILDINGS","builder":"world","model":"town:arena","source":"Penguin Town"},{"id":"chair-baboon","label":"baboon neural study chair","category":"PROPS","builder":"world","model":"chair:baboon","source":"Bongo lab"},{"id":"chair-gorilla","label":"gorilla neural study chair","category":"PROPS","builder":"world","model":"chair:gorilla","source":"Bongo lab"},{"id":"chair-chimpanzee","label":"chimpanzee neural study chair","category":"PROPS","builder":"world","model":"chair:chimpanzee","source":"Bongo lab"},{"id":"chair-yeti","label":"yeti neural study chair","category":"PROPS","builder":"world","model":"chair:yeti","source":"Bongo lab"}] as SiteAsset[],
  ...LIBRARY_BOOKS.map(book=>({id:'book-'+book.id,label:book.title,category:'LIBRARY' as const,builder:'world' as const,model:'book:'+book.id,source:'Crystal library garden'})),
  ...[{id:'urf-globe',label:'Planet Urf — geographic globe',model:'urf-globe',category:'PROPS'},{id:'archer001',label:'Archer001 — Urf selector',model:'selector:alien',category:'CHARACTERS'},{id:'satellite002',label:'Satellite002 — original orbital',model:'selector:satellite',category:'VEHICLES'},...['moon','ufo','meteor','thrusters','big-dish','extra-panels'].map(id=>({id:'orbital-'+id,label:id,model:'selector:'+id,category:'PROPS'})),{id:'computer',label:'Bongo smiling supercomputer',model:'computer',category:'PROPS'},...['chair','ottoman','table','lamp','painting'].map(id=>({id:'brain-furniture-'+id,label:'Brain room '+id,model:'furniture:'+id,category:'PROPS'})),...['mag','round','banana','monster','pepsi','goldcan'].map(id=>({id:'pickup-'+id,label:'Alien-game '+id+' pickup',model:'pickup:'+id,category:'COLLECTIBLES'}))].map(a=>({...a,builder:'world',source:'Recovered site model'})) as SiteAsset[],
  ...[
  {
    "id": "hex-penguin",
    "label": "HexTrip penguin",
    "category": "CHARACTERS",
    "builder": "world",
    "model": "hex:penguin",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-gidog",
    "label": "HexTrip G.I. dog",
    "category": "CHARACTERS",
    "builder": "world",
    "model": "hex:gidog",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-robot",
    "label": "HexTrip robot",
    "category": "CHARACTERS",
    "builder": "world",
    "model": "hex:robot",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-panda",
    "label": "HexTrip panda",
    "category": "CHARACTERS",
    "builder": "world",
    "model": "hex:panda",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-alien",
    "label": "HexTrip alien",
    "category": "CHARACTERS",
    "builder": "world",
    "model": "hex:alien",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-motorcycle",
    "label": "HexTrip motorcycle",
    "category": "VEHICLES",
    "builder": "world",
    "model": "hex:motorcycle",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-biplane",
    "label": "HexTrip biplane",
    "category": "VEHICLES",
    "builder": "world",
    "model": "hex:biplane",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-helicopter",
    "label": "HexTrip helicopter",
    "category": "VEHICLES",
    "builder": "world",
    "model": "hex:helicopter",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-airfield",
    "label": "HexTrip airfield",
    "category": "BUILDINGS",
    "builder": "world",
    "model": "hex:airfield",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-container",
    "label": "HexTrip container",
    "category": "BUILDINGS",
    "builder": "world",
    "model": "hex:container",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-barracks",
    "label": "HexTrip barracks",
    "category": "BUILDINGS",
    "builder": "world",
    "model": "hex:barracks",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-tree",
    "label": "HexTrip tree",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:tree",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-palm",
    "label": "HexTrip palm",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:palm",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-boulder",
    "label": "HexTrip boulder",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:boulder",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-fern",
    "label": "HexTrip fern",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:fern",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-pepsiCan",
    "label": "HexTrip Pepsi can",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:pepsiCan",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-brick",
    "label": "HexTrip brick",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:brick",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-reefer",
    "label": "HexTrip reefer prop",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:reefer",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-shroom",
    "label": "HexTrip mushroom",
    "category": "PROPS",
    "builder": "world",
    "model": "hex:shroom",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-revolver",
    "label": "HexTrip revolver",
    "category": "WEAPONS",
    "builder": "world",
    "model": "hex:revolver",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-ak47",
    "label": "HexTrip ak47",
    "category": "WEAPONS",
    "builder": "world",
    "model": "hex:ak47",
    "source": "Original HexTrip game"
  },
  {
    "id": "hex-blimp",
    "label": "HexTrip blimp",
    "category": "VEHICLES",
    "builder": "world",
    "model": "hex:blimp",
    "source": "Original HexTrip game"
  }
] as SiteAsset[],
  ...['vehicle','jetpack','bow','arrow','pepsi','yoohoo','monster','rat-meat','biplane','penguin'].map(id=>({id:'original-'+id,label:'Original sandbox '+id,builder:'world',model:'sandbox-old:'+id,source:'Original asset sandbox',category:['vehicle','biplane'].includes(id)?'VEHICLES':id==='penguin'?'CHARACTERS':'PROPS'})) as SiteAsset[],
  ...(media as SiteAsset[]),
];

export const ASSET_CATEGORIES: AssetCategory[] = ["CHARACTERS","COLLECTIBLES","WEAPONS","VEHICLES","PROPS","BUILDINGS","ANATOMY","NATURE","LIBRARY","IMAGES"];
