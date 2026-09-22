const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const Activity = require('../models/activity.model');
const Category = require('../models/category.model');

// Full activity taxonomy: 7 categories, each with its subcategories
// (activities). "Indoor" was intentionally dropped from the original list —
// every item in it (Chess, Carrom, Gaming, Cooking, Movie, Yoga, ...) was
// already listed under another category, so it would only have produced
// duplicate activity names. Each activity lives under exactly one category.
const CATEGORY_TAXONOMY = [
    {
        name: 'Sports', emoji: '🏏', activities: [
            'Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis',
            'Table Tennis', 'Volleyball', 'Swimming', 'Boxing', 'Skating',
        ],
    },
    {
        name: 'Fitness', emoji: '🏋️', activities: [
            'Gym', 'Running', 'Walking', 'Jogging', 'Yoga', 'Cycling',
            'Hiking', 'Martial Arts',
        ],
    },
    {
        name: 'Games', emoji: '🎮', activities: [
            'Gaming', 'Chess', 'Carrom', 'Board Games', 'Card Games',
            'Bowling', 'Pool', 'Esports',
        ],
    },
    {
        name: 'Creative', emoji: '🎨', activities: [
            'Photography', 'Drawing', 'Painting', 'Dancing', 'Singing',
            'Guitar', 'Music', 'Writing', 'Cooking',
        ],
    },
    {
        name: 'Learning', emoji: '📚', activities: [
            'Coding', 'Language Learning', 'Reading', 'Book Club',
            'Public Speaking', 'Study Together', 'Skill Sharing',
        ],
    },
    {
        name: 'Outdoor', emoji: '🌳', activities: [
            'Camping', 'Road Trips', 'Picnics', 'Trekking', 'Nature Walk',
            'Exploring', 'Travel',
        ],
    },
    {
        name: 'Social', emoji: '🤝', activities: [
            'Coffee Meetup', 'Movie', 'Shopping', 'Food Meetup',
            'Networking', 'Volunteering', 'Conversation', 'City Exploring',
        ],
    },
];

