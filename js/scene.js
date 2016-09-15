// Need to move this to the system can and get the input from there
var Input = new Input();
Input.Init();

// Class Scene
function Scene(){
    this.name = "Base Scene";
    this.camera;
    this.sceneObject;
}

Scene.prototype.GetName = function (){
        return this.name;
}

Scene.prototype.GetCamera = function(){
    return this.camera;
}

Scene.prototype.GetSceneObject = function(){
    return this.sceneObject;
}

Scene.prototype.Update = function(){
}

// class Main scene
MainScene.prototype = new Scene();
MainScene.prototype.constructor = MainScene;

function MainScene() {
    this.name = "Main Scene Object";
    this.camera = CreateCamera(16.0/9.0);

    //funny stuff is hapening with the ortho camera
    //this.camera = CreateOrtho(1280, 720);
    this.camera.position.set(0, 0, 700);
    this.sceneObject = new THREE.Scene();
    this.model = new ModelCylinder();
    this.rotation = 0;
    this.modelRotX = 0;
    this.modelRotY = 0;
    this.modelList;
    this.activeModelName;
    this.carving = false;

    this.modelSaved = false;

    this.LoadGUI();

    //this.CreateNewModel("Test");
    this.LoadModel('large2');
}

// This probably should be moved to a ui module or something similar
MainScene.prototype.GetName = function(callback) {
    var dia = $( "#name" ).dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Create": function() {
                $( this ).dialog( "close" );
                var name = $("#model-name").val();
                console.log(name);
                callback(name);

            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        }
    });
}

MainScene.prototype.LoadGUI = function(){
    this.LoadModelLoadGUI();
    //this.LoadModelModsGUI();

    // Creat a placeholder for the mods gui
    this.modsGUI = new dat.GUI({autoPlace: false});
    $('#mod-gui').append(this.modsGUI.domElement);

}

MainScene.prototype.LoadModelLoadGUI = function() {
    this.gui = new dat.GUI({autoPlace: false});
    $('#scene-gui').append(this.gui.domElement);

    this.modelLoadGUI = this.gui.addFolder("Load Model");
    this.modelCreateGUI = this.gui.addFolder("Create Model");
    this.modelSaveGUI = this.gui.addFolder("Save Model");

    // Add the gui for creating new models
    this.modelLoadControls = {};
    // This dosn't look all that clean because I wanted to be able to create a model from just a name
    // and not require a dialog box along with it
    this.modelLoadControls['Create New'] = function() {this.GetName( function(name) {this.CreateNewModel(name)}.bind(this))}.bind(this);
    this.modelCreateGUI.add(this.modelLoadControls, "Create New");

    // Add the gui controls for saving the model
    this.modelSaveControls = {};
    this.modelSaveControls['Save'] = function() {this.SaveModel()}.bind(this);
    this.modelSaveGUI.add(this.modelSaveControls, "Save");

    // Add the model for loading models from the database
    var models = Database.GetModelList(function(models) {
        for(i in models){
            var name = models[i];
            this.modelLoadControls[name] = function (modelName){
                this.LoadModel(modelName);
            }.bind(this, name);

            this.modelLoadGUI.add(this.modelLoadControls, name);
        }
    }.bind(this));
}

MainScene.prototype.LoadModelModsGUI = function(){
    this.modsGUI.removeAllFolders();

    // Need to change the mod gui can be created from mod classes
    // Width mod gui
    this.widenModCtrls = {};
    this.widenGUI = this.modsGUI.addFolder("Widen");

    this.widenModCtrls['WidenInc'] = function(){
        this.model.Widen(10, this.widenModCtrls['WidenLevel']);
        this.modelSaved = false;
    }.bind(this);

    this.widenGUI.add(this.widenModCtrls, 'WidenInc').name("Increment");

    this.widenModCtrls['WidenDec'] = function(){
        this.model.Widen(-10, this.widenModCtrls['WidenLevel']);
        this.modelSaved = false;
    }.bind(this);

    this.widenGUI.add(this.widenModCtrls, 'WidenDec').name("Decrement");

    this.widenModCtrls['WidenLevel'] = 0;
    this.widenGUI.add(this.widenModCtrls, 'WidenLevel', 0, this.model.levels.length - 1).step(1).name('Level');

    // Extrude
    this.extrudeModeCtrls = {};

    this.extrudeGUI = this.modsGUI.addFolder("Extrude");

    this.extrudeModeCtrls['ExtrudeInc'] = function(){
        this.model.Extrude(10, this.extrudeModeCtrls['ExtrudeRadius']);
        this.modelSaved = false;
    }.bind(this);

    this.extrudeGUI.add(this.extrudeModeCtrls, 'ExtrudeInc').name("Increment");

    this.extrudeModeCtrls['ExtrudeDec'] = function(){
        this.model.Extrude(-10, this.extrudeModeCtrls['ExtrudeRadius']);
        this.modelSaved = false;
    }.bind(this);

    this.extrudeGUI.add(this.extrudeModeCtrls, 'ExtrudeDec').name("Decrement");

    this.extrudeModeCtrls['ExtrudeRadius'] = 0;
    // NUM_DEGREE should be taken off the model when loaded instead of using the const
    this.extrudeGUI.add(this.extrudeModeCtrls, 'ExtrudeRadius', 0, NUM_DEGREE).step(1).name('Radius');

    // Index gui
    this.carveModeCtrls = {};

    this.carveGUI = this.modsGUI.addFolder('Mold');
    this.carveModeCtrls['Carve'] = function() {
        this.carving = true;
        this.building = false;
        $('#model-info').text('Carving');
    }.bind(this);

    this.carveGUI.add(this.carveModeCtrls, 'Carve').name('Carve');

    this.carveGUI['Build'] = function() {
        this.building = true;
        this.carving = false;
        $('#model-info').text('Building');
    }.bind(this);

    this.carveGUI.add(this.carveGUI, 'Build').name('Build');
}

