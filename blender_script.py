import bpy
import bmesh
import mathutils

# Get the active object
obj = bpy.context.object
if obj.type == 'MESH':
    mesh = obj.data
    
    # Add a vertex color layer
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
        print("No image texture found!")
    else:
        width, height = image.size
        pixels = image.pixels[:]

        # Create a BMesh to manipulate mesh data
        bm = bmesh.new()
        bm.from_mesh(mesh)
        
        uv_layer = bm.loops.layers.uv.active
        color_layer = bm.loops.layers.color.get("Col")

        if not color_layer:
            color_layer = bm.loops.layers.color.new("Col")

        # Iterate through all faces and bake texture to vertex colors
        for face in bm.faces:
            for loop in face.loops:
                uv = loop[uv_layer].uv
                x = int(uv.x * (width - 1)) % width
                y = int(uv.y * (height - 1)) % height
                index = (y * width + x) * 4  # RGBA index
                r, g, b = pixels[index], pixels[index + 1], pixels[index + 2]
                loop[color_layer] = (r, g, b, 1.0)  # Add Alpha value as 1.0

        # Update the mesh
        bm.to_mesh(mesh)
        bm.free()
        print("Texture successfully baked to vertex colors!")
