import mongoose from "mongoose"
const Schema = mongoose.Schema

const PostagemSchema = new Schema({
    titulo: {
        type: String
    },
    slug: {
        type: String
    },
    descricao: {
        type: String
    },
    conteudo: {
        type: String
    },
    categoria: {
        type: Schema.Types.ObjectId,
        ref: "categorias"
    },
    data: {
        type: Date,
        default: Date.now()
    }
})

const Postagem = mongoose.model('Postagem', PostagemSchema);

export default Postagem