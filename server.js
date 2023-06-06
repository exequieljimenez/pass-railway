import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';

const LocalStrategy = Strategy;

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

passport.use(new LocalStrategy(
    async function (username, password, done) {
        const existeUsuario = usuariosDB.find(usuario => usuario.username == username)
        console.log(existeUsuario);
        if(!existeUsuario) {
            return done(null, false)
        } else {
            return done(null, existeUsuario)
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.username)
})

passport.deserializeUser((username, done) => {
    const existeUsuario = usuariosDB.find(user => user.username == username)
    done(null, existeUsuario)
})

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 20000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

function isAuth(req, res, next) {
    if(req.isAuthenticated()){
        next()
    } else {
        res.redirect('/login')
    }
}

const usuariosDB = [];

const productos = [{nombre: "lapiz", precio: 560}, {nombre: 'lapicera', precio: 670}]

app.get('/', (req, res) => {
    res.redirect('/login')
});

app.get('/login', (req, res) => {
    res.send('ingrese sus datos')
});

app.get('/register', (req, res) => {
    res.send('ingrese su username, password y direccion para registrarse')
});

app.post('/register', (req, res) => {
    const {username, password, direccion} = req.body;
    const newUser = usuariosDB.find(user => user.username == username);
    if(newUser) {
        res.send('User already registered')
    } else {
        usuariosDB.push({username, password: password, direccion});
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            throw err
        } else {
            res.redirect('/login')
        }
    })
})

app.get('/productos', isAuth, (req, res) => {
    if(!req.user.contador) {
        req.user.contador = 1
    } else {
        req.user.contador++
    }
    const datosUsuario = {
        username: req.user.username,
        direccion: req.user.direccion
    }

    res.json({contador: req.user.contador, datos: datosUsuario})
})

app.post('/login', passport.authenticate('local', {successRedirect: '/productos', failureRedirect: '/login-error'})) 

app.get('/login-error', (req, res) => {
    res.send('Error al loguearse')
});

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

server.on('error', error => {
    console.error(`Error en el servidor ${error}`)
})