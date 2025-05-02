const express = require("express");
const Post = require("../models/postModel.js");
const Comment = require("../models/commentModel.js");
const { authToken } = require("../middleware/authWriter.js");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
      const comments = await Comment.find()
        .populate({ path: "writer", select: "username"})
        .populate({path: "post", select: "title"})
        .lean();
        
      res.status(200).json(comments);
    } catch (error) {
      error.message = `GET /api/comments – Kunde inte hämta kommentar: ${error.message}`;
      next(error)
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
        }

        const comment = await Comment.findById(id)
            .populate({ path: "writer", select: "username"})
            .populate({ path: "post", select: "title"});

        if (!comment) {
            return res.status(404).json({ message: "Kommentaren hittades inte." });
        }

        res.status(200).json(comment);
    } catch (error) {
        error.message = `GET /api/comments/:id – Kunde inte hämta kommentar: ${error.message}`;
        next(error);
    }
});
  
router.post("/", authToken, [
  body("content")
  .notEmpty().withMessage("Kommentarinnehåll krävs för att skicka kommentar.")
  .isLength({min: 5, max: 1000}).withMessage("Content måste vara mellan 5 och 1000 tecken långt."),
  body("postId").notEmpty().withMessage("postId krävs för att skicka kommentar.")

], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array() });
  }


    try {
      const { content, postId } = req.body;
  
      if (!content || !postId) {
        return res.status(400).json({ message: "Content och postId krävs." });
      }
  
      const comment = new Comment({
        content,
        writer: req.writer.id,
        post: postId
      });
  
      await comment.save();
  
      await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
  
      res.status(201).json({ message: "Kommentar skapad!", comment });
    } catch (error) {
      error.message = `POST /api/comments – Kunde inte skapa kommentar: ${error.message}`;
      next(error)
    }
  });

router.put("/:id", authToken, [
  body("content").notEmpty().withMessage("Kommentarsinnehållet får inte vara tomt!")

], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      return res.status(400).json({errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
    }
  
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ message: "Kommentar hittades inte." });
      }
  
      if (comment.writer.toString() !== req.writer.id) {
        return res.status(403).json({ message: "Du får inte uppdatera denna kommentar." });
      }
  
      comment.content = content;
      await comment.save();
  
      res.status(200).json({ message: "Kommentar uppdaterad.", updatedComment: comment });
    } catch (error) {
      error.message = `PUT /api/comments/:id – Kunde inte uppdatera kommentar: ${error.message}`;
      next(error);
    }
  });
  

router.delete("/:id", authToken, async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Ogiltigt ID. Vänligen ange ett giltigt MongoDB ID." });
    }
  
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ message: "Kommentar hittades inte." });
      }
  
      if (comment.writer.toString() !== req.writer.id) {
        return res.status(403).json({ message: "Du får inte ta bort denna kommentar." });
      }
   
      await Comment.findByIdAndDelete(id);
  
    
      await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
  
      res.status(200).json({ message: "Kommentar raderad." });
    } catch (error) {
      error.message = `DELETE /api/comments/:id – Kunde inte radera kommentar: ${error.message}`;
      next(error);
    }
  });


module.exports = router;
