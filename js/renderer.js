// Class Renderer
function Renderer() {
    this.context = new THREE.WebGLRenderer();
    this.SetWindowSize(WINDOW_WIDTH, WINDOW_HEIGHT);

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
