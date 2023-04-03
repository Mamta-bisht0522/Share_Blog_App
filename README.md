# Share_Blog_App


Create an API using node js, express js, and MongoDB with the following structure ---
Routes:
/posts
GET: to get posts (should be only available for logged-in users) (pass token via Authorization header.)
POST: to create posts
DELETE: to delete posts (should be only available for creators of post)
PUT: to update posts (should be only available for creators of post)
/users
GET: to get users
POST: to create users
DELETE: to delete users
PUT: to update users
Schema --->
posts - { createdBy: ObjectId(userId), createdAt, updatedAt, message, comments: [{ sentBy:
ObjectId(userId), sentAt, liked: [ObjectId(userId)] }] }
users - {name, email (unique), mobile, password(hashed) }
When you get all posts you should also get user details in place of createdBy, comments: [{ sentBy }]
and liked fields


