const userModel = require('../models/usersModel')
const bcrypt = require("bcrypt")
const JWT = require('jsonwebtoken')
const validator = require('../validator/validator')

const createUsersData = async (req, res) => {
    try {
        let data = req.body
        const { name, email, mobile, password, ...rest } = data

        //--------------------- Checking Mandotory Field ---------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "Body cannot be empty. please Provide Mandatory Fields (i.e. fname, lname, email, profileImage, phone, password & address). " });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "Only fname, lname, email, profileImage, phone, password & address should be present" }) }

        if (!validator.isValidInput(name)) { return res.status(400).send({ status: false, message: 'Please enter name' }) }
        if (!validator.isValidName(name)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... name accepts only Alphabets' }) }

        if (!validator.isValidInput(email)) { return res.status(400).send({ status: false, message: 'Please enter the EmailId' }) }
        if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... Please provide valid emailId' }) }

        if (!validator.isValidInput(mobile)) { return res.status(400).send({ status: false, message: 'Please enter the Mobile Number' }) }
        if (!validator.isValidMobileNumber(mobile)) { return res.status(400).send({ status: false, message: 'INVALID INPUT... Please provide valid Mobile Number' }) }

        if (!validator.isValidInput(password)) { return res.status(400).send({ status: false, message: 'Please enter the password' }) }
        if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "Invalid Password Format. password can have minimum 8 character and max 15 character and must contains one number, one uppar alphabet, one lower alphabet and one special character" }) }

        data.password = await bcrypt.hash(password, 10) //Encrepting the password using Bcrypt

        //------------------------ Checking the given Email or Phone is already Present or Not ---------------//

        const isDuplicateEmail = await userModel.findOne({ $or: [{ email: email }, { mobile: mobile }] })
        if (isDuplicateEmail) {
            if (isDuplicateEmail.email == email) { return res.status(400).send({ status: false, message: `Provided EmailId: ${email} is already exist!` }) }
            if (isDuplicateEmail.mobile == mobile) { return res.status(400).send({ status: false, message: `Provied Mobile No.: ${mobile} is already exist!` }) }
        }



        let userCreated = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User created successfully", data: userCreated })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}




//===================== [function is used for Login the User] =====================//
const userLogin = async (req, res) => {

    try {

        let data = req.body

        let { email, password, ...rest } = data

        //------------------- Checking Mandotory Field ------------------//
        if (!validator.checkInput(data)) return res.status(400).send({ status: false, message: "You have to input email and password." });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "You can enter only email and password." }) }

        //------------------------- Validations -----------------//
        if (!validator.isValidInput(email)) return res.status(400).send({ status: false, message: "EmailId required to login" })
        if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: "Invalid EmailID. Please input all letters in lowercase." }) }

        if (!validator.isValidInput(password)) return res.status(400).send({ status: false, message: "Password required to login" })
        if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "Invalid Password Format. password should be have minimum 8 character and max 15 character and must contains one number, one uppar alphabet, one lower alphabet and one special character " }) }

        //-------------------- Fetching user's Data from DB -------------------//
        const userData = await userModel.findOne({ email: email })
        if (!userData) { return res.status(401).send({ status: false, message: "Invalid Login Credentials! You need to register first." }) }

        //--------------- Decrypt the Password and Compare the password with User input ----------------//
        let checkPassword = await bcrypt.compare(password, userData.password)

        if (checkPassword) {

            const token = JWT.sign({ userId: userData['_id'].toString() }, "safezone", { expiresIn: 60 * 60 });

            let obj = { userId: userData['_id'], token: token }

            return res.status(200).send({ status: true, message: 'User login successfull', data: obj })

        } else {

            return res.status(401).send({ status: false, message: 'incorrect Password' })
        }

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}



//===================== This function is used for Get Data of User =====================//
const getUser = async function (req, res) {

    try {

        let userId = req.params.userId
        let tokenUserId = req.token

        //----------------- Checking the userId is Valid or Not ------------------//
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `Given UserId: ${userId} is not Valid` })

        if (userId !== tokenUserId) { return res.status(403).send({ status: false, message: "Not authorized to get User Details." }) }

        //----------------------Fetching user's data ------------------------//
        let getUser = await userModel.findOne({ _id: userId })
        if (!getUser) return res.status(404).send({ status: false, message: "User Data Not Found" })

        return res.status(200).send({ status: true, message: "User profile details", data: getUser })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}



//===================== [function used for Update the User] =====================//
const updateUserData = async (req, res) => {

    try {

        let data = req.body
        let userId = req.params.userId

        let { name, email, mobile, password, ...rest } = data

        //--------------- Checking Mandotory Field --------------------//
        if (!(validator.checkInput(data))) return res.status(400).send({ status: false, message: "Atleast select one field Update from the list: (fname or lname or email or profileImage or phone or password or address)" });
        if (validator.checkInput(rest)) { return res.status(400).send({ status: false, message: "Provide only fname or lname or email or profileImage or phone or password or address." }) }

        //object for storing updated fields
        let obj = {}

        //---------------------- Validations -----------------//
        if (name || name == '') {
            if (!validator.isValidInput(name)) return res.status(400).send({ status: false, message: 'Please provide input for name' })
            if (!validator.isValidName(name)) return res.status(400).send({ status: false, message: 'name should be in Alphabets' })
            obj.name = name
        }

        if (email || email == '') {
            if (!validator.isValidInput(email)) return res.status(400).send({ status: false, message: 'Please provide input for email' })
            if (!validator.isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }
            obj.email = email
        }
        if (mobile || mobile == '') {
            if (!validator.isValidInput(mobile)) return res.status(400).send({ status: false, message: 'Please provide input for mobile' })
            if (!validator.isValidMobileNumber(mobile)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }
            obj.mobile = mobile
        }
        if (password || password == '') {
            if (!validator.isValidInput(password)) return res.status(400).send({ status: false, message: 'Please provide input password' })
            if (!validator.isValidpassword(password)) { return res.status(400).send({ status: false, message: "password must contain minimum 8 character and max 15 character and one number, one uppar alphabet, one lower alphabet and one special character" }) }
            obj.password = await bcrypt.hash(password, 10)
        }

        let updatedUser = await userModel.findOneAndUpdate({ _id: userId }, { $set: obj }, { new: true })

        if (!updatedUser) { return res.status(200).send({ status: true, message: "User not exist with this UserId." }) }

        return res.status(200).send({ status: true, message: "User profile has been updated", data: updatedUser })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}



//===================== [function for Delete User] =====================//

const deletedUser = async (req, res) => {

    try {

        let userId = req.params.userId

        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `Given ProductId: ${productId} is invalid` })
        let deletedUser = await userModel.findByIdAndDelete({ _id: userId }, { new: true })

        if (!deletedUser) { return res.status(404).send({ status: false, message: "User is not found or Already Deleted!" }) }

        return res.status(200).send({ status: true, message: "User Successfully Deleted" })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createUsersData, userLogin, getUser, updateUserData, deletedUser }