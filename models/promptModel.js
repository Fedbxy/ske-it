import mongoose from "mongoose";


const promptSchema = new mongoose.Schema({
    word:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase:true,
        maxlength: 10
    }
},
    {timestamps: true});

module.exports = mongoose.model("Prompt", promptSchema);