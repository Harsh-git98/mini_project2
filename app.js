// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Connect to MongoDB Atlas
const mongoUri = 'mongodb+srv://shriharshranjangupta:zvpMvIOh6sBiIUDH@cluster0.gpvbs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Connected to MongoDB Atlas");
});

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set view engine (assuming you are using EJS)
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
        // Redirect to homepage with login flag in URL
        res.redirect('/homepage?loggedIn=true');
    } else {
        res.status(401).send(`
            <script>
                alert('Invalid username or password');
                window.location.href = '/login';
            </script>
        `);
    }
});

// Homepage route
app.get('/homepage', (req, res) => {
    // Check if the query parameter `loggedIn` is set to "true"
    if (req.query.loggedIn === 'true') {
        res.render("homepage");
    } else {
        res.redirect('/login');
    }
});

// Login route to render login page
app.get("/login", (req, res) => {
    res.render("Loginpage"); // Serve the login page
});

// Signup route to render signup page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// Protected homepage route
app.get("/", (req, res) => {
    res.redirect('/homepage');
});

// About page route
app.get("/about", (req, res) => {
    res.render("aboutUs");
});

// User info route
app.get("/user", (req, res) => {
    res.render("userinfo");
});




//User DATA

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'firstname surname dob'); // Adjust fields as needed
        res.json(users); // Send the user data as JSON
    } catch (error) {
        res.status(500).send('Error fetching users: ' + error.message);
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
