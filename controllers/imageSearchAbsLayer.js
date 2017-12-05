const GoogleImages = require('google-images');

const client = new GoogleImages('017698998051357428308:lgojtdhciyo', 'AIzaSyAuVztgg-hqO-V3aiVuMHA8ag47FXB_H2o');

var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://localhost:27017/mydb"; 
var url = "mongodb://otaree:1010101010@ds129926.mlab.com:29926/image-search-abs"

function checkNumber(num) {
  var length = num.length;
  length -= 1;
  var firtDig = num[0];
  return (parseInt(firtDig) + 1) * (Math.pow(10,length));
}

function parseImages(images) {
  var arr = [];
  for (var i = 0; i < images.length; i++) {
      var obj = {};
      obj["url"] = images[i].url;
      obj["snippet"] = images[i].description;
      obj["thumbnail"] = images[i].thumbnail.url;
      obj['context'] = images[i].parentPage;
      arr.push(obj);
  }
  return arr;
}

function resultOffset(arr, offset) {
  var returnArr = [];
  for (var i = 0; i < offset; i++) {
      returnArr.push(arr[i]);
  }
  return returnArr;
}

function searchImages(term, offset, response) {
  var imageList = [];
  var num;
  if (parseInt(offset) % 10 === 0) {
      num = parseInt(offset);
  } else {
      num = checkNumber(offset);
  }

  var pages = Math.ceil(num / 10);
  var counter = 0;

  for (var i = 1; i <= pages; i++) {
      client.search(term, {
              page: i
          })
          .then(images => {
              imageList = imageList.concat(parseImages(images));
              counter++;
              if (counter === pages) {
                  var parsedImages = resultOffset(imageList, parseInt(offset));
                  response.json(parsedImages);
              }
          });

  }

}


module.exports = function (app) {
  app.get("/api/imagesearch/:id", function (req, res) {
    var offset = req.query.offset;
    var term = req.params.id;
    var date = new Date(Date.now());
    var obj = {
      "term": term,
      "when": date.toISOString()
    };
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      db.collection("recent-search").insertOne(obj, function (err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });
    searchImages(term, offset, res);

  });

  app.get('/api/latest/imagesearch/', function(req, res) {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      db.collection("recent-search").find({}, { _id: false, term: true, when: true }).sort({_id: -1}).limit(10).toArray(function(err, result) {
        if (err) throw err;
        db.close();
        res.json(result);
      });
    });
  });
};