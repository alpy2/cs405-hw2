/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 * 		@task3 : Introduce specular lighting by modifying the fragment shader and adding controls
 * 		@task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */

function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    var trans1 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];
    var rotatXCos = Math.cos(rotationX);
    var rotatXSin = Math.sin(rotationX);

    var rotatYCos = Math.cos(rotationY);
    var rotatYSin = Math.sin(rotationY);

    var rotatx = [
        1, 0, 0, 0,
        0, rotatXCos, -rotatXSin, 0,
        0, rotatXSin, rotatXCos, 0,
        0, 0, 0, 1
    ];

    var rotaty = [
        rotatYCos, 0, -rotatYSin, 0,
        0, 1, 0, 0,
        rotatYSin, 0, rotatYCos, 0,
        0, 0, 0, 1
    ];

    var test1 = MatrixMult(rotaty, rotatx);
    var test2 = MatrixMult(trans1, test1);
    var mvp = MatrixMult(projectionMatrix, test2);

    return mvp;
}

class MeshDrawer {
    // The constructor is a good place for taking care of the necessary initializations.
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.colorLoc = gl.getUniformLocation(this.prog, 'color');

        // Lighting uniform locations
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
        this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
        // Removed cameraPosLoc since it's no longer used

        // Attribute locations
        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

        // Buffers
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.numTriangles = 0;

        /**
         * @Task2 : Initialize variables for lighting
         */
        this.enableLightingFlag = false; // Lighting disabled by default
        this.ambientIntensity = 0.2; // Default ambient intensity
        this.specularIntensity = 0.5; // Default specular intensity
        this.shininess = 32.0; // Default shininess
        this.lightPosition = [1.0, 1.0, 6.0]; // Fixed light position
        this.cameraPosition = [0.0, 0.0, 10.0]; // Camera position (not used in shader)
    }

    setMesh(vertPos, texCoords, normalCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;

        /**
         * @Task2 : Update the rest of this function to handle the lighting
         * (Handled by uploading normal coordinates)
         */
    }

    // This method is called to draw the triangular mesh.
    // The argument is the transformation matrix, the same matrix returned
    // by the GetModelViewProjection function above.
    draw(trans) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvpLoc, false, trans);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

        /**
         * @Task2 and Task3 : Pass lighting uniforms
         */
        gl.uniform1i(this.enableLightingLoc, this.enableLightingFlag);
        gl.uniform3fv(this.lightPosLoc, this.lightPosition);
        gl.uniform1f(this.ambientLoc, this.ambientIntensity);
        gl.uniform1f(this.specularIntensityLoc, this.specularIntensity);
        gl.uniform1f(this.shininessLoc, this.shininess);
        // Removed setting cameraPos since it's not used in the shader

        updateLightPos();

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    // This method is called to set the texture of the mesh.
    // The argument is an HTML IMG element containing the texture data.
    setTexture(img) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Task 1: Handle non power-of-two textures
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );

        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const sampler = gl.getUniformLocation(this.prog, 'tex');
        gl.uniform1i(sampler, 0);
    }

    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.showTexLoc, show);
    }

    enableLighting(show) {
        this.enableLightingFlag = show;
    }
    
    setAmbientLight(ambient) {
        this.ambientIntensity = ambient;
    }

    setSpecularLight(intensity) {
        this.specularIntensity = intensity;
    }

    setShininess(shininess) {
        this.shininess = shininess;
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}

function normalize(v, dst) {
    dst = dst || new Float32Array(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
    }
    return dst;
}

