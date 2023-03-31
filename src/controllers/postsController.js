const postModel = require('../models/postsModel')
const validator = require('../validator/validator')
const userModel = require('../models/usersModel')
const redis = require('redis')

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

const createPost = async (req, res) => {
    try {

        let data = req.body
        let tokenUserId = req.token
        const { createdBy } = data

        if (createdBy !== tokenUserId) { return res.status(403).send({ status: false, message: "Ooops !!!...Not authorized ." }) }

        let postCreated = await postModel.create(data)

        return res.status(201).send({ msg: 'post created successfully', data: postCreated })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }

}

const getPosts = async (req, res) => {


    try {

        let postId = req.params.postId

        //----------------------Fetching post data ------------------------//

        let getPost = await postModel.findOne({ _id: postId }).populate('User')
        if (!getPost) return res.status(404).send({ status: false, message: "Post Data Not Found" })

        return res.status(200).send({ status: true, message: "Post details", data: getPost })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}

const updatePostData = async (req, res) => {

    try {

        let data = req.body
        let postId = req.params.postId

        let { createdBy, message, comments, ...rest } = data

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

const deletedPost = async (req, res) => {

    try {

        let postId = req.params.postId

        if (!validator.isValidObjectId(postId)) return res.status(400).send({ status: false, message: `Given PostId: ${postId} is invalid` })
        let deletedPost = await postModel.findByIdAndDelete({ _id: postId }, { new: true })

        if (!deletedPost) { return res.status(404).send({ status: false, message: "post is not found or Already Deleted!" }) }

        return res.status(200).send({ status: true, message: "User Successfully Deleted" })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}
module.exports = { createPost, getPosts, updatePostData, deletedPost }
