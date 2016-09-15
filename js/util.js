var KeyCode = {
    _0: 48,
    _1: 49,
    _2: 50,
    _3: 51,
    _4: 52,
    _5: 53,
    _6: 54,
    _7: 55,
    _8: 56,
    _9: 57,
    A : 65,
    B : 66,
    C : 67,
    D : 68,
    E : 69,
    F : 70,
    G : 71,
    H : 72,
    I : 73,
    J : 74,
    K : 75,
    L : 76,
    M : 77,
    N : 78,
    O : 79,
    P : 80,
    Q : 81,
    R : 82,
    S : 83,
    T : 84,
    U : 85,
    V : 86,
    W : 87,
    X : 88,
    Y : 89,
    Z : 90,
}

function Mouse() {
    Mouse.prototype.x;
    Mouse.prototype.y;
    Mouse.prototype.down;

    Mouse.prototype.Init = function(){
        this.x = 0;
        this.y = 0;

        this.down = false;
    }
}

function Input(){
    // We are using a buffered keyboard so we need 2 keyboards
    Input.prototype.currentKeyboard;
    Input.prototype.lastKeyboard;

    Input.prototype.lastMouse;
    Input.prototype.currentMouse;

    Input.prototype.mouseState;
    
    Input.prototype.Init = function(){
        this.currentKeyboard = this.CreateKeyboard();
        this.lastKeyboard = this.CreateKeyboard();

        this.currentMouse = this.CreateMouse();
        this.lastMouse = this.CreateMouse();
        
        this.keyboardState = this.CreateKeyboard();
        
        this.mouseState = this.CreateMouse();

        document.addEventListener('keydown', this.KeyDown.bind(this));
        document.addEventListener('keyup', this.KeyUp.bind(this));

        document.onmousemove = this.MouseMove.bind(this);
        document.onmouseup = this.MouseUp.bind(this);
        document.onmousedown = this.MouseDown.bind(this);
    }
    
    Input.prototype.CreateKeyboard = function(){
        var keyboard = {};
        
        // Create a keyboard with all values set to 0
        // We have an 8 byte address space for the keyboard
        for(var i = 0; i < 256; i++){
            keyboard[i] = false;
        }
        
        return keyboard;
    }

    Input.prototype.CreateMouse = function () {
        mouse = new Mouse();
        mouse.Init();

        return mouse;
    }
    
    // This return what the current state of the keybard is
    Input.prototype.GetKeyboardState = function() {
        return this.keyboardState;
    }

    Input.prototype.GetMouseState = function () {
        mouse = this.CreateMouse();

        mouse.x = this.mouseState.x;
        mouse.y = this.mouseState.y;

        mouse.down = this.mouseState.down;

        return mouse;
    }

    Input.prototype.GetMouseDelta = function () {
        //console.log(this.currentMouse);
        //console.log(this.lastMouse);
        return [this.currentMouse.x - this.lastMouse.x, this.currentMouse.y - this.lastMouse.y];
    }
    
    Input.prototype.KeyDown = function(event){
        this.keyboardState[event.keyCode] = true;
    }
    
    Input.prototype.KeyUp = function(event){
        this.keyboardState[event.keyCode] = false;
    }

    Input.prototype.MouseMove = function (event) {
        //console.log("mouse moved");
        this.mouseState.x = event.clientX;
        this.mouseState.y = event.clientY;

        //console.log(this.mouseState);
    }

    Input.prototype.MouseDown = function () {
        //console.log("mouse down");
        this.mouseState.down = true;
    }

    Input.prototype.MouseUp = function () {
        //console.log("mouse up");
        this.mouseState.down = false;
    }
    
    Input.prototype.Update = function(){
        // To have the ability to check if a key has just been pressed
        // or released we need to keep track of past keyboard state
        this.lastKeyboard = this.currentKeyboard;
        this.currentKeyboard = this.GetKeyboardState();

        this.lastMouse = this.currentMouse;
        this.currentMouse = this.GetMouseState();
    }
    
    // This should fire as long as the user is holding the key
    Input.prototype.IsKeyDown = function(key){
        return this.currentKeyboard[key];
    }
    
    // This should only fire once untill the user releases the key
    // and presses it again
    Input.prototype.IsKeyPressed = function(key){
        return (this.currentKeyboard[key] && ~this.lastKeyboard[key]);
    }
    
    // This shoudl only fire once until the user pressed the key again
    // and releases it
    Input.prototype.IsKeyReleased = function(key){
//         return (~this.currentKeyboard[key] && this.lastKeyboard[key]);
    }

    Input.prototype.IsMouseDown = function () {
        return this.currentMouse.down;
    }
}

function GetFileContents(file, callback) {
    if (!file) {
        console.log("no file provided");
        return;
    }

    var reader = new FileReader();

    reader.onload = function(fileLoadResult) {
        callback(fileLoadResult.target.result);
    };

    reader.onerror = function(error) {
        conosle.log("failed to load file");
        console.log(error);
    };

    reader.readAsText(file);
};


function CreateMesh(geometry, vertexShader, fragmentShader, fragmentBackShader){
    var material = CreateMultiMaterial(vertexShader, fragmentShader, fragmentBackShader);
    var m = new THREE.SceneUtils.createMultiMaterialObject(geometry, material);
    
    return m;
};

function CreateMultiMaterial(vertexShader, fragmentShader, fragmentBackShader){
    var matFront = new THREE.ShaderMaterial({
        //uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    matFront.side = THREE.FrontSide;

    var matBack = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentBackShader
    });

    matBack.side = THREE.BackSide;

    return [matFront, matBack];
}

function CreateMaterial(vertexShader, fragmentShader){
    var mat = new THREE.ShaderMaterial({
        vertexShader:vertexShader,
        fragmentShader: fragmentShader
    });

    return mat;
}

function CreateCamera(aspectRatio) {
    var camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 10000);
    camera.position.z = 1000;
    
    return camera;
};

dat.GUI.prototype.removeAllFolders = function() {
    console.log("removing all folders");
    for(i in this.__folders){
        this.__folders[i].close(); 
        this.__folders[i].domElement.parentNode.parentNode.removeChild(this.__folders[i].domElement.parentNode); 
        this.__folders[i] = undefined; this.onResize();
    } 
}

dat.GUI.prototype.removeFolder = function(name) {
    this.__folders[name].close(); 
    this.__folders[name].domElement.parentNode.parentNode.removeChild(this.__folders[name].domElement.parentNode); 
    this.__folders[name] = undefined;
    this.onResize();
}