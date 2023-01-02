
import css from './styles/styles.css';
import globe from './assets/globe.jpg';
import axios from 'axios';

export async function loginButtonClicked() {
    const client_id = '3d474cad631f40028c1f3909186b0686';
    const redirect_uri = 'http://localhost:3000/';
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email user-top-read';

    console.log('login');

    const url = new URL('https://accounts.spotify.com/authorize?');
    const params = new URLSearchParams(url.search);
    params.set('response_type', 'code');
    params.set('client_id', client_id);
    params.set('scope', scope);
    params.set('redirect_uri', redirect_uri);
    params.set('state', state);

    location.href = url + params.toString();
}

export function getCodeParameter() {
    const url_string = window.location.href;
    const url = new URL(url_string);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (code && state) {

        getUserData(code, state);
        
    }
}

function generateRandomString(size) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length
    for (var i = 0; i < size; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getUserData(code, state) {

    // Loading
    setLoadingArea(document.getElementById('main-area-1'));

    axios.post('http://localhost:4200/code', {
        code: code,
        state: state
    })
    .then(function (response) {
        // var names = '';
        // (response.data.items).forEach(element => {
        //     names += element.name + ', '
        // });
    })
    .catch(function (error) {
        console.log('error:', error);
    });
}

function setLoadingArea(area) {
    // Globe image (Loading)
    const img = new Image();
    img.src = globe;
    img.alt = 'globe';
    img.className = 'loader';

    // Header (Loading)
    const header = document.createElement("h2");
    header.innerHTML = 'Loading';

    // Add to the area
    area.replaceChildren(img, header);
}

function displayUserData(area, data) {
    var names = '';
    (data).forEach(element => {
        names += element.name + ', '
    });
    area.replaceChildren(
        document.createElement('p').innerHTML = names
    );
}
