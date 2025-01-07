// src/controllers/userController.js

const bcrypt = require("bcryptjs");
const User = require("../models/user"); // Import the User model
const Payment = require("../models/payment"); // Import the User model
const PaymentMethod = require("../models/paymentmethod"); // Import the User model
const DeletedUser = require("../models/deleteduser"); // Import DeletedUser model
const jwt = require("jsonwebtoken");
const { createToken, verifyToken } = require("../utils/jwt/jwt"); // Adjust the path to your token file
const crypto = require('crypto');
const stripe = require('stripe')('sk_test_51Qb0GiLq7W2EQfGeiFrQecxg87vYeduQM9ar62vUv79SqNJXTN7pXWHFWhge2m6JQ5ZdNqmxvLxfaSoaUlRn4pNz00BIl3v6vE');  // Replace with your secret key
const Subscription = require('../models/subscription');   // Import Subscription model

exports.getUsers = (req, res, next) => {
  // Logic to get users
  res.status(200).json({ message: "Get all users" });
};

exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user document
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the user in the database
    await newUser.save();
    const token = createToken(newUser._id, newUser.username);
    res.status(200).json({
      message: "User created successfully and logged in.",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });

    // Respond with the created user (excluding the password for security reasons)
    // res.status(201).json({
    //   message: "User created successfully.",
    //   user: {
    //     username: newUser.username,
    //     email: newUser.email,
    //     password: newUser.password,
    //   },
    // });


    



  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while creating user." });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

     // Retrieve subscription data for the user
     const subscription = await Subscription.findOne({ userId: user._id })
     .sort({ startDate: -1 }) // Sort by startDate in descending order
     .exec();

    // Generate JWT token
    const token = createToken(user._id, user.username);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      subscription: subscription
        ? {
            id: subscription._id,
            startDate: subscription.startDate,
            expiryDate: subscription.expiryDate,
            amount: subscription.amount,
            paymentStatus: subscription.paymentStatus,
          }
        : null, // Null if no subscription exists
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and new password are required." });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been successfully reset." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while resetting password." });
  }
};

