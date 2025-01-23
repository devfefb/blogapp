// Carregando módulos
import express from 'express';
const app = express();
import {engine}  from 'express-handlebars';
import mongoose from 'mongoose';
import admin from './routes/admin.js';
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import session from 'express-session'
import flash from 'connect-flash'
import Postagem from './models/Postagem.js'
import Categoria from './models/Categoria.js'
import usuarios from './routes/usuario.js'
import passport from 'passport';
import auth from './config/auth.js'
auth(passport);

//Configurações
    // Sessão
        app.use(session({
            secret: 'cursodenode',
            resave: true,
            saveUninitialized: true
        }))

        app.use(passport.initialize())
        app.use(passport.session())
        app.use(flash())
    // Middleware
        app.use((req,res,next) => {
            res.locals.success_msg = req.flash('success_msg')
            res.locals.error_msg = req.flash('error_msg')
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null;
            next()
        })
    // Body Parser
        app.use(express.urlencoded({extended: true}));
        app.use(express.json());
    // Handlebars
        app.engine('handlebars', engine());
        app.set('view engine', 'handlebars');
        app.set('views', './views');
        app.engine('handlebars', engine({defaultLayout: 'main'}))
    // Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect("mongodb://127.0.0.1:27017/blogapp")
.then(() => {
            console.log("Conectado ao mongo")
        }).catch((err) => {
            console.log("Erro ao se conectar: "+err)
        })
    // Public
        app.use(express.static(path.join(__dirname, 'public')))

//Rotas
    app.get('/', (req, res) => {
        Postagem.find().lean().populate({path: 'categorias', strictPopulate: false}).sort({data: "desc"}).then((postagens) => {
            res.render("index", {postagens: postagens})
        }).catch((err) => {
            req.flash('error_msg','Houve um carregar postagens')
            console.log("Erro ao carregar postagens: ", err)
            res.redirect('/404')
        })
    })

    app.get("/postagem/:slug", (req, res) => {
        const slug = req.params.slug
        Postagem.findOne({slug}).then((postagem) => {
            if(postagem) {
                const post = {
                    titulo: postagem.titulo,
                    data: postagem.data,
                    conteudo: postagem.conteudo
                }
                res.render("postagem/index", post)
            }else{
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect("/")
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            console.log("Houve um erro interno: "+err)
            res.redirect("/")
        })
    })

    app.get("/categorias/:slug", (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if(categoria) {
                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render("categorias/postagens", {postagens: postagens, categoria: categoria})

                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro ao listar os posts!")
                    console.log("Houve um erro ao listar os posts: "+err)
                    res.redirect("/")
                })

            }else{
                req.flash("error_msg", "Esta categoria não existe")
                console.log("Esta categoria não existe: "+err)
                res.redirect("/")
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao carregar a página desta categoria")
            console.log("Houve um erro interno ao carregar a página desta categoria: "+err)
            res.redirect("/")
        })
    })


    app.get("/404", (req, res) => {
        res.send("Erro 404!")
    })

    app.get("/categorias", (req,res) => {
        Categoria.find().lean().then((categorias) => {
            res.render("categorias/index", {categorias: categorias})

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao listar as categorias")
            console.log("Houve um erro interno ao listar as categorias: "+err)
            res.redirect("/")
        })
    })


    app.use('/admin', admin)
    app.use('/usuarios', usuarios)

// Outros
const PORTA = 8081
app.listen(PORTA, () => {
    console.log('Servidor rodando...')
})