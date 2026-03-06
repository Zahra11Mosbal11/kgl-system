const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    
    // delete existing users to avoid duplicates
    await User.deleteMany({});
    const password = process.env.PASSWORD_USER || 'password123';
    
    // create director user
    const director = new User({
      username: 'director1',
      password: password,
      role: 'director',
      fullName: 'System Director',
      branch: 'Maganjo',
      phone: '0770000000'
    });

    // create manager user
    const manager = new User({
      username: 'manager1',
      password: password,
      role: 'manager',
      fullName: 'Ahmed Manager',
      branch: 'Maganjo',
      phone: '0777123456'
    });
    
    // create sales agent user
    const salesAgent = new User({
      username: 'sales1',
      password: password,
      role: 'sales_agent',
      fullName: 'Mohamed Sales',
      branch: 'Matugga',
      phone: '0788123456'
    });
    
    await director.save();
    await manager.save();
    await salesAgent.save();
    
    console.log(' Database seeded successfully');
    console.log(`Director: director1 / ${password}`);
    console.log(`Manager: manager1 / ${password}`);
    console.log(`Sales Agent: sales1 / ${password}`);

    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();