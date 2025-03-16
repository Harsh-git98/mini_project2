const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session'); // To manage login sessions

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/social';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Connected to MongoDB");
});

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup for authentication
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true,
}));

// Set view engine
app.set('view engine', 'ejs');
app.use(express.static('public'));

// User schema
const userSchema = new mongoose.Schema({
    firstname: String,
    surname: String,
    rollno: String,
    email: String,
    dob: String,
    gender: String,
    username: { type: String, unique: true },
    password: String
});

const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Routes
app.post('/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.redirect('/login');
    } catch (error) {
        res.status(400).send('Error creating user: ' + error.message);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && user.password === password) {
        req.session.user = user; // Save user session
        res.redirect('/homepage');
    } else {
        res.status(401).send(`
            <script>
                alert('Invalid username or password');
                window.location.href = '/login';
            </script>
        `);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Protected homepage route
app.get('/homepage', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render("homepage");
});

// Chat route (only accessible if logged in)
app.get('/chat', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    res.render('chat', { username: req.session.user.username, messages });
});

// API to fetch all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).send('Error fetching messages');
    }
});

// API to send a message
app.post('/api/messages', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Unauthorized");
        }

        const { message } = req.body;
        if (!message) {
            return res.status(400).send("Message cannot be empty.");
        }

        const newMessage = new Message({
            username: req.session.user.username,
            message
        });

        await newMessage.save();
        res.status(201).send("Message saved successfully.");
    } catch (error) {
        res.status(500).send("Error saving message: " + error.message);
    }
});

// User Data API
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'firstname surname dob email');
        res.json(users);
    } catch (error) {
        res.status(500).send('Error fetching users: ' + error.message);
    }
});

// Login & Signup Routes
app.get("/login", (req, res) => res.render("Loginpage.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));

// Other Routes
app.get("/", (req, res) => res.redirect('/homepage.ejs'));
app.get("/about", (req, res) => res.render("aboutUs.ejs"));
app.get("/user", (req, res) => res.render("userinfo"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
