

window.onload = function(){
    
    $( "#render-window" ).mousedown(function(event){
        event.preventDefault();
    });

    // Create the system and run it
    var system = new System();
    system.Run();
};