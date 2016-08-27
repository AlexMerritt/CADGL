function Database(){

}

Database.prototype.GetModel = function(path, callback) {
}

Database.prototype.SaveModel = function(path, callback) {

}

/*
//Database retrival and updating examples
var id = this.DBAdd("model", {
    data: "1,2,3,4,5"
});

this.DBGet('model/' + id, function(data){
    console.log(data);
});

// Example of saving model to the database storage
var d = this.cylnd.GetData();

var blob = new Blob([JSON.stringify(d)]);

Database.StorageAdd("Model/cylnd.cyl", blob);
*/

FirebaseDB.prototype = new Database();
FirebaseDB.prototype.constructor = FirebaseDB;

function FirebaseDB() {
    this.fbref;
    this.Init();
}

FirebaseDB.prototype.Init = function() {
    var config ={
        databaseURL : "cadgl-799c5.firebaseio.com",
        storageBucket: "gs://cadgl-799c5.appspot.com"
    }

    firebase.initializeApp(config);

    this.database = firebase.database().ref();
    this.storage = firebase.storage().ref();

    
}

FirebaseDB.prototype.DBAdd = function(path, data){
    var newPostRef = this.database.child(path).push();
    newPostRef.set(data);
    return newPostRef.key;
}

FirebaseDB.prototype.DBGet = function(path, callback) {
    this.database.child(path).on('value', function(snapshot){
        callback(snapshot.val());
    });
}

FirebaseDB.prototype.StorageAdd = function(path, data) {
    this.storage.child(path).put(data).then(function(snapshot){
        console.log("uploaded to storage");
    });
}

FirebaseDB.prototype.StorageGetData = function(path, callback) {
    this.StorageGetUrl(path, function(url) {
        var xmlHttp = new XMLHttpRequest();

        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                callback(xmlHttp.responseText);
            }
        }

        xmlHttp.open( "GET", url, true ); // false for synchronous request
        xmlHttp.send( null );
    });
}

FirebaseDB.prototype.StorageGetUrl = function(path, callback) {
    this.storage.child(path).getDownloadURL().then(function(url){

        callback(url);
    }).catch(function(error) {
        switch (error.code) {
            case 'storage/object_not_found':
                console.log('file does not exist');
                break;

            case 'storage/unauthorized':
                console.log('unauthroized to access file');
                break;

            case 'storage/canceled':
                console.log('Update cancled');
                break;

            case 'storage/unknown':
                console.log('unknown error');
                break;
        }
    });
}