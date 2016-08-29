// Class Renderer
function Renderer() {
    this.context = new THREE.WebGLRenderer();
    this.SetWindowSize(1280, 720);

    $('#render-window').append(this.context.domElement);
}

Renderer.prototype.SetWindowSize = function(width, height){
    console.log('setting window size');
    this.context.setSize(width, height);
}

Renderer.prototype.Update = function() {
    this.context.setClearColor(0x7f7f7f, 1 );
}

Renderer.prototype.Render = function(scene) {
    var scenes = scene.GetSceneObject();
    var camera = scene.GetCamera();

    this.context.render(scenes, camera);
}
