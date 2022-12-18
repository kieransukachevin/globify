
import css from './styles/styles.css';
import * as login from './login';
import axios from 'axios';

function setup() {
    const loginButton = document.getElementById('login-button');
    loginButton.addEventListener('click', login.loginButtonClicked);

    login.getCodeParameter();
}

window.onload = setup;
