import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local";
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import Usuarios from '../models/Usuario.js'
const Usuario = mongoose.model("usuarios")


const Passport = function(passport){
    //código aqui dentro
    passport.use(new LocalStrategy({usernameField: 'email', passwordField: "senha"}, (email, senha, done) => {

        Usuario.findOne({email: email}).then((usuario) => {
            if(!usuario){
                return done(null, false, {message: "Esta conta não existe"})
            }

            bcrypt.compare(senha, usuario.senha, (erro, batem) => {
                if(batem){
                    return done(null,usuario)
                }else{
                    return done(null,false,{mesage: "Senha incorreta"})
                }
            })
        })
    }))
    
    passport.serializeUser((usuario,done)=>{
        done(null,usuario.id)
    })
    
    passport.deserializeUser((id,done)=>{
        Usuario.findById(id).then((usuario)=>{
            done(null,usuario)
        }).catch((err)=>{
             done (null,false,{message:'Algo deu errado'})
        })
    
    
    })
}

export default Passport