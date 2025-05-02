const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Post = require("../models/postModel.js");
const Comment = require("../models/commentModel.js");
const Writer = require("../models/writerModel.js");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const writerId = req.query.writer;
        
        let query = {};
        if (writerId) {
            if(mongoose.Types.ObjectId.isValid(writerId)) {
                query = {_id: writerId};
            } else {
                query = {username: writerId};
            }
        }

        const writers = await Writer.find(query)
        .select("_id username")
        .lean();

        if(!writers.length) {
            return res.status(404).json({message: "Writer/writers hittades inte. Om query, dubbelkolla skrivna query / försök igen senare"})
        }

        const writerIds = writers.map(w => w._id);

        const [posts, comments] = await Promise.all([
            Post.find({writer: { $in: writerIds} })
            .select("title content commentCount writer")
            .lean(),

            Comment.find({writer: { $in: writerIds} })
            .populate('post', 'title')
            .lean()
        ]);
        
        const writerMap = {};
        
        writers.forEach(writer => {
            writer.posts = [];
            writer.commentsByWriter = [];
            writerMap[writer._id.toString()] = writer;
        });

        posts.forEach(post => {
            const writerIdString = post.writer.toString();
            if (writerMap[writerIdString]) {
                writerMap[writerIdString].posts.push(post);
            }
        });

        comments.forEach(comment => {
            const writerIdString = comment.writer.toString();
            if (writerMap[writerIdString]) {
                const cleanComment = {
                    _id: comment._id,
                    content: comment.content, 
                    post: comment.post
                }
                writerMap[writerIdString].commentsByWriter.push(cleanComment);
            }

        })

        const response = Object.values(writerMap);    

        res.status(200).json(response);

    } catch (error) {
        error.message = `GET /api/writers – Kunde inte hämta writers: ${error.message}`;
       next(error)
    }  
});

router.post("/reg", [
    body("username").notEmpty().withMessage("Användarnamn krävs").isLength({ min: 2, max: 20 }).withMessage("Användarnamn måste vara mellan 2 och 20 tecken"),
    body("password").notEmpty().withMessage("Lösenord krävs").isLength({ min: 3, max: 20 }).withMessage("Lösenord måste vara minst 5 tecken, max 20")
], 
async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { username, password } = req.body;

        const newWriter = new Writer({ username, password });
        await newWriter.save();

    
        const token = jwt.sign(
            { id: newWriter._id, username: newWriter.username },
            process.env.JWT_SECRET || '123',
            { expiresIn: "24h" } 
        );

        res.status(201).json({ 
            message: "Användare skapad!", 
            writer: { id: newWriter._id, username: newWriter.username },
            token: token
        });
    } catch (error) {
        error.message = `POST /api/writers/reg – Kunde inte registrera writer: ${error.message}`;
       next(error);
    }
});

router.post("/login", [
    body("username").notEmpty().withMessage("Användarnamn krävs").isLength({ min: 2, max: 20 }).withMessage("Användarnamn måste vara mellan 2 och 20 tecken"),
    body("password").notEmpty().withMessage("Lösenord krävs").isLength({ min: 3, max: 20 }).withMessage("Lösenord måste vara minst 5 tecken, max 20")
], async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); }

    try {
        const {username, password} = req.body;
        const writer = await Writer.findOne({username});

        if(!writer) return res.status(401).json({error: "Ogiltigt användarnamn... eller lösenord?"});

        const isPasswordValid = await bcrypt.compare(password, writer.password);
        if (!isPasswordValid) {
        return res.status(401).json({ error: "Ogiltigt lösen!" }); 
        }
    
        console.log("Inloggad:", writer);

        const token = jwt.sign(
            { id: writer._id, username: writer.username },
            process.env.JWT_SECRET || '123',
            { expiresIn: "24h" } 
        );
      
          res.status(200).json({ message: "Inloggning lyckades", token });
      
        } catch (error) {
            error.message = `POST /api/writers/login – Kunde inte logga in användare: ${error.message}`;
          next(error);
        }
      });

      router.delete('/delete/:id', async (req, res, next) => {
        try {
          const { id } = req.params;

          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
        }
      
          const writerDelete = await Writer.findByIdAndDelete(id);
      
          if (!writerDelete) {
            return res.status(404).json({ error: 'Användaren hittas inte!' });
          }
      
          res.status(200).json({ message: 'Användaren borttagen', Raderad: writerDelete });
      
        } catch (error) {
            error.message = `DELETE /api/writers/delete/:id – Kunde inte radera användare: ${error.message}`;
          next(error)
        }
      });



module.exports = router;