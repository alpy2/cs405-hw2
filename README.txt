CS 405 Project 2: Texture + Illumination

This project enhances a WebGL application by implementing Tasks 1-3:

Task 1: setTexture was updated to handle non power-of-two (NPOT) textures. The function now checks if the image dimensions are powers of two and sets texture parameters accordingly, enabling the use of any sized textures without errors.

Task 2: Ambient and diffuse lighting were added. The MeshDrawer class was modified to include lighting variables and pass them as uniforms to the fragment shader. The fragment shader was updated to calculate ambient and diffuse light based on surface normals and light position, providing basic illumination to the 3D model.

Task 3: Specular lighting was introduced to simulate shiny surfaces. Additional uniforms for specular intensity and shininess were added to the MeshDrawer class. The fragment shader was further modified to compute specular highlights using the Phong reflection model, allowing for more realistic and dynamic lighting effects. Controls were added to adjust specular properties interactively.

All changes were made exclusively in project2.js and the fragment shader without altering the vertex shader.
