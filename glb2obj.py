import bpy
import bmesh
import sys

# Ensure the Wavefront OBJ add-on is enabled
addon_name = "io_scene_obj"
if addon_name not in bpy.context.preferences.addons:
    try:
        bpy.ops.preferences.addon_enable(module=addon_name)
        print(f"Enabled add-on: {addon_name}")
    except Exception as e:
        print(f"Failed to enable add-on: {addon_name}. Error: {e}")

def import_glb(filepath):
    """Import a GLB file into Blender."""
    bpy.ops.import_scene.gltf(filepath=filepath)
    print(f"Imported GLB: {filepath}")

def bake_texture_to_vertex_colors(obj):
    """Bake the active texture to vertex colors."""
    if obj.type != 'MESH':
        print(f"Object {obj.name} is not a mesh. Skipping.")
        return

    mesh = obj.data
    vcol_layer = mesh.vertex_colors.get("Col")
    if not vcol_layer:
        vcol_layer = mesh.vertex_colors.new(name="Col")

    # Access the active image texture
    image = None
    for node in obj.active_material.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            image = node.image
            break

    if not image:
        print(f"No image texture found for {obj.name}. Skipping.")
        return

    width, height = image.size
    pixels = image.pixels[:]

    bm = bmesh.new()
    bm.from_mesh(mesh)
    uv_layer = bm.loops.layers.uv.active
    color_layer = bm.loops.layers.color.get("Col")

    if not color_layer:
        color_layer = bm.loops.layers.color.new("Col")

    # Iterate through faces and bake the texture to vertex colors
    for face in bm.faces:
        for loop in face.loops:
            uv = loop[uv_layer].uv
            x = int(uv.x * (width - 1)) % width
            y = int(uv.y * (height - 1)) % height
            index = (y * width + x) * 4  # RGBA index
            r, g, b = pixels[index], pixels[index + 1], pixels[index + 2]
            loop[color_layer] = (r, g, b, 1.0)  # Add Alpha value

    bm.to_mesh(mesh)
    bm.free()
    print(f"Baked texture to vertex colors for {obj.name}.")

def assign_vertex_color_material(obj):
    """Assign a material to the object that uses vertex colors."""
    if obj.type != 'MESH':
        print(f"Object {obj.name} is not a mesh. Skipping.")
        return

    mat = bpy.data.materials.new(name=f"{obj.name}_VertexColorMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")

    if bsdf:
        # Add the vertex color node
        vcol_node = mat.node_tree.nodes.new(type="ShaderNodeVertexColor")
        vcol_node.layer_name = "Col"

        # Connect the vertex color node to the Base Color input
        mat.node_tree.links.new(vcol_node.outputs["Color"], bsdf.inputs["Base Color"])

    # Assign the material to the object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    print(f"Assigned vertex color material to {obj.name}.")

def check_3d_printability(obj):
    """Check if the object is manifold and suitable for 3D printing."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    is_manifold = all(edge.is_manifold for edge in bm.edges)
    bm.free()

    if not is_manifold:
        print(f"Warning: {obj.name} is not manifold. Fix required.")
    else:
        print(f"{obj.name} is manifold and suitable for 3D printing.")
    return is_manifold

def export_obj(filepath):
    """Export the selected objects as an OBJ file with materials (vertex colors)."""
    bpy.ops.export_scene.obj(
        filepath=filepath,
        use_selection=True,
        use_materials=True,  # Export materials, which include vertex colors
    )
    print(f"Exported OBJ with vertex colors: {filepath}")

def main():
    # Parse command-line arguments
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]  # All arguments after '--'

    if len(argv) < 2:
        print("Usage: blender --background --python script.py -- <input_file> <output_file>")
        return

    input_file = argv[0]
    output_file = argv[1]

    # Clear the scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Import GLB
    import_glb(input_file)

    # Process each imported object
    imported_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    for obj in imported_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        # Assign material with vertex colors
        assign_vertex_color_material(obj)

        # Bake texture to vertex colors
        bake_texture_to_vertex_colors(obj)

        # Check printability
        check_3d_printability(obj)

        # Deselect for export
        obj.select_set(False)

    # Select all mesh objects for export
    for obj in imported_objects:
        obj.select_set(True)

    # Export as OBJ with vertex colors
    export_obj(output_file)

if __name__ == "__main__":
    main()
