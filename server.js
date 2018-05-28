require('dotenv').config()

// BASE SETUP
// =============================================================================

// call the packages we need
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Client = require('mariasql');
let isConnected = false;
var c = new Client();
var http = require('http');
const request = require('request');
connectToDB(c);





// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


setInterval(function () { 
  connectToDB(c);
   c.query('SELECT 1',
          {},
          function(err, rows) {
    if (err){
      console.log(err)
    }
  });
}, 1000*10);

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();

function queryAllEvents(req, res){
  var eventsTable;
  c.query('SELECT * FROM events',
          {},
          function(err, rows) {
    if (err){
      console.log(err)
    }
    eventsTable = rows;
    res.json(eventsTable);
  });
}

function queryOneEvent(req, res){
    var event;
      c.query('SELECT * FROM events WHERE id=:id',
              {id : req.params.event_id},
              function(err, rows) {
        if (err){
          console.log(err)
        }
        event = rows;
        res.json(event);
    });
}


function connectToDB(c){
  if(!c.connected){
    try{
      c.connect({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        db: process.env.DB_NAME,
        charset: 'utf8mb4'
      });
    }
    catch(er){
      console.log('Did not connect to DB :')
      console.log(er)
    }
  }
}

process.on('uncaughtException', function(error){
  console.log(error)
})

router.get('/', function(req, res) {
  if(c.connected){
    queryAllEvents(req, res)
  }
  else{
    res.json({'error':'Not Connected'})
  }
    
});

router.get('/:event_id', function(req, res) {
  if(c.connected){
    queryOneEvent(req, res)
  }
  else{
    res.json({'error':'Not Connected'})
  }

});

router.get('/ticket/code=:code&name=:name', function(req, res) {
  request(process.env.BILLETTERIE_HOST + 'search?code=' + req.params.code
    + '&name=' + req.params.name, 
    {json: true}, (err, result, body) =>{
    if(err){
      console.log(err)
      res.json({"error":err})
      return;
    }
    res.json(result)

  })
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(process.env.SERVER_PORT, _ => console.log(`Magic happens on port ${process.env.SERVER_PORT}`));
