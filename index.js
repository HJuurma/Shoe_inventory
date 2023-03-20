const express = require('express')
const verifier = require("@gradeup/email-verify");
const bcrypt = require('bcrypt')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000

// add swagger UI
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use(express.static('public'))
app.use(express.json())

const users = [
    {id: 1, email: 'admin', password: 'admin'}
]

app.post('/users', async (req, res) => {
    //validate email and password
    if (!req.body.email || !req.body.password) {
        return res.status(400).send('Email and password are required')
    }
    if (req.body.password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters')
    }
    //validate that the email conforms to the following regex
    if (!req.body.email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) return res.status(400).send('Email must be valid')

    // Check if email already exists
    if (users.find(user => user.email === req.body.email)) return res.status(409).send('Email already exists')

    //try to contact the mail server and send a test email without actually sending it
    try {
        const result = await verifyEmail(req.body.email);
        if (!result.success) {
            return res.status(400).send('Email must be valid: ' + result.info)
        }
        console.log('Email is verified')
    } catch (error) {
        return res.status(400).send('Email must be valid: ' + error.code)
    }

    // hash password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(req.body.password, 10)
    } catch (error) {
        console.error(error);
    }

    //find max id
    const maxId = users.reduce((max, user) => user.id > max ? user.id : max, users[0].id)

    //save user to database
    users.push({id: maxId + 1, email: req.body.email, password: hashedPassword})
    res.status(201).end()
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function verifyEmail(email) {
    return new Promise((resolve, reject) => {
        verifier.verify(email, (err, info) => {
            console.log(err, info);
            if (err) {
                reject(JSON.stringify(err));
            } else {
                resolve(info);
            }
        });
    });
}