exports.editUser = async (req, res, next) => {
  try {
    // Retrieve the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required." });
    }

    let decoded;
    try {
      decoded = verifyToken(token); // Verify the token using the verifyToken function
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { firstName, lastName, email } = req.body; // New data from the request body

    // Find the user by their unique ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the new email is already in use by another user (if email is being updated)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email; // Update email if it's not already in use
    }

    // Update first and last name if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Save the updated user document
    await user.save();

    // Respond with the updated user object, excluding the password
    res.status(200).json({
      message: "User updated successfully.",
      user: user.toObject({
        versionKey: false,
        transform: (doc, ret) => {
          // Exclude the password from the response object
          delete ret.password;
          return ret;
        },
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while updating user." });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    // Retrieve the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required." });
    }

    let decoded;
    try {
      decoded = verifyToken(token); // Verify the token using the verifyToken function
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Find the user by their unique ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Move user data to DeletedUsers collection
    const deletedUserData = {
      originalUserId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    await DeletedUser.create(deletedUserData); // Save user data in DeletedUsers collection

    // Delete the user from the User collection
    await User.deleteOne({ _id: user._id });


    res
      .status(200)
      .json({ message: "User deleted successfully and archived." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while deleting user." });
  }
};

exports.verifyPin = async (req, res, next) => {
  try {
    // Retrieve the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required." });
    }

    let decoded;
    try {
      decoded = verifyToken(token); // Verify the token
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { pin } = req.body; // Extract the pin from the request body

    if (!pin) {
      return res.status(400).json({ message: "Pin is required." });
    }

    // Find the user by their unique ID (from the token)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the provided pin matches the user's pin
    if (user.pin === pin) {
      return res.status(200).json({ message: "Pin verified successfully." });
    } else {
      return res.status(401).json({ message: "Invalid pin." });
    }
  } catch (error) {
    console.error("Error verifying pin:", error);
    res.status(500).json({ message: "Server error while verifying pin." });
  }
};

exports.updatePin = async (req, res, next) => {
  try {
    // Retrieve the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required." });
    }

    let decoded;
    try {
      decoded = verifyToken(token); // Verify the token
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { pin } = req.body; // Extract the new PIN from the request body

    if (pin === undefined || pin === null) {
      return res.status(400).json({ message: "New PIN is required." });
    }

    if (typeof pin !== 'number' || !Number.isFinite(pin)) {
      return res.status(400).json({ message: "PIN must be a valid number." });
    }

    // Check that the new pin is a reasonable length (e.g., 6 digits for example)
    const pinLength = pin.toString().length;
    if (pinLength !== 6) {
      return res.status(400).json({ message: "PIN must be a 6-digit number." });
    }

    // Find the user by their unique ID (from the token)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the PIN
    user.pin = pin;

    // Save the updated user document
    await user.save();

    // Respond with a success message
    res.status(200).json({
      message: "PIN updated successfully.",
      user: user.toObject({
        versionKey: false,
        transform: (doc, ret) => {
          // Exclude sensitive data from the response object
          delete ret.password;
          return ret;
        },
      }),
    });
  } catch (error) {
    console.error("Error updating PIN:", error);
    res.status(500).json({ message: "Server error while updating PIN." });
  }
};

exports.addFingerprint = async (req, res, next) => {
  try {
      const { email, minutiae } = req.body;

      // Validate input
      if (!email || !minutiae || minutiae.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'Email and minutiae array are required.',
          });
      }

      // Convert minutiae array to a string (JSON string)
      const minutiaeString = JSON.stringify(minutiae);

      // Hash the minutiae data using SHA-256
      const hash = crypto.createHash('sha256').update(minutiaeString).digest('hex');

      // Find the user by email
      const user = await User.findOne({ email: email });
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found.',
          });
      }

      // Check if the user already has fingerprint authentication enabled
      if (!user.hasFingerprint && user.fingerprintHash) {
          // If hasFingerprint is false, we inform the user they should login with credentials first
          return res.status(200).json({
              success: false,
              message: 'Fingerprint authentication is disabled. Please log in with your credentials first, then enable fingerprint authentication from settings.',
          });
      }

      // Update the user's fingerprint hash and enable fingerprint authentication
      user.fingerprintHash = hash;
      user.hasFingerprint = true;  // Enable fingerprint authentication
      await user.save();

      // Return success response
      res.status(200).json({
          success: true,
          message: 'Fingerprint added successfully.',
          data: {
              userId: user._id,
              hasFingerprint: user.hasFingerprint,
              fingerprintHash: user.fingerprintHash,  // This is the hashed value
          },
      });
  } catch (error) {
      // Pass error to next middleware
      next(error);
  }
};
exports.authenticateFingerprint = async (req, res, next) => {
  try {
      const { minutiae, sessionId } = req.body;

      // Validate input
      if (!minutiae || minutiae.length === 0) {
          return res.status(400).json({
              success: false,
              message: 'Minutiae array is required.',
          });
      }

      // Convert minutiae array to a string (JSON string)
      const minutiaeString = JSON.stringify(minutiae);

      // Hash the minutiae data using SHA-256
      const hash = crypto.createHash('sha256').update(minutiaeString).digest('hex');
      
      // Find the user by fingerprint hash
      const user = await User.findOne({ fingerprintHash: hash });
      console.log('Received Hash:', hash);
      // console.log('Stored Hash:', user.fingerprintHash);
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'Fingerprint not found. Authentication failed.',
          });
      }
     
      // Check if the user has fingerprint authentication enabled
      if (!user.hasFingerprint) {
          return res.status(200).json({
              success: false,
              message: 'Fingerprint authentication is not enabled for this user.',
          });
      }

      const token = createToken(user._id, user.username, sessionId);


      // Authentication successful
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
  } catch (error) {
      // Pass error to next middleware
      next(error);
  }
};


exports.loadAuth = (req, res) => {
    res.render('auth');
};

exports.successGoogleLogin = (req, res) => { 
    if (!req.user) {
        return res.redirect('/failure');
    }
    
    // Assuming that req.user contains the user's data from Google OAuth
    console.log("req.user")
    console.log(req.user)
    const { email, given_name } = req.user;

    // Pass the email and name to the view (so they can be used in the set-password form)
    res.render('set-password', { email, given_name });
};


