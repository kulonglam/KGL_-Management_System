import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Procurement from './models/Procurement.js';
import Sale from './models/Sale.js';
import CreditSale from './models/CreditSale.js';
import TrustedBuyer from './models/TrustedBuyer.js';

// Handle connect db.
const connectDB = async () => {
  dotenv.config();
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle seed data.
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Procurement.deleteMany({});
    await Sale.deleteMany({});
    await CreditSale.deleteMany({});
    await TrustedBuyer.deleteMany({});

    console.log('Data cleared');

    // Create users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.create([
      {
        name: 'Mr. Orban',
        username: 'orban',
        password: hashedPassword,
        role: 'director',
        canViewCrossBranchTotals: true
      },
      {
        name: 'ManagerA',
        username: 'managerA',
        password: hashedPassword,
        role: 'manager',
        branch: 'Maganjo'
      },
      {
        name: 'ManagerB',
        username: 'managerB',
        password: hashedPassword,
        role: 'manager',
        branch: 'Matugga'
      },
      {
        name: 'Agent1A',
        username: 'agent1A',
        password: hashedPassword,
        role: 'sales_agent',
        branch: 'Maganjo'
      },
      {
        name: 'Agent2A',
        username: 'agent2A',
        password: hashedPassword,
        role: 'sales_agent',
        branch: 'Maganjo'
      },
      {
        name: 'Agent1B',
        username: 'agentB',
        password: hashedPassword,
        role: 'sales_agent',
        branch: 'Matugga'
      },
      {
        name: 'Agent2B',
        username: 'agent2B',
        password: hashedPassword,
        role: 'sales_agent',
        branch: 'Matugga'
      }
    ]);

    console.log('Users created');

    // Create sample procurement
    const managerA = users.find((u) => u.username === 'managerA');
    const managerB = users.find((u) => u.username === 'managerB');

    await Procurement.create([
      {
        produceName: 'Red Beans',
        produceType: 'Beans',
        sourceType: 'company',
        dateReceived: new Date('2026-02-10'),
        timeReceived: '09:00',
        tonnageKg: 5000,
        costUgx: 15000000,
        dealerName: 'Maganjo Farm',
        dealerContact: '+256700123456',
        branch: 'Maganjo',
        sellingPrice: 35000,
        recordedBy: managerA._id
      },
      {
        produceName: 'White Maize',
        produceType: 'Grain Maize',
        sourceType: 'company',
        dateReceived: new Date('2026-02-12'),
        timeReceived: '10:30',
        tonnageKg: 8000,
        costUgx: 20000000,
        dealerName: 'Matugga Farm',
        dealerContact: '+256700234567',
        branch: 'Matugga',
        sellingPrice: 28000,
        recordedBy: managerB._id
      },
      {
        produceName: 'Brown Beans',
        produceType: 'Beans',
        sourceType: 'individual',
        dateReceived: new Date('2026-02-14'),
        timeReceived: '11:00',
        tonnageKg: 3000,
        costUgx: 9000000,
        dealerName: 'John Okello',
        dealerContact: '0700345678',
        branch: 'Matugga',
        sellingPrice: 32000,
        recordedBy: managerB._id
      },
      {
        produceName: 'Groundnuts',
        produceType: 'G-nuts',
        sourceType: 'kgl_farm',
        dateReceived: new Date('2026-02-15'),
        timeReceived: '14:00',
        tonnageKg: 2000,
        costUgx: 10000000,
        dealerName: 'Agro Supplies Ltd',
        dealerContact: '+256700456789',
        branch: 'Maganjo',
        sellingPrice: 55000,
        recordedBy: managerA._id
      }
    ]);

    console.log('Procurement created');

    // Create sample sales
    const agent1A = users.find((u) => u.username === 'agent1A');
    const agent2B = users.find((u) => u.username === 'agent2B');

    await Sale.create([
      {
        produceName: 'Red Beans',
        produceType: 'Beans',
        tonnageKg: 1000,
        amountPaidUgx: 35000000,
        buyerName: 'Marys Restaurant',
        salesAgentName: agent1A.name,
        date: new Date('2026-02-15'),
        time: '10:00',
        branch: 'Maganjo',
        recordedBy: agent1A._id
      },
      {
        produceName: 'White Maize',
        produceType: 'Grain Maize',
        tonnageKg: 2000,
        amountPaidUgx: 56000000,
        buyerName: 'City Market',
        salesAgentName: agent2B.name,
        date: new Date('2026-02-16'),
        time: '11:30',
        branch: 'Matugga',
        recordedBy: agent2B._id
      }
    ]);

    console.log('Sales created');

    // Create sample credit sales
    const trustedBuyers = await TrustedBuyer.create([
      {
        name: 'Kulong Lam',
        nationalId: 'CM123456789012',
        location: 'Kampala Central',
        contact: '+256700567890',
        branch: 'Matugga',
        recordedBy: managerB._id
      },
      {
        name: 'Mary Nyajime',
        nationalId: 'CM987654321098',
        location: 'Kawempe',
        contact: '+256700111222',
        branch: 'Maganjo',
        recordedBy: managerA._id
      }
    ]);

    await CreditSale.create([
      {
        buyerName: trustedBuyers[0].name,
        nationalId: trustedBuyers[0].nationalId,
        location: trustedBuyers[0].location,
        contact: trustedBuyers[0].contact,
        amountDueUgx: 16000000,
        amountPaidUgx: 0,
        balanceUgx: 16000000,
        salesAgentName: agent2B.name,
        dueDate: new Date('2026-03-01'),
        produceName: 'Brown Beans',
        produceType: 'Beans',
        tonnageKg: 500,
        dateOfDispatch: new Date('2026-02-15'),
        branch: 'Matugga',
        recordedBy: agent2B._id,
        trustedBuyer: trustedBuyers[0]._id
      }
    ]);

    console.log('Credit sales created');
    console.log('\n=== Sample Login Credentials ===');
    console.log('All users have password: password123');
    console.log('\nDirector:');
    console.log('  Username: orban');
    console.log('\nManagers:');
    console.log('  Username: managerA (Maganjo)');
    console.log('  Username: managerB (Matugga)');
    console.log('\nSales Agents:');
    console.log('  Username: agent1A, agent1B (Maganjo)');
    console.log('  Username: agent2A, agent2B (Matugga)');
    console.log('\nCredit Agents:');
    console.log('  Username: agent1A, agent1b (Maganjo)');
    console.log('  Username: agent2a, agent2b (Matugga)');
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
