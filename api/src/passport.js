require('dotenv').config();  
console.log(process.env.CLIENT_ID);
const passport = require('passport'); 
const GoogleStrategy = require('passport-google-oauth2').Strategy; 

passport.serializeUser((user , done) => { 
	done(null , user); 
}) 
passport.deserializeUser(function(user, done) { 
	done(null, user); 
}); 

passport.use(new GoogleStrategy({ 
	clientID:"844690581188-p19e8h8botr5dqbddq31g5jbj5hsnmsd.apps.googleusercontent.com", // Your Credentials here. 
	clientSecret:"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", // Your Credentials here. 
	callbackURL:"http://localhost:3000/auth/google/callback/", 
	passReqToCallback:true
}, 
function(request, accessToken, refreshToken, profile, done) { 
	return done(null, profile); 
} 
));
