const JWT = require('jsonwebtoken')
const userModel = require('../models/usersModel')
const validator = require('../validator/validator')



//===================== [Authentication] ======================//
const Authentication = async (req, res, next) => {
    try {

        let token = req.headers['authorization']
        if (!token) { return res.status(400).send({ status: false, message: "Token must be Present" }) }
        token = token.slice(7) //removing Bearer with one whitespace from token

        JWT.verify(token, "safezone", function (error, decodedToken) {
            if (error) {
                return res.status(401).send({ status: false, message: "Invalid Token." })
            } else {
                req.token = decodedToken.userId
                next()
            }
        })

    } catch (error) {

        res.status(500).send({ status: false, error: error.message })
    }
}



//===================== [Authorisation] =====================//
const Authorization = async (req, res, next) => {

    try {

        let userId = req.params.userId

        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `Provided UserId: ${userId} is not valid!` })

        let userData = await userModel.findById(userId)
        if (!userData) return res.status(404).send({ status: false, message: "User Does Not Exist" })

        if (userData['_id'].toString() !== req.token) {
            return res.status(403).send({ status: false, message: "Unauthorized User Access!" })
        }
        next()

    } catch (error) {

        res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { Authentication, Authorization }