const postModel = require('../models/postsModel')
const validator = require('../validator/validator')
const userModel = require('../models/usersModel')
const redis = require('redis')
const { promisify } = require("util");


//======================================redis preparing=============================
const redisConnect = redis.createClient(
    10601,
    "redis-10601.c212.ap-south-1-1.ec2.cloud.redislabs.com",

    { no_ready_check: true, legacyMode: true }
);

redisConnect.auth("kDeXAKuAxskvd0Nnm45BSV341noNbWHR", function (err) {
    if (err) throw err;
});

redisConnect.on("connect", async function () {
    console.log("Redis is Connected...");
});

//2. Prepare the functions for each command

const SET_ASYNC = promisify(redisConnect.SETEX).bind(redisConnect);
const GET_ASYNC = promisify(redisConnect.GET).bind(redisConnect);


//==========================================create posts========================================
const createPost = async (req, res) => {
    try {

        let data = req.body
        let tokenUserId = req.token
        const { createdBy, message, comments, ...rest } = data

        //--------------------- Checking Mandotory Field ---------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "Body cannot be empty. please Provide Mandatory Fields  (i.e. createdBy, message,and  comments). " });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "Only createdBy, message,and  comments should be present " }) }

        //----------------- Checking the userId is Valid or Not ------------------//
        if (!validator.isValidObjectId(createdBy)) return res.status(400).send({ status: false, message: `Given userId: ${createdBy} is not Valid` })

        if (createdBy !== tokenUserId) { return res.status(403).send({ status: false, message: "Ooops !!!...Not authorized ." }) }

        let postCreated = await postModel.create(data)

        return res.status(201).send({ msg: 'post created successfully', data: postCreated })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }

}

//================================get post data by given postId==========================
const getPosts = async (req, res) => {

    try {

        let postId = req.params.postId

        //----------------- Checking the postId is Valid or Not ------------------//
        if (!validator.isValidObjectId(postId)) return res.status(400).send({ status: false, message: `Given postId: ${postId} is not Valid` })

        let cachePostdata = await GET_ASYNC(`${postId}`);
        if (cachePostdata) {
            let postData = JSON.parse(cachePostdata)
            return res.status(200).send({ status: true, message: "Post details", data: postData })
        } else {


            //----------------------Fetching post data ------------------------//

            let getPost = await postModel.findOne({ _id: postId })
                .populate('createdBy', 'name email mobile')
                .populate('comments.sentBy', 'name email mobile')
                .populate('comments.liked', 'name email mobile')


            if (!getPost) {
                return res.status(404).send({ status: false, message: "post  not found" })
            } else {
                await SET_ASYNC(`${postId}`, 60 * 5, JSON.stringify(getPost))
                return res.status(200).send({ status: true, message: "Post details", data: getPost })
            }


            // if (!getPost) return res.status(404).send({ status: false, message: "Post Data Not Found" })

            //  return res.status(200).send({ status: true, message: "Post details", data: getPost })

        }

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}

//==============================get all post data ============================
const getAllPosts = async (req, res) => {


    try {

        //----------------------Fetching post data ------------------------//

        let getPost = await postModel.find()
            .populate('createdBy', 'name email mobile')
            .populate('comments.sentBy', 'name email mobile')
            .populate('comments.liked', 'name email mobile')
        if (!getPost) return res.status(404).send({ status: false, message: "Post Data Not Found" })

        return res.status(200).send({ status: true, message: "Post details", count: getPost.length, data: getPost })



    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}

//=======================update post data===============================

const updatePostData = async (req, res) => {

    try {

        let data = req.body
        let postId = req.params.postId

        let { createdBy, message, comments, ...rest } = data

        //--------------------- Checking Mandotory Field ---------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "Body cannot be empty. please Provide Mandatory Fields  (i.e. createdBy, message,and  comments). " });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "Only createdBy, message,and  comments should be present " }) }


        //----------------- Checking the postId is Valid or Not ------------------//
        if (!validator.isValidObjectId(postId)) return res.status(400).send({ status: false, message: `Given postId: ${postId} is not Valid` })

        let obj = {}
        obj.createdBy = createdBy
        obj.message = message
        obj.comments = comments

        let updatedPost = await postModel.findOneAndUpdate({ _id: postId }, { $set: obj }, { new: true })

        if (!updatedPost) { return res.status(200).send({ status: true, message: "Post not exist with this UserId." }) }

        return res.status(200).send({ status: true, message: "Post has been updated", data: updatedPost })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}

//==============================delete the post by postId================================
const deletedPost = async (req, res) => {

    try {

        let postId = req.params.postId

        if (!validator.isValidObjectId(postId)) return res.status(400).send({ status: false, message: `Given PostId: ${postId} is invalid` })
        let deletedPost = await postModel.findByIdAndDelete({ _id: postId }, { new: true })

        if (!deletedPost) { return res.status(404).send({ status: false, message: "post is not found or Already Deleted!" }) }

        return res.status(200).send({ status: true, message: "post Successfully Deleted" })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { createPost, getPosts, getAllPosts, updatePostData, deletedPost }
