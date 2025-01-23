import express from "express";
const router = express.Router();
import mongoose from "mongoose"
import Categoria from "../models/Categoria.js"
import { resolve } from "dns/promises";
import Postagem from "../models/Postagem.js"
import {eAdmin} from "../helpers/eAdmin.js"

router.get('/', eAdmin, (req,res) => {
    res.render("admin/index.handlebars")
})

router.get('/posts', eAdmin, (req,res) => {
    res.send("Página de posts")
})

router.get("/categorias", eAdmin, (req,res) => {
    Categoria.find().lean().sort({date: 'desc'}).then((categorias) => {
        res.render("admin/categorias.handlebars", {categorias: categorias})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as categorias")
        res.redirect("/admin")
        console.log("Erro ao listar as categorias: ", err)
    })
})

router.get("/categorias/add", eAdmin, (req,res) => {
    res.render("admin/addcategorias.handlebars")
})

router.post('/categorias/nova', eAdmin, (req, res) => {
    console.log('Dados recebidos:', req.body);  // Exibe logs dos dados da categoria adicionada

    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({texto: "Slug inválido"})
    }

    if(req.body.nome.length < 2) {
        erros.push({texto: "Nome da categoria é muito pequeno"})
    }

    if(erros.length > 0) {
        res.render("admin/addcategorias", {erros: erros})
    }else{
        const novaCategoria = new Categoria({
            nome: req.body.nome,
            slug: req.body.slug
        });
        novaCategoria.save()
        .then(categoriaSalva => {
            req.flash('success_msg', 'Categoria criada com sucesso!');
            res.redirect("/admin/categorias");
        })
        .catch(err => {
            console.log("Erro ao salvar categoria:", err);  // Log detalhado do erro
            req.flash('error_msg', 'Houve um erro ao salvar a categoria, tente novamente!');
            res.redirect("/admin");
        });
        


    }


});



router.get("/categorias/edit/:id", eAdmin, (req,res) => {   
    Categoria.findOne({_id:req.params.id}).lean().then((categoria) => {
       res.render("admin/editcategorias", {categoria:categoria})
}).catch((err) => { 
       req.flash("error_msg", "Categoria não foi encontrada")
       res.redirect("/admin/categorias")
       console.log("Erro: ", err)
        })
})


router.post('/categorias/edit', eAdmin, (req, res) => {
    Categoria.findOne({_id: req.body.id}).then((categoria) => {
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug
        categoria.save().then(() => {
            req.flash('success_msg','Categoria editada com sucesso!')
            res.redirect("/admin/categorias")

        }).catch((err)=>{
            req.flash('error_msg', 'Houve um erro ao tentar salvar a edição da categoria!')
            res.redirect("/admin/categorias")
            console.log("Erro ao editar a edição da categoria: ", err)
        })

}).catch((err) => {
        req.flash("error_msg", "Houve um erro ao editar a categoria")
        res.redirect("/admin/categorias")
        console.log("Erro ao editar a categoria: ", err)

    })
})

router.post("/categorias/deletar", eAdmin, (req, res) => {
    console.log("ID da categoria recebido:", req.body.id); // Log do ID para ver o valor
    if (!req.body.id) {
        req.flash("error_msg", "ID da categoria não fornecido.");
        return res.redirect("/admin/categorias");
    }

    // Validar se o ID fornecido é um ObjectId válido do MongoDB
    if (!mongoose.Types.ObjectId.isValid(req.body.id)) {
        req.flash("error_msg", "ID de categoria inválido.");
        return res.redirect("/admin/categorias");
    }

    // Agora tente deletar a categoria
    Categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!");
        res.redirect("/admin/categorias");
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao deletar a categoria.");
        res.redirect("/admin/categorias");
        console.log("Erro ao deletar a categoria: ", err);
    });
});


router.get("/postagens", eAdmin, (req, res) => {
    Postagem.find().lean().populate({path: 'categorias', strictPopulate: false}).sort({ data: "desc" }).lean().then((postagens) => {
        res.render("admin/postagens", { postagens: postagens });
      }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as postagens.");
        res.redirect("/admin");
        console.log("Erro ao carregar postagens: ", err)
      });
});


router.get("/postagens/add", eAdmin, (req,res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagem", {categorias: categorias})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário")
        res.redirect("/admin")
        console.log("Erro: ", err)
    })
})

router.post("/postagens/nova", eAdmin, (req, res) => {
    //Recebendo os dados do formulário
    var erros = []

    if(req.body.categoria == 0) {
        erros.push({texto:"Cadastre uma categoria antes de criar uma nova postagem"})
    }

    if (erros.length > 0){
        res.render("admin/addpostagem", {erros: erros})
    } else {
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(novaPostagem).save().then(() => {
            req.flash("success_msg", `Postagem ${req.body.titulo} criada com sucesso`)
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash("error_msg", `Erro ao criar a postagem  ${req.body.titulo}`)
            console.log("Erro ao cadastrar postagem: ",err)
            res.redirect("/admin/postagens")
        })
    }
})

router.get("/postagens/edit/:id", eAdmin, (req, res) => {
    Postagem.findOne({_id: req.params.id}).lean()
    .then((postagem) => {

        Categoria.find().sort({date: 'desc'}).lean()
        .then((categorias) => {
            
            res.render('admin/editpostagens', {categorias: categorias, postagem: postagem
            });
        }).catch(erros => {
            req.flash('error_msg', "Erro ao listar categorias");
            res.redirect('/admin/postagens');
            console.log("Erro ao listar categorias: "+erros)
        })
    })
    .catch((erros) => {
        req.flash("error_msg", "Postagem não existe...");
        res.redirect('/admin');
    })
});

router.post('/postagens/edit', eAdmin, (req, res) => {
    Postagem.findOne({_id: req.body.id}).then((postagem) => {

        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria.trim()

        postagem.save().then(() => {
            req.flash('success_msg','Postagem editada com sucesso!')
            res.redirect("/admin/postagens")

        }).catch((err)=>{
            req.flash('error_msg', 'Houve um erro ao tentar salvar a edição da categoria!')
            res.redirect("/admin/postagens")
            console.log("Erro ao salvar a edição da postagem: ", err)
        })

}).catch((err) => {
        req.flash("error_msg", "Houve um erro ao editar a categoria")
        res.redirect("/admin/postagens")
        console.log("Erro ao editar a categoria: ", err)

    })
})

router.get("/postagens/deletar/:id", eAdmin, (req,res) => {
    Postagem.deleteOne({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Postagem deletada com sucesso!")
        res.redirect("/admin/postagens")
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/admin/postagens")
    })
})


export default router;