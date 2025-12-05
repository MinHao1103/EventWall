/**
 * Passport.js 設定
 * 使用 Google OAuth 2.0 策略進行使用者認證
 */

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./database");

// 配置 Google OAuth 2.0 策略
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 查找或建立使用者
        const user = await db.findOrCreateUser(profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// 序列化使用者資料到 session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 從 session 反序列化使用者資料
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
