var imageUrl = 'http://wx.qlogo.cn/mmopen/X9TBEb60ldKDRW8Y6AcT9EiaplXnNSeLr5ArWUFFhOHiciaiaHLE6359SOkicYCAu90uqGBaONiciaVenziaddoDHdB61Rwc3PdN6DG1/0';

var http = require("http");
var fs = require("fs");

http.get(imageUrl, function(res){
    var imgData = "";

    res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开


    res.on("data", function(chunk){
        imgData+=chunk;
    });

    res.on("end", function(){
        fs.writeFile("mmmg.jpeg", imgData, "binary", function(err){
            if(err){
                console.log("down fail");
            }
            console.log("down success");
        });
    });
});


