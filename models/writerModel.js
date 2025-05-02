const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const writerSchema = new mongoose.Schema({

    username: {
        type: String, 
        required: true,
        unique: true, 
        trim: true, 
        minlength: 2, 
        maxlength: 20,
    }, 
    password: {
        type: String, 
        required: true,
        minlength: 3, 
        maxlength: 20,

    }

}, {
    toJSON: {
        virtuals: true, 
        versionKey: false, 
        transform: (doc, ret) => {
            delete ret.password;
            delete ret.id;
            return ret; }
    }, toObject: {virtuals: true}
})

writerSchema.pre('save', async function(next){
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

writerSchema.methods.comparePassword = async function(candidatePassword){
    return bcrypt.compare(candidatePassword, this.password)
};

module.exports = mongoose.model("Writer", writerSchema);