// Vertex shader source code
const meshVS = `
    attribute vec3 pos; 
    attribute vec2 texCoord; 
    attribute vec3 normal;

    uniform mat4 mvp; 

    varying vec2 v_texCoord; 
    varying vec3 v_normal; 

    void main()
    {
        v_texCoord = texCoord;
        v_normal = normal;

        gl_Position = mvp * vec4(pos,1);
    }`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D tex;
    uniform vec3 color; 
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularIntensity;
    uniform float shininess;

    // Removed cameraPos since it's not used
    // Added fixed view direction
    const vec3 viewDir = vec3(0.0, 0.0, 1.0);

    varying vec2 v_texCoord;
    varying vec3 v_normal;

    void main()
    {
        vec4 texColor = texture2D(tex, v_texCoord);
        vec3 finalColor = texColor.rgb;

        if(showTex && enableLighting){
            // Ambient lighting
            vec3 ambientLight = ambient * texColor.rgb;

            // Diffuse lighting
            vec3 norm = normalize(v_normal);
            vec3 lightDir = normalize(lightPos); // Treat lightPos as a direction
            float diff = max(dot(norm, lightDir), 0.0);
            vec3 diffuse = diff * texColor.rgb;

            // Specular lighting
            vec3 reflectDir = reflect(-lightDir, norm);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
            vec3 specular = specularIntensity * spec * vec3(1.0); // White specular highlights

            // Combine ambient, diffuse, and specular
            finalColor = ambientLight + diffuse + specular;
        }
        else if(showTex){
            finalColor = texColor.rgb;
        }
        else{
            finalColor = vec3(1.0, 0.0, 0.0); // Red color when texture is not shown
        }

        gl_FragColor = vec4(finalColor, texColor.a);
    }`;

// Light direction parameters for Task 2
var lightX = 1.0, lightY = 1.0;

// Keyboard input handling
const keys = {};
document.addEventListener('keydown', (event) => { keys[event.key] = true; });
document.addEventListener('keyup', (event) => { keys[event.key] = false; });

function updateLightPos() {
    const translationSpeed = 0.1; // Adjust speed as necessary
    let updated = false;

    if (keys['ArrowUp']) { lightY += translationSpeed; updated = true; }
    if (keys['ArrowDown']) { lightY -= translationSpeed; updated = true; }
    if (keys['ArrowRight']) { lightX += translationSpeed; updated = true; }
    if (keys['ArrowLeft']) { lightX -= translationSpeed; updated = true; }

    if (updated) {
        meshDrawer.lightPosition = [lightX, lightY, 6.0];
        gl.useProgram(meshDrawer.prog);
        gl.uniform3fv(meshDrawer.lightPosLoc, meshDrawer.lightPosition);
    }
}

// Functions called from HTML

function SetAmbientLight(param) {
    meshDrawer.setAmbientLight(parseFloat(param.value) / 100.0);
    DrawScene();
}

function EnableLight(param) {
    meshDrawer.enableLighting(param.checked);
    DrawScene();
}

function SetSpecularLight(param) {
    meshDrawer.setSpecularLight(parseFloat(param.value) / 100.0);
    DrawScene();
}

function SetShininess(param) {
    meshDrawer.setShininess(parseFloat(param.value));
    DrawScene();
}

function LoadTexture(param) {
    if (param.files && param.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;
            document.getElementById('texture-img').src = e.target.result;
            img.onload = function () {
                meshDrawer.setTexture(img);
                DrawScene();
            }
        };
        reader.readAsDataURL(param.files[0]);
    }
    meshDrawer.showTexture(true);
    DrawScene();
}

function Initialize() {
    canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        alert('WebGL not supported');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    meshDrawer = new MeshDrawer();

    const vertices = [
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0,
         0.0,  1.0,  0.0,
    ];

    const texCoords = [
        0.0, 0.0,
        1.0, 0.0,
        0.5, 1.0,
    ];

    const normals = [
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
    ];

    meshDrawer.setMesh(vertices, texCoords, normals);
    DrawScene();
}

function DrawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const perspectiveMatrix = makePerspective(45, canvas.width / canvas.height, 0.1, 100.0);
    const mvpMatrix = GetModelViewProjection(perspectiveMatrix, 0, 0, -5, 0, 0);
    
    meshDrawer.draw(mvpMatrix);
    requestAnimationFrame(DrawScene);
}

// Call Initialize once the page has loaded
window.onload = Initialize;
