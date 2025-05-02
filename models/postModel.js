const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        minlength: 5, 
        maxlength: 75,
    }, 
    content: {
        type: String, 
        required: true,
        minlength: 10,
        maxlength: 10000,
    },
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Writer",
        required: true
    }
}, {timestamps: true, 
    toJSON: {virtuals: true, versionKey: false, getters: true, transform: (doc, ret) => {
        delete ret.id;
        return ret;
    }},
    toObject: {virtuals: true}
 });

 postSchema.virtual('comments', {
    ref: "Comment",
    localField: "_id",
    foreignField: "post",
 });

 postSchema.virtual('commentCount').get(function() {
    if (this.comments) {
        return this.comments.length
    }
    return 0;
 });

module.exports = mongoose.model("Post", postSchema);
