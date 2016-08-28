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
    this.camera.position.set(0, 0, 500);
    this.sceneObject = new THREE.Scene();
    this.model = new ModelCylinder();
    this.rotation = 0;
    this.modelList;
    this.activeModelName;

    this.modelSaved = false;

    this.LoadGUI();


    //this.CreateNewModel("Test");
    //this.CreateNewModel();
    //this.LoadModel('cylnd');

    /*
    // If I screw up the the model data
    var m = new ModelCylinder();
    m.Create(10);
    Database.DBUpdate('model/cylnd02', m.GetData());
    Database.DBAddNew('model_list', 'cylnd02');
    */
}

MainScene.prototype.GetName = function(callback) {
    var dia = $( "#name" ).dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Create": function() {
                $( this ).dialog( "close" );
                callback($("#model-name"));

            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        }
    });
}

MainScene.prototype.CreateNewModel = function(name) {

    this.ResetScene();

    this.model = new ModelCylinder();
    this.model.Create(10);
    this.model.SetPosition(0,-100, 0);
    this.activeModelName = name;

    Database.DBUpdate('model/' + name, this.model.GetData());
    Database.DBAddNew('model_list', name);

    this.sceneObject.add(this.model.GetMesh());

    this.modelControls[name] = function (modelName){
        this.LoadModel(modelName);
    }.bind(this, name);

    this.gui.add(this.modelControls, name);
}

MainScene.prototype.LoadModel = function(modelName){
    // Make sure the scene is empty before trying to add a new model
    this.ResetScene();

    Database.DBGet(MODEL_PATH + modelName, function(data) {
        this.model = new ModelCylinder();
        this.model.CreateFromData(data);
        console.log("db get initialize model");
        this.model.SetPosition(0, -100, 0);
        this.sceneObject.add(this.model.GetMesh());

        this.activeModelName = modelName;
    }.bind(this));
}

MainScene.prototype.LoadGUI = function(){
    this.gui = new dat.GUI();
    this.modelControls = {};
    this.modelControls['Create New'] = function() {this.GetName( function() {this.CreateNewModel}.bind(this))}.bind(this);
    this.gui.add(this.modelControls, "Create New");

    var models = Database.GetModelList(function(models) {
        for(i in models){
            var name = models[i];
            this.modelControls[name] = function (modelName){
                this.LoadModel(modelName);
            }.bind(this, name);

            this.gui.add(this.modelControls, name);
        }
    }.bind(this));
}

MainScene.prototype.Update = function(){
    Input.Update();
    this.rotation += 0.01;

    // I need to fix this so updates only happen once the entire scene is loaded
    if(this.model.IsLoaded()) {
        this.model.SetRotation(0, -this.rotation, 0);

        if(Input.IsKeyPressed(KeyCode.A)){
            this.model.Widen(10, 2);
            this.modelSaved = false;
        }
        else if(Input.IsKeyPressed(KeyCode.D)){
            this.model.Widen(-10, 2);
            this.modelSaved = false;
        }

        if(Input.IsKeyPressed(KeyCode.W)){
            this.model.Extrude(2, 8);
            this.modelSaved = false;
        }
        else if(Input.IsKeyPressed(KeyCode.S)){
            this.model.Extrude(-2, 8);
            this.modelSaved = false;
        }

        if(!this.modelSaved && Input.IsKeyPressed(KeyCode.P)){
            console.log("Save Model");
            this.modelSaved = true;            
            
            Database.DBUpdate('model/' + this.activeModelName, this.model.GetData());
        }
    }
}

MainScene.prototype.ResetScene = function(){
    this.sceneObject = new THREE.Scene();
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