function Mod(){

}

Mod.prototype.Modify = function(){

}

WidenMod.prototype = new Mod();
WidenMod.prototype.constructor = WidenMod;

function WidenMod(){

}
