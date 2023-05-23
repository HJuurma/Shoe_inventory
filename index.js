const express = require('express')
const verifier = require('@gradeup/email-verify')
const bcrypt = require('bcrypt')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000
const {v4: uuidv4} = require('uuid');
const fileUpload = require('express-fileupload');

// Add Swagger UI
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const { readFileSync } = require('fs');
const swaggerDocument = yamlJs.load('./swagger.yml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
    fileUpload({
        limits: {
            fileSize: 10000000,
        },
        abortOnLimit: true,
    })
);
app.use(express.static('public'))
app.use(express.json({ limit: '2000kb' }))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const users = [
    {id: 1, email: 'admin', password: 'KartulKartul'}
]

let shoes
    = [

    {
        id: 1,
        title: 'Shoe 1',
        content: 'This is the content of shoe 1',
        userId: 1
    },
    {
        id: 2,
        title: 'Running shoes',
        brand: 'Nike',
        size: '40',
        content: 'This is an example of a shoe',
        userId: 2
    },
    {
        id: 3,
        title: 'Shoe 3',
        content: 'This is the content of shoe 3',
        userId: 1
    }
]

let sessions = [
    {id: '123', userId: 1}
]

function tryToParseJson(jsonString) {
    try {
        let o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {
    }
    return false;
}

app.post('/users', async (req, res) => {

    // Validate email and password
    if (!req.body.email || !req.body.password) return res.status(400).send('Email and password are required')
    if (req.body.password.length < 8) return res.status(400).send('Password must be at least 8 characters long')
    if (!req.body.email.match(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) return res.status(400).send('Email must be in a valid format')

    // Check if email already exists
    if (users.find(user => user.email === req.body.email)) return res.status(409).send('Email already exists')

    // Try to contact the mail server and send a test email without actually sending it
    try {
        const result = await verifyEmail(req.body.email);
        if (!result.success) {
            return res.status(400).send('Invalid email: ' + result.info)
        }
        console.log('Email verified')
    } catch (error) {
        const errorObject = tryToParseJson(error)
        if (errorObject && errorObject.info) {
            return res.status(400).send('Invalid email: ' + errorObject.info)
        }
        return res.status(400).send('Invalid email: ' + error)
    }

    // Hash password
    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
    } catch (error) {
        console.error(error);
    }

    // Find max id
    const maxId = users.reduce((max, user) => user.id > max ? user.id : max, users[0].id)

    // Save user to database
    users.push({id: maxId + 1, email: req.body.email, password: hashedPassword})

    res.status(201).end()
})

// POST /sessions
app.post('/sessions', async (req, res) => {

    // Validate email and password
    if (!req.body.email || !req.body.password) return res.status(400).send('Email and password are required')

    // Find user in database
    const user = users.find(user => user.email === req.body.email)
    if (!user) return res.status(404).send('User not found')

    // Compare password
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {

            // Create session
            const session = {id: uuidv4(), userId: user.id}

            // Add session to sessions array
            sessions.push(session)

            // Send session to client
            res.status(201).send(session)

        } else {
            res.status(401).send('Invalid password')
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error')
    }
})

function authorizeRequest(req, res, next) {
    // Check that there is an authorization header
    if (!req.headers.authorization) return res.status(401).send('Missing authorization header')

    // Check that the authorization header is in the correct format
    const authorizationHeader = req.headers.authorization.split(' ')
    if (authorizationHeader.length !== 2 || authorizationHeader[0] !== 'Bearer') return res.status(400).send('Invalid authorization header')

    // Get sessionId from authorization header
    const sessionId = authorizationHeader[1]

    // Find session in sessions array
    const session = sessions.find(session => session.id === sessionId)
    if (!session) return res.status(401).send('Invalid session')

    // Check that the user exists
    const user = users.find(user => user.id === session.userId)
    if (!user) return res.status(401).send('Invalid session')

    // Add user to request object
    req.user = user

    // Add session to request object
    req.session = session

    // Call next middleware
    next()
}

app.get('/shoes' + '', authorizeRequest, (req, res) => {

    // Get shoes for user
    const shoesForUser = shoes.filter(shoe => shoe.userId === req.user.id)

    // Send shoes to client
    res.send(shoesForUser)
})

app.delete('/sessions', authorizeRequest, (req, res) => {

    // Remove session from sessions array
    sessions = sessions.filter(session => session.id !== req.session.id)

    res.status(204).end()

})

app.post('/shoes' + '', authorizeRequest, (req, res) => {

    // Validate title and content
    if (!req.body.title || !req.body.content || !req.body.brand || !req.body.sizes) return res.status(400).send('Title and content are required')

    // Find max id
    const maxId = shoes.reduce((max, shoe) => shoe.id > max ? shoe.id : max, shoes[0].id)

    // Save shoe to database
    shoes.push({
            id: maxId + 1,
            title: req.body.title,
            content: req.body.content,
            brand: req.body.brand,
            sizes: req.body.sizes,
            image: req.body.image,
            userId: req.user.id
        })

    // Send shoe to client
    res.status(201).send(shoes
        [shoes.length - 1])
})


// app delete shoe from database
app.delete('/shoes/:id', authorizeRequest, (req, res) => {

    // Find shoe in database
    const shoe = shoes.find(shoe => shoe.id === parseInt(req.params.id))
    if (!shoe) return res.status(404).send('Shoe not found')

    // Check that the shoe belongs to the user
    if (shoe.userId !== req.user.id) return res.status(401).send('Unauthorized')

    // Remove shoe from shoes array
    shoes.splice(shoes.indexOf(shoe), 1)

    res.status(204).end()
})

app.patch('/shoes/:id', authorizeRequest, (req, res) => {
    //iterate over all properties in req.body
    for (const property in req.body) {
        //check if the property is allowed to be updated
        if (!['title', 'content', 'brand', 'sizes', 'image'].includes(property))
            return res.status(400).send('Invalid property: ' + property)

        //Check that the property has a value
        if (!req.body[property]) return res.status(400).send('Invalid value for property: ' + property)

        //Check that the property is of the correct type
        if (typeof req.body[property] !== 'string') return res.status(400).send('Invalid type for property: ' + property)

        //Get shoe from database
        const shoe = shoes.find(shoe => shoe.id === parseInt(req.params.id))

        //Check if the shoe exists
        if (!shoe) return res.status(404).send('Shoe not found')

        //Check that the shoe belongs to the user
        if (shoe.userId !== req.user.id) return res.status(401).send('Unauthorized')

        //Update shoe in database
        shoe[property] = req.body[property]

        //Send shoe to client
        res.send(shoe)

    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function verifyEmail(email) {
    return new Promise((resolve, reject) => {
        verifier.verify(email, (err, info) => {
            console.log(err, info);
            if (err) {
                reject(JSON.stringify(info));
            } else {
                resolve(info);
            }
        });
    });
}
