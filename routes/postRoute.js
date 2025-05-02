const express = require("express");
const Post = require("../models/postModel.js");
const Comment = require("../models/commentModel.js");
const { authToken } = require("../middleware/authWriter.js");
const { body, validationResult } = require("express-validator");

const router = express.Router();


router.get("/", async (req, res, next) => {
    
    try {
        const posts = await Post.find()
            .populate('writer', 'username') 
            .populate({path: 'comments', select: '_id content writer'})  
        
        res.status(200).json(posts); 
    } catch (error) {
        error.message = `GET /api/posts – Kunde inte hämta post: ${error.message}`;
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
        }

        const post = await Post.findById(id)
            .populate('writer', 'username')
            .populate({path: 'comments', select: '_id content writer'});

        if (!post) {
            return res.status(404).json({ message: "Posten hittades inte." });
        }

        res.status(200).json(post);
    } catch (error) {
        error.message = `GET /api/posts/:id – Kunde inte hämta post: ${error.message}`;
        next(error);
    }
});

router.post("/", authToken, [
    body("title").notEmpty().withMessage("Titel krävs för att skapa Post!")
    .isLength({min: 5, max: 75}).withMessage("Titeln måste vara mellan 5 och 75 tecken långt."),
    body("content").notEmpty().withMessage("Innehåll krävs för att skapa Post!")
    .isLength({min: 10, max: 10000}).withMessage("Content måste vara mellan 10 och 10000 tecken långt.")
 
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

        try {
            const { title, content } = req.body; 
            const newPost = new Post({
                title,
                content,
                writer: req.writer.id
            });
    
            await newPost.save();
            res.status(201).json({ message: "Post skapad", post: newPost });
        } catch (error) {
            error.message = `POST /api/posts – Kunde inte skicka post: ${error.message}`;
            next(error);
        }

});

router.put("/:id", authToken,[
        body("title").optional()
        .notEmpty().withMessage("Titel-value får ej vara tomt om den skickas med i PUT!")
        .isLength({min: 5, max: 75}).withMessage("Titeln måste vara mellan 5 och 75 tecken långt."),
        body("content").optional()
        .notEmpty().withMessage("Content-value får ej vara tomt om den skickas med i PUT!")
        .isLength({min: 10, max: 10000}).withMessage("Content måste vara mellan 10 och 10000 tecken långt.")
      ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

    try {
        const { id } = req.params;
        const { title, content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post hittades inte." });
        }

        if (post.writer.toString() !== req.writer.id) {
            return res.status(403).json({ message: "Du har inte behörighet att uppdatera denna post." });
        }

        if (title) post.title = title;
        if (content) post.content = content;

        await post.save();

        res.status(200).json({ message: "Post uppdaterad!", updatedPost: post });
    } catch (error) {
        error.message = `PUT /api/posts/:id – Kunde inte uppdatera post: ${error.message}`;
        next(error);
    }
});

router.delete("/:id", authToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post hittades inte." });
        }

        if (post.writer.toString() !== req.writer.id) {
            return res.status(403).json({ message: "Du har inte behörighet att ta bort denna post." });
        }

        await Comment.deleteMany({ post: id });

        await Post.findByIdAndDelete(id);

        res.status(200).json({ message: "Post och tillhörande kommentarer raderade." });
    } catch (error) {
        error.message = `DELETE /api/posts/:id – Kunde inte radera post: ${error.message}`;
        next(error);
    }
});




module.exports = router;
