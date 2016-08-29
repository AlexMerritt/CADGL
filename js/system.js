var Database = new FirebaseDB();

function System() {
    this.renderer = new Renderer();
    this.scene = new MainScene();
    

    console.log(this.scene);
}

System.prototype.Run = function() {
    // Run the application
    this.Frame();
}

System.prototype.Frame = function(){
    
    this.Update();
    this.Render();

    requestAnimationFrame(this.Frame.bind(this));
}

System.prototype.Update = function(){
    this.scene.Update();

    this.renderer.Update();
}

System.prototype.Render = function(){
    this.renderer.Render(this.scene);
}