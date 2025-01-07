const dotenv = require('dotenv');
dotenv.config()
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const userRoutes = require('./routes/user');
const otpRoutes = require('./routes/otp');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');

const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db.js'); // Adjust path as needed
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

dotenv.config(); // Load environment variables

// Middleware
app.use(morgan('dev')); // Logging
app.use(helmet()); // Security headers
app.use(express.urlencoded({ extended: true }));  // This is needed for form data
app.use(express.json()); // Body parser for JSON
app.use(cors());
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log("Request Body:", req.body); // Log the request body
  next();
});

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: "test-alexGrant" 
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to the database
connectDB();

// Use the user routes
app.use('/', userRoutes)
app.use('/user', userRoutes);
app.use('/otp', otpRoutes);
app.use('/chat', chatRoutes);
app.use('/payment', paymentRoutes);

//use body-parser
app.use(bodyParser.json());

// Serve static files (if needed, e.g., for CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Define the root route to render the auth.ejs view
app.get('/', (req, res) => {
    res.render('auth');  // Render auth.ejs when navigating to '/'
});

// Error handler
app.use(errorHandler);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});