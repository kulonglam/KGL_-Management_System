/**
 * Resets the database and inserts a clean demo baseline for local testing and demos.
 * File: backend/seedData.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import PriceSetting from './models/PriceSetting.js';
import Procurement from './models/Procurement.js';
import Sale from './models/Sale.js';
import CreditSale from './models/CreditSale.js';
import TrustedBuyer from './models/TrustedBuyer.js';
import StockNotification from './models/StockNotification.js';
import StockLock from './models/StockLock.js';
import { validatePasswordStrength } from './services/authService.js';

dotenv.config();

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Karibu@2026!';
const BRANCHES = ['Maganjo', 'Matugga'];
const PRODUCE_PRICES = {
  Beans: 35000,
  'Grain Maize': 28000,
  'Cow peas': 32000,
  'G-nuts': 55000,
  Soybeans: 40000
};

const USER_SEED = [
  { name: 'Mr Orban', username: 'orban', role: 'director', canViewCrossBranchTotals: true },
  { name: 'Manager Maganjo', username: 'managerA', role: 'manager', branch: 'Maganjo' },
  { name: 'Manager Matugga', username: 'managerB', role: 'manager', branch: 'Matugga' },
  { name: 'Agent One Maganjo', username: 'agent1A', role: 'sales_agent', branch: 'Maganjo' },
  { name: 'Agent Two Maganjo', username: 'agent2A', role: 'sales_agent', branch: 'Maganjo' },
  { name: 'Agent One Matugga', username: 'agent1B', role: 'sales_agent', branch: 'Matugga' },
  { name: 'Agent Two Matugga', username: 'agent2B', role: 'sales_agent', branch: 'Matugga' }
];

const TRUSTED_BUYER_SEED = [
  {
    name: 'Kulong Lam',
    nationalId: 'CM123456789012',
    location: 'Kampala Central',
    contact: '+256700567890',
    branch: 'Matugga',
    recordedByUsername: 'managerB'
  },
  {
    name: 'Mary Nyajime',
    nationalId: 'CF987654321098',
    location: 'Kawempe',
    contact: '+256700111222',
    branch: 'Maganjo',
    recordedByUsername: 'managerA'
  }
];

const PROCUREMENT_SEED = [
  {
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: '2026-02-10',
    timeReceived: '09:00',
    tonnageKg: 5000,
    costUgx: 15000000,
    dealerName: 'Maganjo Farm Cooperative',
    dealerContact: '+256700123456',
    branch: 'Maganjo',
    sellingPrice: 35000,
    recordedByUsername: 'managerA'
  },
  {
    produceName: 'Soy Beans',
    produceType: 'Soybeans',
    sourceType: 'kgl_farm',
    dateReceived: '2026-02-12',
    timeReceived: '10:30',
    tonnageKg: 3200,
    costUgx: 12800000,
    dealerName: 'Kgl Maganjo Farm',
    dealerContact: '+256700765432',
    branch: 'Maganjo',
    sellingPrice: 40000,
    recordedByUsername: 'managerA'
  },
  {
    produceName: 'Ground Nuts',
    produceType: 'G-nuts',
    sourceType: 'individual',
    dateReceived: '2026-02-14',
    timeReceived: '11:20',
    tonnageKg: 1800,
    costUgx: 8500000,
    dealerName: 'John Okello',
    dealerContact: '0700345678',
    branch: 'Maganjo',
    sellingPrice: 55000,
    recordedByUsername: 'managerA'
  },
  {
    produceName: 'White Maize',
    produceType: 'Grain Maize',
    sourceType: 'company',
    dateReceived: '2026-02-10',
    timeReceived: '08:45',
    tonnageKg: 8000,
    costUgx: 20000000,
    dealerName: 'Matugga Farm Supplies',
    dealerContact: '+256700234567',
    branch: 'Matugga',
    sellingPrice: 28000,
    recordedByUsername: 'managerB'
  },
  {
    produceName: 'Brown Cow Peas',
    produceType: 'Cow peas',
    sourceType: 'company',
    dateReceived: '2026-02-13',
    timeReceived: '12:10',
    tonnageKg: 2600,
    costUgx: 9100000,
    dealerName: 'Central Grain Traders',
    dealerContact: '+256700345678',
    branch: 'Matugga',
    sellingPrice: 32000,
    recordedByUsername: 'managerB'
  },
  {
    produceName: 'Yellow Soy Beans',
    produceType: 'Soybeans',
    sourceType: 'kgl_farm',
    dateReceived: '2026-02-15',
    timeReceived: '14:00',
    tonnageKg: 3000,
    costUgx: 10200000,
    dealerName: 'Kgl Matugga Farm',
    dealerContact: '+256700456789',
    branch: 'Matugga',
    sellingPrice: 40000,
    recordedByUsername: 'managerB'
  }
];

const SALES_SEED = [
  {
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 900,
    amountPaidUgx: 31500000,
    buyerName: 'Marys Restaurant',
    date: '2026-02-16',
    time: '10:00',
    branch: 'Maganjo',
    recordedByUsername: 'agent1A'
  },
  {
    produceName: 'Soy Beans',
    produceType: 'Soybeans',
    tonnageKg: 600,
    amountPaidUgx: 24000000,
    buyerName: 'Nakasero Market',
    date: '2026-02-17',
    time: '11:20',
    branch: 'Maganjo',
    recordedByUsername: 'agent2A'
  },
  {
    produceName: 'White Maize',
    produceType: 'Grain Maize',
    tonnageKg: 1500,
    amountPaidUgx: 42000000,
    buyerName: 'City Market',
    date: '2026-02-16',
    time: '11:30',
    branch: 'Matugga',
    recordedByUsername: 'agent1B'
  },
  {
    produceName: 'Brown Cow Peas',
    produceType: 'Cow peas',
    tonnageKg: 400,
    amountPaidUgx: 12800000,
    buyerName: 'Wandegeya Buyers',
    date: '2026-02-18',
    time: '13:10',
    branch: 'Matugga',
    recordedByUsername: 'agent2B'
  }
];

const CREDIT_SALE_SEED = [
  {
    trustedBuyerNationalId: 'CM123456789012',
    salesAgentUsername: 'agent2B',
    produceName: 'White Maize',
    produceType: 'Grain Maize',
    tonnageKg: 700,
    amountDueUgx: 19600000,
    amountPaidUgx: 5000000,
    balanceUgx: 14600000,
    dueDate: '2026-03-20',
    dateOfDispatch: '2026-02-18',
    branch: 'Matugga',
    paymentReceivedByUsername: 'managerB',
    isPaid: false
  },
  {
    trustedBuyerNationalId: 'CF987654321098',
    salesAgentUsername: 'agent1A',
    produceName: 'Ground Nuts',
    produceType: 'G-nuts',
    tonnageKg: 200,
    amountDueUgx: 11000000,
    amountPaidUgx: 11000000,
    balanceUgx: 0,
    dueDate: '2026-03-10',
    dateOfDispatch: '2026-02-19',
    branch: 'Maganjo',
    paymentReceivedByUsername: 'managerA',
    isPaid: true
  }
];

const ensureRequiredEnv = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run seedData.js');
  }

  const passwordError = validatePasswordStrength(DEFAULT_PASSWORD);
  if (passwordError) {
    throw new Error(`SEED_DEFAULT_PASSWORD is invalid: ${passwordError}`);
  }
};

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};

const clearCollections = async () => {
  await Promise.all([
    StockLock.deleteMany({}),
    StockNotification.deleteMany({}),
    CreditSale.deleteMany({}),
    Sale.deleteMany({}),
    Procurement.deleteMany({}),
    TrustedBuyer.deleteMany({}),
    PriceSetting.deleteMany({}),
    User.deleteMany({})
  ]);
  console.log('Existing data cleared');
};

const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const records = USER_SEED.map((user) => ({
    ...user,
    password: hashedPassword
  }));
  const users = await User.insertMany(records);
  console.log(`Users seeded: ${users.length}`);
  return new Map(users.map((user) => [user.username, user]));
};

const seedPriceSettings = async () => {
  const records = [];
  BRANCHES.forEach((branch) => {
    Object.entries(PRODUCE_PRICES).forEach(([produceType, priceUgx]) => {
      records.push({ branch, produceType, priceUgx });
    });
  });

  const prices = await PriceSetting.insertMany(records);
  console.log(`Price settings seeded: ${prices.length}`);
};

const getUserOrThrow = (userByUsername, username) => {
  const user = userByUsername.get(username);
  if (!user) {
    throw new Error(`Seed configuration error: missing user "${username}"`);
  }
  return user;
};

const seedTrustedBuyers = async (userByUsername) => {
  const records = TRUSTED_BUYER_SEED.map((buyer) => ({
    name: buyer.name,
    nationalId: buyer.nationalId,
    location: buyer.location,
    contact: buyer.contact,
    branch: buyer.branch,
    recordedBy: getUserOrThrow(userByUsername, buyer.recordedByUsername)._id
  }));

  const buyers = await TrustedBuyer.insertMany(records);
  console.log(`Trusted buyers seeded: ${buyers.length}`);
  return new Map(buyers.map((buyer) => [buyer.nationalId, buyer]));
};

const seedProcurements = async (userByUsername) => {
  const records = PROCUREMENT_SEED.map((item) => ({
    produceName: item.produceName,
    produceType: item.produceType,
    sourceType: item.sourceType,
    dateReceived: new Date(item.dateReceived),
    timeReceived: item.timeReceived,
    tonnageKg: item.tonnageKg,
    costUgx: item.costUgx,
    dealerName: item.dealerName,
    dealerContact: item.dealerContact,
    branch: item.branch,
    sellingPrice: item.sellingPrice,
    recordedBy: getUserOrThrow(userByUsername, item.recordedByUsername)._id
  }));

  const procurements = await Procurement.insertMany(records);
  console.log(`Procurements seeded: ${procurements.length}`);
};

const seedSales = async (userByUsername) => {
  const records = SALES_SEED.map((item) => {
    const recordedBy = getUserOrThrow(userByUsername, item.recordedByUsername);
    return {
      produceName: item.produceName,
      produceType: item.produceType,
      tonnageKg: item.tonnageKg,
      amountPaidUgx: item.amountPaidUgx,
      buyerName: item.buyerName,
      salesAgentName: recordedBy.name,
      date: new Date(item.date),
      time: item.time,
      branch: item.branch,
      recordedBy: recordedBy._id
    };
  });

  const sales = await Sale.insertMany(records);
  console.log(`Sales seeded: ${sales.length}`);
};

const seedCreditSales = async (userByUsername, buyerByNin) => {
  const records = CREDIT_SALE_SEED.map((item) => {
    const trustedBuyer = buyerByNin.get(item.trustedBuyerNationalId);
    if (!trustedBuyer) {
      throw new Error(
        `Seed configuration error: missing trusted buyer "${item.trustedBuyerNationalId}"`
      );
    }

    const salesAgent = getUserOrThrow(userByUsername, item.salesAgentUsername);
    const paymentReceivedBy = getUserOrThrow(userByUsername, item.paymentReceivedByUsername);

    return {
      buyerName: trustedBuyer.name,
      nationalId: trustedBuyer.nationalId,
      location: trustedBuyer.location,
      contact: trustedBuyer.contact,
      amountDueUgx: item.amountDueUgx,
      amountPaidUgx: item.amountPaidUgx,
      balanceUgx: item.balanceUgx,
      salesAgentName: salesAgent.name,
      dueDate: new Date(item.dueDate),
      produceName: item.produceName,
      produceType: item.produceType,
      tonnageKg: item.tonnageKg,
      dateOfDispatch: new Date(item.dateOfDispatch),
      branch: item.branch,
      recordedBy: salesAgent._id,
      trustedBuyer: trustedBuyer._id,
      isPaid: item.isPaid,
      payments: item.amountPaidUgx
        ? [
            {
              amountUgx: item.amountPaidUgx,
              paidAt: new Date(item.dateOfDispatch),
              receivedBy: paymentReceivedBy._id
            }
          ]
        : []
    };
  });

  const creditSales = await CreditSale.insertMany(records);
  console.log(`Credit sales seeded: ${creditSales.length}`);
};

const printLoginSummary = () => {
  console.log('\n=== Seed Login Credentials ===');
  console.log(`Password for all users: ${DEFAULT_PASSWORD}`);
  console.log('Director: orban');
  console.log('Managers: managerA (Maganjo), managerB (Matugga)');
  console.log('Sales Agents: agent1A, agent2A, agent1B, agent2B');
  console.log('==============================\n');
};

const main = async () => {
  ensureRequiredEnv();
  await connectDatabase();

  await clearCollections();
  const userByUsername = await seedUsers();
  await seedPriceSettings();
  const buyerByNin = await seedTrustedBuyers(userByUsername);
  await seedProcurements(userByUsername);
  await seedSales(userByUsername);
  await seedCreditSales(userByUsername, buyerByNin);

  printLoginSummary();
  console.log('Database seed completed successfully.');
};

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  });





