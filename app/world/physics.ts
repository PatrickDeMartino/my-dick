export const BODY_ROLES=['ragdoll','playable','npc','holdable','display','vehicle','decoration','weapon','ammo'] as const;
export type BodyRole=typeof BODY_ROLES[number];
export const ROLE_LABELS:Record<BodyRole,string>={ragdoll:'Ragdoll',playable:'Playable character',npc:'Wandering NPC',holdable:'Holdable object',display:'Display object',vehicle:'Vehicle',decoration:'Decoration',weapon:'Weapon',ammo:'Ammo'};
export type PhysicsSettings={gravity:number;bounce:number;friction:number;selecting:boolean};
export const DEFAULT_PHYSICS:PhysicsSettings={gravity:9.81,bounce:.35,friction:.82,selecting:false};
export const physics={...DEFAULT_PHYSICS};
export function applyPhysics(value:Partial<PhysicsSettings>){if(Number.isFinite(value.gravity))physics.gravity=Math.max(-30,Math.min(50,value.gravity!));if(Number.isFinite(value.bounce))physics.bounce=Math.max(0,Math.min(1,value.bounce!));if(Number.isFinite(value.friction))physics.friction=Math.max(0,Math.min(1,value.friction!));if(typeof value.selecting==='boolean')physics.selecting=value.selecting;return {...physics};}
export const gravityAcceleration=()=>physics.gravity;
export const WORLD_FORMAT_VERSION=1;