exports.failureGoogleLogin = (req, res) => { 
    res.send('Error'); 
};

exports.setPassword = async (req, res) => {
    try {
        console.log("Received data:", req.body);

        const { email, given_name, password } = req.body;

        if (!email || !given_name || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Hash the password before saving
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let user = await User.findOne({ email });
        if (user) {
            user.password = hashedPassword;
            user.username = given_name; 
            await user.save();
        } else {
            user = new User({
                email,
                username: given_name,
                password: hashedPassword
            });
            await user.save();
        }
        const token = createToken(user._id, user.username);

        return res.status(200).json({ message: 'Password has been successfully set.', token});
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Server error while setting password.' });
        }
    }
};

// exports.paymentStripe = async (req, res) => {
//     try {
//         console.log(req.body)
//         const { amount, currency = 'usd', payment_method } = req.body;

//     if (!amount || !payment_method) {
//       return res.status(400).send({ error: 'Amount and Payment Method are required' });
//     }

//     // Create a PaymentIntent
//     const paymentIntent = await stripe.paymentIntents.create({
//         amount: amount,  // Amount in cents
//         currency: currency,
//         payment_method: payment_method,
//         confirmation_method: 'manual', // Manual confirmation
//         confirm: true,  // Automatically confirm the payment
//         return_url: 'http://localhost:3000/', // URL to return to after payment
//       });
  
//       // Send the client secret to the client for further action
//       res.send({
//         clientSecret: paymentIntent.client_secret,
//         status: paymentIntent.status,
//       });
//     } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: error.message });
//   }
// };

exports.paymentStripe = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

        if (!token) {
            return res.status(401).json({ message: "Authorization token is required." });
        }

        let decoded;
        try {
            decoded = verifyToken(token); // Verify the token using the verifyToken function
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        const user = await User.findById(decoded.userId);
        const userId = user._id;

        const { amount, currency = 'usd', card, customer } = req.body;

        if (!amount || !card) {
            return res.status(400).send({ error: 'Amount and Card information are required' });
        }

        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: card.number,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
                cvc: card.cvc,
            },
            billing_details: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,  // amount in cents (e.g., $10 = 1000)
            currency: currency,
            payment_method: paymentMethod.id,
            confirmation_method: 'manual', // Manual confirmation to handle authorization only
            confirm: true,  // Attempt the charge immediately
            return_url: 'http://localhost:3000/', // URL to return after payment
        });

        if (paymentIntent.status === 'succeeded') {
            // Payment succeeded, save the transaction details in the database
            const payment = new Payment({
                amount: amount,
                currency: currency,
                paymentMethodId: paymentMethod.id,
                customer: {
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                },
                card: {
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    exp_month: paymentMethod.card.exp_month,
                    exp_year: paymentMethod.card.exp_year,
                },
                status: paymentIntent.status,
                userId: userId, // Save the userId to link the payment to the user
            });

            await payment.save();

            res.send({
                clientSecret: paymentIntent.client_secret,
                userId: userId,
                status: paymentIntent.status,
                message: 'Payment successful and transaction saved.',
            });
        } else {
            // If payment failed for any reason (insufficient funds, card declined, etc.)
            res.status(400).send({ error: 'Payment failed: ' + paymentIntent.status });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};