MainScene.prototype.Update = function(){
    Input.Update();
    this.rotation += 0.01;

    // I need to fix this so updates only happen once the entire scene is loaded
    if(this.model.IsLoaded()) {
        // Only try and rotate the camera if the mouse is clicked
        
        if (Input.IsMouseDown()) {
            // This is terrible but it will toggle if the user is using the carve mod
            // or trying to rotate the model
            var point = this.GetPointFromMouse();
            if(point != null) {
                if(this.carving) {
                    // Get Mouse Position on model
                    this.model.Carve(49, point.Level, point.Angle);
                }
                else if(this.building) {
                    console.log(point);
                    this.model.Carve(51, point.Level, point.Angle);
                }
            }
            else{
                var rot = Input.GetMouseDelta();

                this.modelRotX += rot[0] / 50;
                this.modelRotY += rot[1] / 50;

                this.model.SetRotation(this.modelRotY,this.modelRotX, 0);
            }
        }
    }
}

MainScene.prototype.ResetScene = function(){
    this.sceneObject = new THREE.Scene();
}

MainScene.prototype.CreateNewModel = function(name) {
    console.log(name);

    if(name === undefined || name === ""){
        return;
    }

    if(this.ModelExists(name)) {
        // popup up a message saying the model already exists
        return;
    }

    this.ResetScene();

    this.model = new ModelCylinder();
    this.model.Create(80);
    this.model.SetPosition(0,-50, 300);
    this.activeModelName = name;

    Database.DBUpdate('model/' + name, this.model.GetData());
    Database.DBAddNew('model_list', name);

    this.sceneObject.add(this.model.GetMesh());

    this.modelLoadControls[name] = function (modelName){
        this.LoadModel(modelName);
    }.bind(this, name);

    // Add the name to the list of models already available
    this.modelLoadGUI.add(this.modelLoadControls, name);

    this.LoadModelModsGUI();
}

MainScene.prototype.LoadModel = function(modelName){
    // Make sure the scene is empty before trying to add a new model
    this.ResetScene();

    Database.DBGet(MODEL_PATH + modelName, function(data) {
        this.model = new ModelCylinder();
        this.model.CreateFromData(data);
        console.log("db get initialize model");
        this.model.SetPosition(0, -50, 300);
        this.sceneObject.add(this.model.GetMesh());

        this.activeModelName = modelName;

        this.LoadModelModsGUI();        

    }.bind(this));    
}

MainScene.prototype.SaveModel = function(){
    console.log("Save Model");
    this.modelSaved = true;
    Database.DBUpdate('model/' + this.activeModelName, this.model.GetData());
}

MainScene.prototype.ModelExists = function(name){
    return false;
}

MainScene.prototype.GetModelIntersection = function(vec) {
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(vec, this.camera);
    var intersects = raycaster.intersectObject(this.model.GetMesh().children[0]);
    return intersects;
}

MainScene.prototype.GetPointFromVector = function(vector) {
    var intersect = this.GetModelIntersection(vector);

    if(intersect.length > 0)
        return this.model.FaceIndexToModelPoint(intersect[0].faceIndex);
    else{
        return null;
    }
}

MainScene.prototype.GetPointFromMouse = function() { 
    var mouse = Input.GetMouseState();

    var offset = $('#render-window').offset();

    var vector = new THREE.Vector3(((mouse.x - offset.left) / WINDOW_WIDTH) * 2 - 1, -((mouse.y - offset.top) / WINDOW_HEIGHT) * 2 + 1, 1);

    return this.GetPointFromVector(vector);
}


/*
// Example for loaded a .obj model from the db
Database.StorageGetUrl('Model/teapot.obj', function(url){
        this.teapot.LoadModel(url, function(){
            this.teapot.SetPosition(400, 0, 0);
            this.teapot.SetScale(100, 100, 100);
            this.sceneObject.add(this.teapot.GetMesh());
        }.bind(this));
    }.bind(this));
    
    
    Database.StorageGetUrl('Model/male02.obj', function(url){
        this.person.LoadModel(url, function(){
            console.log(this.person.GetMesh());
            this.sceneObject.add(this.person.GetMesh());
            this.personLoaded = true;
        }.bind(this))
    }.bind(this));

*/