async function seed() {
    try {
        const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/find_a_partner';
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB for seeding...');

        // 1. Seed Categories, then Activities (each linked to its category)
        const activityDocs = {};

        for (let i = 0; i < CATEGORY_TAXONOMY.length; i += 1) {
            const { name: categoryName, emoji, activities } = CATEGORY_TAXONOMY[i];

            let category = await Category.findOne({ name: categoryName });
            if (!category) {
                category = await Category.create({ name: categoryName, emoji, order: i });
            } else if (category.emoji !== emoji || category.order !== i) {
                category.emoji = emoji;
                category.order = i;
                await category.save();
            }

            for (const name of activities) {
                let act = await Activity.findOne({ name: new RegExp(`^${name}$`, 'i') });
                if (!act) {
                    act = await Activity.create({ name, description: `${name} activity`, category: category._id });
                } else if (!act.category) {
                    act.category = category._id;
                    await act.save();
                }
                activityDocs[name] = act._id;
            }
        }
        console.log('Categories and activities seeded.');

        const toSkills = (activityIds, level) => activityIds.map((activity) => ({ activity, level }));

        const defaultPassword = 'Test@12345';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 2. Main Test Users (Abhishek)
        const testEmails = ['abhishek.socket2026@gmail.com', 'abhishek.budakoti.04@gmail.com'];
        for (const testEmail of testEmails) {
            let mainUser = await User.findOne({ email: testEmail });
            if (!mainUser) {
                mainUser = await User.create({
                    name: 'Abhishek Budakoti',
                    email: testEmail,
                    password: hashedPassword,
                    role: 'user',
                    isVerified: true
                });
                console.log(`Created test user: ${testEmail}`);
            } else {
                mainUser.password = hashedPassword;
                await mainUser.save();
            }

            let mainProfile = await Profile.findOne({ user: mainUser._id });
            if (!mainProfile) {
                await Profile.create({
                    user: mainUser._id,
                    bio: "Passionate about sports & outdoor activities!",
                    skills: toSkills([activityDocs["Tennis"], activityDocs["Running"]], "intermediate"),
                    location: {
                        city: "Dehradun",
                        point: { type: "Point", coordinates: [78.0322, 30.3165] }
                    }
                });
                console.log(`Created profile for ${testEmail}`);
            } else {
                mainProfile.location = {
                    city: "Dehradun",
                    point: { type: "Point", coordinates: [78.0322, 30.3165] }
                };
                await mainProfile.save();
            }
        }

        // 2b. Admin user for the moderation dashboard (/admin/reports).
        // There is intentionally no API to become an admin.
        const adminEmail = 'admin@example.com';
        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true
            });
            console.log(`Created admin user: ${adminEmail}`);
        } else {
            adminUser.password = hashedPassword;
            adminUser.role = 'admin';
            await adminUser.save();
        }

        // 3. Test Candidates at various distances from [78.0322, 30.3165]
        const candidates = [
            {
                name: "Aarav Sharma",
                email: "aarav@example.com",
                bio: "Tennis enthusiast looking for weekly matches",
                skills: toSkills([activityDocs["Tennis"], activityDocs["Running"]], "intermediate"),
                location: {
                    city: "Dehradun",
                    point: { type: "Point", coordinates: [78.0432, 30.3275] } // ~1.7 km
                },
                averageRating: 4.8,
            },
            {
                name: "Priya Patel",
                email: "priya@example.com",
                bio: "Beginner badminton & cycling partner wanted",
                skills: toSkills([activityDocs["Badminton"], activityDocs["Cycling"]], "beginner"),
                location: {
                    city: "Dehradun",
                    point: { type: "Point", coordinates: [78.0550, 30.3400] } // ~3.6 km
                },
                averageRating: 4.2,
            },
            {
                name: "Rohan Verma",
                email: "rohan@example.com",
                bio: "Competitive tennis and chess player",
                skills: toSkills([activityDocs["Tennis"], activityDocs["Chess"]], "advanced"),
                location: {
                    city: "Dehradun",
                    point: { type: "Point", coordinates: [78.0900, 30.3700] } // ~8.5 km
                },
                averageRating: 4.9,
            },
            {
                name: "Sneha Kapoor",
                email: "sneha@example.com",
                bio: "Trail runner and swimmer",
                skills: toSkills([activityDocs["Running"], activityDocs["Swimming"]], "intermediate"),
                location: {
                    city: "Mussoorie",
                    point: { type: "Point", coordinates: [78.1700, 30.4500] } // ~20 km
                },
                averageRating: 4.6,
            },
            {
                name: "Vikram Singh",
                email: "vikram@example.com",
                bio: "Advanced badminton player",
                skills: toSkills([activityDocs["Badminton"], activityDocs["Tennis"]], "advanced"),
                location: {
                    city: "Rishikesh",
                    point: { type: "Point", coordinates: [78.3000, 30.5800] } // ~40 km
                },
                averageRating: 4.0,
            },
            {
                name: "Ananya Gupta",
                email: "ananya@example.com",
                bio: "Weekend cyclist & chess hobbyist",
                skills: toSkills([activityDocs["Cycling"], activityDocs["Chess"]], "beginner"),
                location: {
                    city: "Haridwar",
                    point: { type: "Point", coordinates: [78.5000, 30.8000] } // ~70 km
                },
                averageRating: 4.5,
            },
            {
                name: "Dev Kumar",
                email: "dev@example.com",
                bio: "Digital nomad - no fixed location point set",
                skills: toSkills([activityDocs["Tennis"], activityDocs["Swimming"]], "intermediate"),
                location: {
                    city: "Remote Nomad"
                    // Intentionally NO point coordinates!
                },
                averageRating: 4.1,
            },
        ];

        for (const candidate of candidates) {
            let u = await User.findOne({ email: candidate.email });
            if (!u) {
                u = await User.create({
                    name: candidate.name,
                    email: candidate.email,
                    password: hashedPassword,
                    role: 'user',
                    isVerified: true
                });
            }

            let p = await Profile.findOne({ user: u._id });
            if (!p) {
                await Profile.create({
                    user: u._id,
                    bio: candidate.bio,
                    skills: candidate.skills,
                    location: candidate.location,
                    averageRating: candidate.averageRating,
                });
                console.log(`Created profile for ${candidate.name} (${candidate.email})`);
            } else {
                p.location = candidate.location;
                p.skills = candidate.skills;
                p.averageRating = candidate.averageRating;
                await p.save();
                console.log(`Updated profile for ${candidate.name}`);
            }
        }

        await mongoose.disconnect();
        console.log('Seeding completed successfully. All candidate test profiles created!');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
