var MODEL_PATH = "model/";

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
FirebaseDB.prototype.DBUpdate = function(path, data){
    this.database.child(path).set(data);
}

FirebaseDB.prototype.DBAddNew = function(path, data){
    var newPostRef = this.database.child(path).push();
    newPostRef.set(data);
    return newPostRef.key;
}

FirebaseDB.prototype.DBGet = function(path, callback) {
    this.database.child(path).once('value').then(function(snapshot){
        callback(snapshot.val());
    });
}

FirebaseDB.prototype.DBBindTo = function(path, callback) {
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
    console.log("Sending request to firebase");
    this.StorageGetUrl(path, function(url) {
        console.log(url+".json");
        $.ajax({
            type: "GET",
            dataType: 'jsonp',
            url: url+".json",
            crossDomain : true,
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function( data ) {
            console.log("done");
        })
        .fail( function(xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
            console.log(textStatus);
        });

        
        /*
        xmlHttp.onreadystatechange = function() {
            console.log(xmlHttp);
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                callback(xmlHttp.responseText);
            }
        }

        xmlHttp.open( "GET", url, true );
        xmlHttp.send( null );*/
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

FirebaseDB.prototype.GetModelList = function(callback){
    this.DBGet('model_list', function(data){
        var list = [];

        for(i in data){
            list.push(data[i]);
        }
        
        callback(list);
    });
}

// This is only here to manage the firebase database.
// Once the db has too many elements in it, you can no longer
// delete elements in the firebase console
FirebaseDB.prototype.DumpDB = function(){
    this.DBUpdate("/", {});
}