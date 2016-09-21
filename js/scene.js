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
    //this.camera = CreateCamera(16.0/9.0);

    //funny stuff is hapening with the ortho camera
    this.camera = CreateOrtho(WINDOW_WIDTH, WINDOW_HEIGHT);
    this.camera.position.set(0, 0, 700);
    this.camera.zoom = 2;
    this.camera.updateProjectionMatrix();

    this.sceneObject = new THREE.Scene();
    this.model = new Model();
    this.rotation = 0;
    this.modelRotX = 0;
    this.modelRotY = 0;
    this.modelList;
    this.activeModelName;
    this.carving = false;
    //this.cube = new Model();

    this.modelSaved = false;
    this.LoadGUI();
    

    //this.CreateNewModel("Test");
    //this.LoadModel('large2');
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

MainScene.prototype.ShowTutorial = function(id) {
    console.log(id);
    var title = $("#"+id)[0].dataset.title;
    var dia = $( "#"+id ).dialog({
        resizable: false,
        height: "auto",
        width: 600,
        title: title/*,
        buttons: {
            Ok: function() {
                $( this ).dialog( "close" );
            }
        }*/
    });
}

MainScene.prototype.GetFileName = function(e) {
    GetFileContents(e.target.files[0], function(fileContents){
        this.model = new Model();
        this.model.LoadModelFromData(fileContents, function(){
            console.log(this.model.GetMesh());
            this.ResetScene();
            this.sceneObject.add(this.model.GetMesh());
            this.model.SetScale(100, 100, 100);
            this.modelLoaded = true;
        }.bind(this));
    }.bind(this));
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
    this.modelUploadGUI = this.gui.addFolder("Upload Model");

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

    document.getElementById("file-browser").addEventListener('change', this.GetFileName.bind(this), false);
    //$("#file-browser").bind("change", function(e){console.log(e);}, false);
    this.modelLoadControls['Upload'] = function() {
        $("#file-browser").click();
    }.bind(this);

    this.modelUploadGUI.add(this.modelLoadControls, "Upload");
}

MainScene.prototype.LoadModelModsGUI = function(){
    this.modsGUI.removeAllFolders();
    // Index gui
    this.carveCtrls = {};

    this.carveGUI = this.modsGUI.addFolder('Carve');
    this.carveCtrls['Carve'] = function() {
        this.ToggleCarveMod();
    }.bind(this);

    this.carveButton = this.carveGUI.add(this.carveCtrls, 'Carve').name('Start');

    this.carveCtrls['CarveDepth'] = 1;
    // NUM_DEGREE should be taken off the model when loaded instead of using the const
    this.carveGUI.add(this.carveCtrls, 'CarveDepth', 1, 5).step(1).name('Depth');

    this.carveCtrls['CarveTutorial'] = function(){
        // The value for the show tutorial is the id of the dialog window in the html page
        this.ShowTutorial('carve-tutorial');
    }.bind(this);

    this.carveGUI.add(this.carveCtrls, 'CarveTutorial').name("Tutorial");

    this.buildCtrls = {};

    this.buildGUI = this.modsGUI.addFolder("Build");

    this.buildCtrls['Build'] = function() {
        this.ToggleBuildMod();
    }.bind(this);

    this.buildButton = this.buildGUI.add(this.buildCtrls, 'Build').name('Start');

    this.buildCtrls['BuildDepth'] = 1;
    // NUM_DEGREE should be taken off the model when loaded instead of using the const
    this.buildGUI.add(this.buildCtrls, 'BuildDepth', 1, 5).step(1).name('Depth');

    this.buildCtrls['BuildTutorial'] = function(){
        // The value for the show tutorial is the id of the dialog window in the html page
        this.ShowTutorial('build-tutorial');
    }.bind(this);

    this.buildGUI.add(this.buildCtrls, 'BuildTutorial').name("Tutorial");
}
// this.disableFlag is just a flag so I can select what functions get run during updates
// it's mostly there to disable rotating when carving or disabling carving when rotating
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
            if(point != null && this.disableFlag != "mods") {
                if(this.carving) {
                    // Get Mouse Position on model
                    this.model.Carve(-this.carveCtrls["CarveDepth"], point.Level, point.Angle);
                    this.disableFlag = "disableRotate";
                }
                else if(this.building) {
                    this.model.Carve(this.buildCtrls["BuildDepth"], point.Level, point.Angle);
                    this.disableFlag = "disableRotate";
                }
            }
            else{
                if(!(this.disableFlag === "disableRotate")){
                    if( this.IsMouseOnRenderWindow()){
                        var rot = Input.GetMouseDelta();

                        this.modelRotX += rot[0] / 50;
                        this.modelRotY += rot[1] / 50;

                        this.model.SetRotation(this.modelRotY,this.modelRotX, 0);
                        this.disableFlag = "mods";
                    }
                }
            }
        }
        else{
            this.disableFlag = null;
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
        this.model.SetPosition(0, 0, 300);
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

    // I am reducing the x position of the vector by 15 because some reason the value that is return when using offset.left
    // is slightly off and a value of 15 seems to correct that
    var vector = new THREE.Vector3(((mouse.x - offset.left - 15) / WINDOW_WIDTH) * 2 - 1, -((mouse.y - offset.top) / WINDOW_HEIGHT) * 2 + 1, 1);

    return this.GetPointFromVector(vector);
}

MainScene.prototype.ToggleBuildMod = function(){
    if(this.building){
        this.building = false;
        this.model.EndMod();
        this.buildButton.name("Start");
    }
    else{
        this.building = true;
        this.carving = false;
        // I want to make sure that there is no mod active when starting the mod
        this.model.EndMod();
        this.model.StartMod();
        this.buildButton.name("End");
    }
}

MainScene.prototype.ToggleCarveMod = function(){
    if(this.carving){
        this.carving = false;
        this.model.EndMod();
        this.carveButton.name("Start");
    }
    else{
        this.carving = true;
        this.building = false;
        // I want to make sure that there is no mod active when starting the mod
        this.model.EndMod();
        this.model.StartMod();
        this.carveButton.name("End");
    }
}

MainScene.prototype.IsMouseOnRenderWindow = function() {
    var elements = Input.ElementsMounseOn();
    if (elements != undefined || elements.length > 0)
    {
        var elementType = elements[elements.length - 1].tagName;

        return elementType ==="CANVAS";
    }

    return false;
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