
const express = require('express');
const request = require('request'); // "Request" library
const cors = require('cors')

const router = express.Router();
router.use(cors());

const client_id = '3d474cad631f40028c1f3909186b0686';
const client_secret = 'b49248f3d4df4064a0f1ba0d8d943354';
const redirect_uri = 'http://localhost:4200/main';

router.use((req, res, next) => {
    console.log('middleware');
    next();
});

router.use(express.static('public'));

// Main

router.get('/', (req, res) => {
    console.log('main');

    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        console.log('Error: State mismatch')
    }
    else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };
    }

    request.post(authOptions, (error, response, body) => {
        console.log(body.access_token);
    });

    res.sendFile(__dirname + '/public/main/index.html');
});

// data

router.get('/data', (req, res) => {
    res.json(
        {
            data: 'this works!'
        }
    );
})

module.exports = router;
