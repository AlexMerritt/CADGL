var NUM_DEGREE = 12;
var tao = Math.PI * 2.0;
var levelHeight = 10;

var vertSh = `
varying vec3 vNormal;
varying float depth;
void main()
{
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    depth = 1.0 - gl_Position.z / 1000.0;
}
`;

var fragSh = `
varying vec3 vNormal;
varying float depth;
void main()
{   
    vec3 color = vec3(0.2, 0.5, 1.0);
    vec3 light = normalize(vec3(0.5, 0.2, 1.0));
    
    //color = color * max(0.01, dot(light, vNormal));
    color *= depth;//gl_FragCoord.z;// (gl_FragCoord.z * gl_FragCoord.z * gl_FragCoord.z);
    gl_FragColor = vec4(color, 1.0);
}
`;

// Struct Level
function Level() {
    this.radus = new Array(NUM_DEGREE);
}

function CylPoint() {
    this.Angle = 0.0;
    this.Level = -1;
    this.Radius = 0.0;
}

CylPoint.prototype.Radius;
CylPoint.prototype.Level;
CylPoint.prototype.Angle;

function Point() {
    this.X = 0;
    this.Y = 0;
    this.Z = 0;
}

Point.prototype.X;
Point.prototype.Y;
Point.prototype.Z;

// Class Model
function ModelAbs(){
    this.mesh;
    this.loaded = false;
}

ModelAbs.prototype.SetScale = function(x, y, z) {
    this.mesh.scale.set(x, y, z);
}

ModelAbs.prototype.SetPosition = function(x, y, z){
    this.mesh.position.set(x, y, z);
}

ModelAbs.prototype.SetRotation = function(x, y, z) {
    this.mesh.rotation.set(x, y, z);
}

ModelAbs.prototype.GetMesh = function(){
    return this.mesh;
}

ModelAbs.prototype.IsLoaded = function() {
    return this.loaded;
}

Model.prototype = new ModelAbs();
Model.prototype.constructor = Model;

function Model(){
    this.mesh;
}

Model.prototype.LoadModel = function(filename, callback){
    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {

        console.log( item, loaded, total );

    };

    var loader = new THREE.OBJLoader(manager);
    loader.load(filename, function(model){

        var material = CreateMaterial(vertSh, fragSh);

        model.traverse(function(child){
            if(child instanceof THREE.Mesh){
                child.material = material;
            }
        });

        this.mesh = model;
        this.loaded = true;

        callback();
    }.bind(this));
}

ModelCylinder.prototype = new ModelAbs();
ModelCylinder.prototype.constructor = ModelCylinder;

function ModelCylinder(){
    
    this.levels = [];
}

ModelCylinder.prototype.Create = function(numLevels) {
    for(var i = 0; i < numLevels; i++) {
        var l = new Level();

        for(var j = 0; j < NUM_DEGREE; j++) {
            l.radus[j] =  50;
            //l.radus[j] = Math.random() * 25 + 75;
        }

        this.levels.push(l);
        console.log(l.radus);
    }

    this.BuildMesh();
    this.loaded = true;
}

ModelCylinder.prototype.Geometry = function(){
    var g = new THREE.Geometry();
    g.dynamic = true;

    for(var i = 0; i < this.levels.length - 1; i++) {

        var level = this.levels[i];

        for(var j = 0; j < NUM_DEGREE; j++) {
            // cpcl : current point current level
            // cpnl : current point next level
            // npcl : next point current level
            // npnl : next pont next level
            var cpcl = this.GetPoint(this.GetCylPoint(j, i));
            var cpnl = this.GetPoint(this.GetCylPoint(j, i + 1));
            var npcl = this.GetPoint(this.GetCylPoint((j + 1) % NUM_DEGREE, i));
            var npnl = this.GetPoint(this.GetCylPoint((j + 1) % NUM_DEGREE, i + 1));

            // Add the verts
            g.vertices.push(new THREE.Vector3(npcl.X, npcl.Y, npcl.Z));
            g.vertices.push(new THREE.Vector3(npnl.X, npnl.Y, npnl.Z));
            g.vertices.push(new THREE.Vector3(cpcl.X, cpcl.Y, cpcl.Z));
            g.vertices.push(new THREE.Vector3(cpnl.X, cpnl.Y, cpnl.Z));
            
            
            var index = (i * NUM_DEGREE + j) * 4;
            // Create the faces
            g.faces.push(new THREE.Face3(index + 1, index, index + 2));
            g.faces.push( new THREE.Face3(index + 1, index + 2, index + 3));
        }
    }

    return g;
}

ModelCylinder.prototype.BuildMesh = function(){
    this.mesh = CreateMesh(this.Geometry(), vertSh, fragSh);
}

ModelCylinder.prototype.UpdateMesh = function() {
    this.mesh.geometry = this.Geometry();
    this.mesh.geometry.verticiesNeedUpdate = true;
}

ModelCylinder.prototype.GetData = function(){
    var output = {};
    var metaData = {};
    metaData['num_levels'] = this.levels.length;

    output['meta_data'] = metaData;
    output['data'] = {};

    for(var i = 0; i < this.levels.length; i++) {
        var l = {};
        l['num_values'] = NUM_DEGREE;
        l['values'] = this.levels[i].radus; // I am doing it this vay because I was getting incosistant results when saving as a string array
        output['data'][i] = l;
    }

    console.log(output);

    return output;
}

ModelCylinder.prototype.CreateFromData = function(data) {
    var metadata = data['meta_data'];
    var levelsData = data['data'];

    for(i in levelsData){
        var lData = levelsData[i];
        var vals = lData['values'];
        var numVals = lData['num_values'];
        
        var arr = new Float32Array(numVals);

        // I am doing it this vay because I was getting incosistant results when saving as a string array
        for(i in vals){
            arr[i] = vals[i];
        }

        var l = new Level();
        l.radus = arr.slice();

        this.levels.push(l);
    }

    this.BuildMesh();
    this.loaded = true;
}

ModelCylinder.prototype.Widen = function(ammount, level) {
    for(var i = 0; i < NUM_DEGREE; i++){
        this.levels[level].radus[i] += ammount; 
    }

    this.UpdateMesh();
}

ModelCylinder.prototype.GetCylPoint = function(x, y){
    var output = new CylPoint();

    var level = this.levels[y];
    var radius = level.radus[x];

    var angle = tao * (x / NUM_DEGREE);

    /*
    var currentRad = level.radus[currentIndex];

    var currentPercent = currentIndex / NUM_DEGREE;

    var currentAngle = currentPercent * tao;

    var currentX = Math.cos(currentAngle) * currentRad;
    */

    output.Angle =  angle;
    output.Level = y;
    output.Radius = radius;

    return output;
}

ModelCylinder.prototype.GetPoint = function(cylPoint) {
    var output = new Point();

    output.X = Math.cos(cylPoint.Angle) * cylPoint.Radius;
    output.Z = Math.sin(cylPoint.Angle) * cylPoint.Radius;

    output.Y = cylPoint.Level * levelHeight;

    return output;
}