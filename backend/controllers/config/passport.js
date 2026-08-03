// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/booking.js';
import config from './config.js';  // ✅ Import config.js

console.log('🔍 Loading Passport Configuration...');
console.log('📍 Passport file location: config/passport.js');

// ✅ Use config object instead of process.env directly
console.log('🔑 Google Client ID from config:', config.googleClientId ? '✅ Set' : '❌ Missing');

// Serialize user for session
passport.serializeUser((user, done) => {
    console.log('🔐 Serializing user:', user?._id || user?.id);
    done(null, user.id || user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔓 Deserializing user:', id);
        const user = await User.findById(id);
        if (!user) {
            console.log('⚠️ User not found during deserialization:', id);
            return done(null, null);
        }
        done(null, user);
    } catch (error) {
        console.error('❌ Deserialization error:', error);
        done(error, null);
    }
});

// ✅ Register Google Strategy using config
const googleClientId = config.googleClientId;
const googleClientSecret = config.googleClientSecret;

if (googleClientId && googleClientSecret) {
    try {
        console.log('✅ Registering Google Strategy...');
        console.log('📌 Client ID:', googleClientId.substring(0, 20) + '...');
        console.log('📌 Callback URL:', config.googleCallbackUrl);

        passport.use(
            'google',
            new GoogleStrategy(
                {
                    clientID: googleClientId,
                    clientSecret: googleClientSecret,
                    callbackURL: config.googleCallbackUrl || 'http://localhost:5000/api/auth/google/callback',
                    passReqToCallback: true
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        console.log('🔑 Google profile received:', profile.id);
                        console.log('📧 Email:', profile.emails?.[0]?.value);

                        // Find or create user
                        let user = await User.findOne({ googleId: profile.id });

                        if (!user) {
                            // Check if user exists with same email
                            user = await User.findOne({ email: profile.emails[0].value });

                            if (user) {
                                // Link Google account to existing user
                                user.googleId = profile.id;
                                user.googleAccessToken = accessToken;
                                user.googleRefreshToken = refreshToken || null;
                                user.authMethod = 'google';
                                user.isVerified = true;
                                user.profileImage = profile.photos?.[0]?.value || user.profileImage;
                                await user.save();
                                console.log('✅ Google account linked to existing user:', user.email);
                            } else {
                                // Create new user
                                user = new User({
                                    googleId: profile.id,
                                    email: profile.emails[0].value,
                                    firstName: profile.name?.givenName || '',
                                    lastName: profile.name?.familyName || '',
                                    profileImage: profile.photos?.[0]?.value || 'default-profile.jpg',
                                    authMethod: 'google',
                                    isVerified: true,
                                    userType: 'registered',
                                    googleAccessToken: accessToken,
                                    googleRefreshToken: refreshToken || null
                                });
                                await user.save();
                                console.log('✅ New Google user created:', user.email);
                            }
                        } else {
                            // Update existing Google user
                            user.googleAccessToken = accessToken;
                            if (refreshToken) {
                                user.googleRefreshToken = refreshToken;
                            }
                            user.lastLogin = Date.now();
                            await user.save();
                            console.log('✅ Google user updated:', user.email);
                        }

                        return done(null, user);
                    } catch (error) {
                        console.error('❌ Google Strategy Error:', error);
                        return done(error, null);
                    }
                }
            )
        );

        console.log('✅ Google Strategy registered successfully!');
        console.log('📋 Available strategies:', Object.keys(passport._strategies));
    } catch (error) {
        console.error('❌ Failed to register Google Strategy:', error);
    }
} else {
    console.warn('⚠️ Google OAuth credentials not properly configured.');
    console.warn('   GOOGLE_CLIENT_ID from config:', googleClientId ? 'Set but may be placeholder' : 'Missing');
    console.warn('   GOOGLE_CLIENT_SECRET from config:', googleClientSecret ? 'Set but may be placeholder' : 'Missing');
}

export default passport;