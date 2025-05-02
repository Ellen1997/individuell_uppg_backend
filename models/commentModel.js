const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({

    content: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1000,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Writer",
        required: true,
    }
}, {timestamps: true,
    toJSON: {virtuals: true, versionKey: false, getters: true, transform: (doc, ret) => {
        delete ret.id;
        return ret;
    }},
    toObject: {virtuals: true}
})

module.exports = mongoose.model("Comment", commentSchema)

