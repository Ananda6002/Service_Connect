const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
const filePath = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const existing = fs.existsSync(filePath)
  ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
  : [];

const users = [
  {
    name: 'Alice User',
    email: 'alice@example.com',
    password: 'Password123',
    role: 'user'
  },
  {
    name: 'Bob Provider',
    email: 'bob@example.com',
    password: 'Provider123',
    role: 'provider',
    skills: ['Electrician', 'Plumber'],
    location: 'Delhi',
    phone: '9999999999',
    bio: 'Experienced home service provider.',
    hourlyRate: 350
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123',
    role: 'admin'
  }
];

const makeId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

for (const user of users) {
  if (existing.some((item) => item.email === user.email)) {
    console.log(`${user.email}: already exists`);
    continue;
  }

  existing.push({
    _id: makeId(),
    name: user.name,
    email: user.email,
    password: bcrypt.hashSync(user.password, 10),
    role: user.role,
    skills: user.skills || [],
    location: user.location || '',
    phone: user.phone || '',
    bio: user.bio || '',
    hourlyRate: user.hourlyRate || 0,
    averageRating: 0,
    numReviews: 0,
    latitude: null,
    longitude: null,
    createdAt: new Date().toISOString()
  });

  console.log(`${user.email}: created (${user.role})`);
}

fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
