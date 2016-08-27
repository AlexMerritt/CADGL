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
    console.log(this.camera);
    this.sceneObject = new THREE.Scene();
    this.teapot = new Model();
    this.person = new Model();
    this.cylnd = new ModelCylinder();
    this.rotation = 0;

    this.modelSaved = false;

    console.log('main scene constructor');

    /*
    var m = new ModelCylinder();
    m.Create(10);
    Database.DBUpdate('model/cylnd', m.GetData());
    */
    
    Database.DBGet('model/cylnd', function(data) {
        this.cylnd.CreateFromData(data);
        console.log("db get initialize model");
        //this.cylnd.Create(4);
        this.cylnd.SetPosition(-400, 0, 0);
        console.log(this.cylnd);
        this.sceneObject.add(this.cylnd.GetMesh());
    }.bind(this));

    /*

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
}

MainScene.prototype.Update = function(){
    Input.Update();
    this.rotation += 0.01;


    if(this.cylnd.IsLoaded()) {
        //this.cylnd.SetRotation(0, -this.rotation, 0);

        if(Input.IsKeyPressed(KeyCode.A)){
            this.cylnd.Widen(10, 2);
            this.modelSaved = false;
        }
        else if(Input.IsKeyPressed(KeyCode.D)){
            this.cylnd.Widen(-10, 2);
            this.modelSaved = false;
        }
        if(!this.modelSaved && Input.IsKeyPressed(KeyCode.P)){
            console.log("Save Model");
            this.modelSaved = true;
var d = this.cylnd.GetData();
            console.log(this.cylnd.levels.length);
            
            
            Database.DBUpdate('model/cylnd', d);
            console.log(this.cylnd.levels.length);
        }
    }

    if(this.person.IsLoaded()) {
        this.person.SetRotation(0, this.rotation, 0);
    }

    if(this.teapot.IsLoaded()) {
        this.teapot.SetRotation(0, -this.rotation, 0);
    }

    
}