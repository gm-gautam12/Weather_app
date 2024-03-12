import mongoose,{Schema} from "mongoose";


const dataSchema = new Schema({

    city: {
        type: String,
        required: true,
        trim:true,
    },
    country:{
        type: String,
        required: true,
        trim:true,
    },
    icon:{
        type: String,
        required: true,
        trim:true,
    },
    condition:{
        type: String,
        required: true,
        trim:true,
    },
    temperature:{
        type: Number,
        required: true,
        trim:true,
    },
    humidity:{
        type: Number,
        required: true,
        trim:true,
    },
});

export const Data = mongoose.model("Data",dataSchema);