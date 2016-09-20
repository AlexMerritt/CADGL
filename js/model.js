var NUM_DEGREE = 360;
var tao = Math.PI * 2.0;
var levelHeight = 3;

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
void main()
{
    float minIntensity = 0.4;

    vec3 color = vec3(1.2, 0.9, 0.0);
    vec3 light = normalize(vec3(0.0, 0.0, 1.0));

    float intensity = max(0.0, dot(light, vNormal));

    // Normalize the points from nimIntensity to 1.0
    intensity = ((1.0 - intensity) * minIntensity) + intensity;
    
    color = color * intensity;
    gl_FragColor = vec4(color, 1.0);
}
`;

var fragBackSh = `
varying vec3 vNormal;
void main()
{
    float minIntensity = 0.4;
    vec3 color = vec3(0.0, 0.7, 0.0);
    vec3 light = normalize(vec3(0.0, 0.0, -1.0));

    float intensity = max(0.0, dot(light, vNormal));

    // Normalize the points from nimIntensity to 1.0
    intensity = ((1.0 - intensity) * minIntensity) + intensity;
    
    color = color * intensity;
    gl_FragColor = vec4(color, 1.0);
}
`;

// Struct Level
function Level() {
    this.radius = new Array(NUM_DEGREE);
}

function CylPoint() {
    this.Angle = 0;
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

Model.prototype.LoadModelFromData = function(data, callback){
    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {

        console.log( item, loaded, total );

    };

    var loader = new THREE.OBJLoader(manager);
    loader.loadFromData(data, function(model){

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

Model.prototype.FaceIndexToModelPoint = function(faceIndex){
    return null;
} 

ModelCylinder.prototype = new ModelAbs();
ModelCylinder.prototype.constructor = ModelCylinder;

function ModelCylinder(){
    
    this.levels = [];
    this.snapshot = [];
}

ModelCylinder.prototype.Create = function(numLevels) {
    for(var i = 0; i < numLevels; i++) {
        var l = new Level();

        for(var j = 0; j < NUM_DEGREE; j++) {
            l.radius[j] =  50 + (Math.sin((i * 8) / numLevels) * 10);
            //l.radius[j] = Math.random() * 25 + 75;
        }

        this.levels.push(l);
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
            var nextIndex = (j + 1) % NUM_DEGREE;
            var cpcl = this.GetPoint(this.GetCylPoint(j, i));
            var cpnl = this.GetPoint(this.GetCylPoint(j, i + 1));
            var npcl = this.GetPoint(this.GetCylPoint(nextIndex, i));
            var npnl = this.GetPoint(this.GetCylPoint(nextIndex, i + 1));

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

    g.computeFaceNormals();

    return g;
}

ModelCylinder.prototype.UpdateGemotryArea = function(startLevel, numLevels, startRad, numRads){
    //var g = nre THREE.G
}

ModelCylinder.prototype.BuildMesh = function(){
    this.mesh = CreateMesh(this.Geometry(), vertSh, fragSh, fragBackSh);
}

ModelCylinder.prototype.UpdateMesh = function() {
    // All chlidren's meshes need to be updated
    var g = this.Geometry();
    for(i in this.mesh.children){
        this.mesh.children[i].geometry = g;
        this.mesh.children[i].verticiesNeedUpdate = true;
    }
    
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
        l['values'] = this.levels[i].radius; // I am doing it this vay because I was getting incosistant results when saving as a string array
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
        l.radius = arr.slice();

        this.levels.push(l);
    }

    this.BuildMesh();
    this.loaded = true;
}

ModelCylinder.prototype.Widen = function(amount, level) {
    console.log("model widen");
    for(var i = 0; i < NUM_DEGREE; i++){
        this.levels[level].radius[i] += amount; 
    }

    this.UpdateMesh();
}

ModelCylinder.prototype.Extrude = function(amount, radius){
    // modify all radius that are +- 5 away
    var strength = 5;

    for(i in this.levels){
        for(var j = radius - strength; j <= radius + strength; j++){
            var radIndex = (radius + (j + NUM_DEGREE)) % NUM_DEGREE;
            
            var dist = (strength - Math.sqrt((radius - j) * (radius - j))) / strength;
            dist *= dist;
            this.levels[i].radius[radIndex] += amount * dist;
        }
    }

    this.UpdateMesh();
}

ModelCylinder.prototype.Carve = function(amount, level, radius) {
    var strength = 10;
    var radDist = strength;
    var levelDist = Math.floor(strength / levelHeight);
    var numLevels = this.levels.length;
    for(var i = -levelDist; i <= levelDist; i++){
        for(var j = -radDist; j <= radDist; j++){
            var curLvDist = i / levelDist;
            var curRdDist = j / radDist;
            var dist = Math.sqrt((curLvDist * curLvDist) + (curRdDist * curRdDist));

            if(dist <= 1.0001) {
                var levelIndex = Math.min(Math.max(0, i + level), numLevels);
                var radIndex =   (radius + (j + NUM_DEGREE)) % NUM_DEGREE;

                this.levels[levelIndex].radius[radIndex] = this.snapshot[levelIndex].radius[radIndex] + amount;
            }
        }
    }

    this.UpdateMesh();
}

ModelCylinder.prototype.GetCylPoint = function(x, y){
    var output = new CylPoint();

    var level = this.levels[y];
    var radius = level.radius[x];

    // Angle in rads
    var angle = tao * (x / NUM_DEGREE);

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

ModelCylinder.prototype.FaceIndexToModelPoint = function(faceIndex){
    var output = new CylPoint();
    output.Level = Math.floor((faceIndex / 2) / NUM_DEGREE);
    output.Angle = Math.floor((faceIndex/2) % NUM_DEGREE);
    return output;
} 

ModelCylinder.prototype.StartMod = function(){
    // copy
    console.log("start mod");
    for (var i =0; i < this.levels.length; ++i) {
        var l = new Level();
        l.radius = new Float32Array(this.levels[i].radius);
        this.snapshot[i] = l;
    }
}

ModelCylinder.prototype.EndMod = function() {
    console.log("mod end");
    this.snapshot = [];
}