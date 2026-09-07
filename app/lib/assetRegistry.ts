export type AssetCategory = "CHARACTERS" | "COLLECTIBLES" | "WEAPONS" | "VEHICLES" | "PROPS";

export type SiteAsset = {
  id: string;
  label: string;
  category: AssetCategory;
  builder: "alien" | "shared-prop" | "sandbox";
  source: string;
  character?: "zix" | "pip" | "vex" | "pongo";
  prop?: "rat-meat" | "rat-meat-gold" | "yoohoo" | "banana" | "oil-drum" | "penguin";
  sandbox?: "vehicle" | "jetpack" | "ak47" | "revolver" | "bow" | "arrow" | "pepsi" | "yoohoo" | "biplane" | "penguin" | "bongo";
  scale?: number;
};

/**
 * The canonical inventory for the Assets Room. New Blender replacements can
 * keep these stable IDs while their builders or model URLs change underneath.
 */
export const SITE_ASSETS: SiteAsset[] = [
  { id:"goopy", label:"Goopy", category:"CHARACTERS", builder:"alien", character:"zix", source:"Alien Game", scale:.9 },
  { id:"doopy", label:"Doopy", category:"CHARACTERS", builder:"alien", character:"pip", source:"Alien Game", scale:.82 },
  { id:"doorp", label:"Doorp", category:"CHARACTERS", builder:"alien", character:"vex", source:"Alien Game", scale:.9 },
  { id:"pongo", label:"Pongo", category:"CHARACTERS", builder:"alien", character:"pongo", source:"Home + Alien Game", scale:.85 },
  { id:"penguin", label:"Penguin", category:"CHARACTERS", builder:"shared-prop", prop:"penguin", source:"Penguin Town", scale:1.1 },
  { id:"rat-meat", label:"Rat Meat Can", category:"COLLECTIBLES", builder:"shared-prop", prop:"rat-meat", source:"Site Economy" },
  { id:"rat-meat-gold", label:"Gold Rat Meat", category:"COLLECTIBLES", builder:"shared-prop", prop:"rat-meat-gold", source:"Site Economy" },
  { id:"yoohoo", label:"Yoo-hoo", category:"COLLECTIBLES", builder:"shared-prop", prop:"yoohoo", source:"Yoo-hoo Room" },
  { id:"pepsi", label:"Pepsi Ammo", category:"COLLECTIBLES", builder:"sandbox", sandbox:"pepsi", source:"Alien Game" },
  { id:"banana", label:"Banana", category:"COLLECTIBLES", builder:"shared-prop", prop:"banana", source:"Bongo Lab" },
  { id:"revolver", label:"Revolver", category:"WEAPONS", builder:"sandbox", sandbox:"revolver", source:"Alien Game", scale:1.4 },
  { id:"ak47", label:"AK-47", category:"WEAPONS", builder:"sandbox", sandbox:"ak47", source:"Alien Game", scale:1.25 },
  { id:"bow", label:"Bow", category:"WEAPONS", builder:"sandbox", sandbox:"bow", source:"Urf Archer", scale:1.1 },
  { id:"arrow", label:"Arrow", category:"WEAPONS", builder:"sandbox", sandbox:"arrow", source:"Urf Archer", scale:.9 },
  { id:"biplane", label:"Penguin Biplane", category:"VEHICLES", builder:"sandbox", sandbox:"biplane", source:"Penguin Town", scale:.55 },
  { id:"urf-rover", label:"Urf Rover", category:"VEHICLES", builder:"sandbox", sandbox:"vehicle", source:"HexTrip", scale:.65 },
  { id:"jetpack", label:"Jetpack", category:"PROPS", builder:"sandbox", sandbox:"jetpack", source:"Alien Game", scale:.85 },
  { id:"oil-drum", label:"Oil Drum", category:"PROPS", builder:"shared-prop", prop:"oil-drum", source:"Planet Urf" },
  { id:"pongo-ragdoll", label:"Pongo Ragdoll", category:"PROPS", builder:"sandbox", sandbox:"bongo", source:"Brain Room", scale:.75 },
];

export const ASSET_CATEGORIES: AssetCategory[] = ["CHARACTERS","COLLECTIBLES","WEAPONS","VEHICLES","PROPS"];
