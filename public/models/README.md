# Blender drop-box for the Planet Urf world select

The alien archer and the floating slab they stand on are built procedurally in
`app/urf/globe3d.ts`, so the scene works with no assets at all. When you'd
rather model them properly in Blender, this folder is the swap-in point.

1. Model it in Blender. Face the character down **+Z**, standing on the origin.
   Scale doesn't matter — the loader normalises whatever it gets to one unit
   tall and drops it onto the ground.
2. Export as **glTF Binary (.glb)** — File → Export → glTF 2.0, format `.glb`.
   Keep it low-poly and flat-shaded to match the rest of the planet.
3. Save it in this folder, then name it in `index.json`:

   ```json
   {
     "archer": "urf-archer.glb",
     "props":  "urf-props.glb"
   }
   ```

`archer` replaces the alien's body (movement, facing and the bow-draw rig keep
driving it). `props` is extra scenery parented to the floating slab — crystals,
mushrooms, ruins, whatever. Leave either as `null` to keep the built-in model.

Nothing here is required. With both set to `null` the site renders exactly as
it does today, so a broken or missing export can never take the globe down.
