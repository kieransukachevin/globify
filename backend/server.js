
// Define variables

const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const request = require('request');
const redirect_uri = 'http://localhost:3000/';
const client_id = '3d474cad631f40028c1f3909186b0686';
const client_secret = 'b49248f3d4df4064a0f1ba0d8d943354';

// Use

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Default

app.get('/', (req, res) => {

});

// Authorization Token

function getAuthorizationToken (req, res, next) {
    var code = req.body.code || null;
    var state = req.body.state || null;

    if (state === null) {
        console.log('Error: State mismatch')
    }
    else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code',
            client_id: client_id,
            client_secret: client_secret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            json: true
        };
    }

    request.post(authOptions, (error, response, body) => {
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }

        res.locals.accessData = body;
        next();
    });
}

// User's Top Artists

function getTopArtists (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else if (!res.locals.accessData) {
        res.locals.error = 'Error retrieving access token';
        next();
    }

    const params = {
        url: 'https://api.spotify.com/v1/me/top/artists',
        headers: {
            'Authorization': 'Bearer ' + res.locals.accessData.access_token,
            'Content-Type': 'application/json'
        },
    }

    request.get(params, (error, response, body) => {
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }

        res.locals.topArtists = [];
        JSON.parse(body).items.forEach(element => {
            res.locals.topArtists.push({
                id: element.id,
                name: element.name
            });
        });
        next();
    });
}

// Artist

function getWikipediaArticleId (req, res, next) {
    console.log(res.locals.topArtists);

    // Get wikipedia article title id

    var url = "https://en.wikipedia.org/w/api.php"; 

    var params = {
        prop: "info",
        action: "query",
        titles: res.locals.topArtists[0].name,
        format: "json"
    };

    url = url + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

    request.get(url, (error, response, body) => {
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }

        res.locals.topArtists[0].entity = Object.keys(JSON.parse(body).query.pages)[0];
        console.log('entity', res.locals.topArtists[0].entity);

        next();
    })
}

function getWikiData (req, res, next) {
  // Get wikipedia data

  var url = "https://wikidata.org/w/api.php";

  var params = {
      action: "wbgetclaims",
      entity: "Q392",
      property: "P569",
      format: "json"
  }

  url = url + "?origin=*";
  Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

  request.get(url, (error, response, body) => {
      console.log('bio', body);

      next();
  })
}


// Code Endpoint

const codeMiddleWare = [getAuthorizationToken, getTopArtists, getWikipediaArticleId, getWikiData];
app.post('/code', codeMiddleWare, (req, res) => {

    if (res.locals.error) {
        res.send(res.locals.error);
        res.locals.error = null;
    }

    res.send(res.locals.userData);
});

const port = process.env.PORT || 4200;

app.listen(port, (err) => {
    if (err) {
        console.log('error: ', err);
    }

    console.log('listening on', port);
});
