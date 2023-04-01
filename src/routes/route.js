const express = require('express')
const router = express.Router()

const { Authentication, Authorization } = require('../middleware/auth')

const { createUsersData, userLogin, getUser, updateUserData, deletedUser } = require('../controllers/usersController')
const { createPost, getPosts, getAllPosts, updatePostData, deletedPost } = require('../controllers/postsController')

//USER
router.post('/newUser', createUsersData)
router.post('/login', userLogin)
router.get("/user/:userId/profile", Authentication, getUser)
router.put("/user/:userId/profile", Authentication, Authorization, updateUserData)
router.delete("/user/:userId", Authentication, Authorization, deletedUser)

//POSTS
router.post('/newPost', Authentication, createPost)
router.get("/post/:postId/posts", Authentication, getPosts)
router.get("/posts", Authentication, getAllPosts)
router.put("/post/:postId/updatepost", Authentication, updatePostData)
router.delete("/post/:postId", Authentication, deletedPost)
module.exports = router