exports.getPaymentbyId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const payments = await Payment.find({ userId: userId });

        if (!payments.length) {
            return res.status(404).json({ message: 'No payments found for this user.' });
        }

        res.status(200).json({
            data: payments,
            message: 'Payments retrieved successfully.',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addCard = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

        if (!token) {
        return res
            .status(401)
            .json({ message: "Authorization token is required." });
        }

        let decoded;
        try {
        decoded = verifyToken(token); // Verify the token using the verifyToken function
        } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
        }

        const user = await User.findById(decoded.userId);
        userId = user._id;
    
        const { cardDetails } = req.body;
    
        if (!cardDetails) {
            return res.status(400).send({ error: 'Card details are required.' });
        }
    
        // Create Payment Method for the card
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
            number: cardDetails.number,
            exp_month: cardDetails.exp_month,
            exp_year: cardDetails.exp_year,
            cvc: cardDetails.cvc,
            },
            billing_details: {
            name: cardDetails.name,
            email: cardDetails.email,
            phone: cardDetails.phone,
            },
        });
    
        const cardBrand = paymentMethod.card.brand; // This could be 'visa', 'mastercard', 'amex', etc.
    
        // Store payment method for the user in the database
        const userCard = new PaymentMethod({
            userId: userId,
            paymentMethodId: paymentMethod.id,
            brand: cardBrand,  
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
        });
    
        await userCard.save();
    
        res.status(200).send({ 
            message: 'Card added successfully', 
            cardId: userCard._id, 
            brand: cardBrand 
        });
        } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
        }
    };

exports.updateCard = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"
    
        if (!token) {
        return res.status(401).json({ message: "Authorization token is required." });
        }
    
        let decoded;
        try {
        decoded = verifyToken(token); // Verify the token using the verifyToken function
        } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
        }
    
        const user = await User.findById(decoded.userId);
        if (!user) {
        return res.status(404).json({ message: "User not found." });
        }
    
        const userId = user._id;
        const { cardNum, newCardDetails } = req.body;
    
        // Ensure both cardNum and newCardDetails are provided
        if (!cardNum || !newCardDetails || !newCardDetails.number || !newCardDetails.exp_month || !newCardDetails.exp_year || !newCardDetails.cvc) {
        return res.status(400).send({ error: 'Card number and new card details are required.' });
        }
    
        // Retrieve the existing card from the database
        const userCard = await PaymentMethod.findOne({ userId, cardNumber: cardNum });
    
        // Check if the card exists
        if (!userCard) {
        return res.status(404).send({ error: 'Card not found.' });
        }
    
        // Update Payment Method with the new card details using Stripe API
        const paymentMethod = await stripe.paymentMethods.update(userCard.paymentMethodId, {
        card: {
            number: newCardDetails.number,
            exp_month: newCardDetails.exp_month,
            exp_year: newCardDetails.exp_year,
            cvc: newCardDetails.cvc,
        },
        });
    
        const updatedCardBrand = paymentMethod.card.brand; // Dynamically fetched card brand
    
        // Update the card details in the database
        userCard.brand = updatedCardBrand;
        userCard.last4 = paymentMethod.card.last4; // Last 4 digits of the card
        userCard.exp_month = paymentMethod.card.exp_month;
        userCard.exp_year = paymentMethod.card.exp_year;
    
        // Save the updated card details in the database
        await userCard.save();
    
        // Send response back to the client
        res.status(200).send({
        message: 'Card updated successfully',
        cardId: userCard._id,
        brand: updatedCardBrand, // Return the updated card brand
        });
    
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
    };
    
exports.deleteCard = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"
    
        if (!token) {
        return res.status(401).json({ message: "Authorization token is required." });
        }
    
        let decoded;
        try {
        decoded = verifyToken(token); // Verify the token using the verifyToken function
        } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
        }
    
        const user = await User.findById(decoded.userId);
        if (!user) {
        return res.status(404).json({ message: "User not found." });
        }
    
        const userId = user._id;
        const { cardNum } = req.body;
    
        if (!cardNum) {
        return res.status(400).send({ error: 'Card number is required.' });
        }
    
        // Retrieve the existing card from the database
        const userCard = await PaymentMethod.findOne({ userId, cardNumber: cardNum });
    
        // Check if the card exists
        if (!userCard) {
        return res.status(404).send({ error: 'Card not found.' });
        }
    
        // Detach the card from Stripe using the payment method ID
        await stripe.paymentMethods.detach(userCard.paymentMethodId);
    
        // Remove the card from the database
        await userCard.remove();
    
        res.status(200).send({
        message: 'Card deleted successfully',
        });
    
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
    };
      
exports.getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Fetch the user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Respond with the user (excluding the password for security reasons)
    res.status(200).json({
      message: "User retrieved successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while retrieving user." });
  }
};
