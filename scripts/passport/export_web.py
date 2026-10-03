"""Run Blender -b SOURCE.blend --python export_web.py -- OUTPUT_DIRECTORY.
Source: Library libfile_d14c77da792481918a2c5bc4a64ae0c1, PassportCraftV5.
Exports authored geometry/skin to glTF; USDZ is never loaded in the browser.
"""
import bpy, sys, pathlib, json
out = pathlib.Path(sys.argv[sys.argv.index('--') + 1]); out.mkdir(parents=True, exist_ok=True)
# Fictional prototype campaign/history printing is replaced by live DOM UI.
for name in ['Index_label','Index_title','Current_label','Current_name','Current_date','Past_label','Past_name','Index_foot']:
    obj = bpy.data.objects.get(name)
    if obj: bpy.data.objects.remove(obj, do_unlink=True)
# After material merging these text objects have been joined; strip the entire
# index ink mesh, retaining the lining, card recesses and co-brand artwork.
for obj in list(bpy.data.objects):
    if obj.name.startswith(('InsideCover_Charcoal_ink','InsideCover_Grade_blue','InsideCover_Grade_orange')):
        bpy.data.objects.remove(obj, do_unlink=True)
for img in bpy.data.images:
    if img.type == 'IMAGE' and max(img.size) > 1024:
        ratio=1024/max(img.size); img.scale(round(img.size[0]*ratio), round(img.size[1]*ratio))
scene=bpy.context.scene; scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(out/'passport-v5.glb'), export_format='GLB', export_yup=True,
    export_animations=True, export_animation_mode='SCENE', export_frame_range=True,
    export_skins=True, export_all_influences=False, export_cameras=False, export_lights=False)
manifest={'source_library_id':'libfile_d14c77da792481918a2c5bc4a64ae0c1','source':'PassportCraftV5/Models/Peen-Passport-Craft-v5.blend',
 'blender':bpy.app.version_string,'bytes':(out/'passport-v5.glb').stat().st_size,'source_frames':[1,50,56,116],
 'source_fps':30,'license':'User-provided artwork and original authored geometry; same-project reuse only.',
 'changes':['glTF export with skeleton and animation','cover texture bounded to 1024px','fictional index labels removed']}
(out/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
