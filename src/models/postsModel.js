const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const postsSchema = new mongoose.Schema({

    createdBy: {
        type: ObjectId,
        ref: 'User',
    },
    message: {
        type: mongoose.Schema.Types.Mixed
    },
    comments: [
        {
            sentBy: {
                type: ObjectId,
                ref: 'User',

            },
            sentAt: {
                type: Date,
                default: Date.now(),
            },
            liked: [
                {
                    type: ObjectId,
                    ref: 'User',
                },
            ],

        },
    ],

}, { timestamps: true })

module.exports = mongoose.model('Posts', postsSchema)