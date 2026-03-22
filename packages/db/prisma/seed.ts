import prisma from '../src/index.js';
import { subDays } from 'date-fns'; // Actually we might need date-fns in packages/db or we can use native Date.

async function main() {
  console.log('Seeding database...');
  // 1. Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'usr_test_123',
      name: 'Test Setup User',
      email: 'test@example.com',
      emailVerified: true,
    },
  });

  console.log(`Created user: ${user.email}`);

  // 2. Create 3 goals (Daily, Weekly, Monthly)
  const goal1 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Drink water',
      frequency: 'DAILY',
      targetCount: 8,
    }
  });

  const goal2 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Exercise',
      frequency: 'WEEKLY',
      targetCount: 5,
    }
  });

  const goal3 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Read a book',
      frequency: 'MONTHLY',
      targetCount: 2,
    }
  });

  console.log(`Created 3 goals for user.`);

  // 3. Create 10 HabitLogs across last 14 days for Goal 1
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i); // subtract i days
    
    await prisma.habitLog.create({
      data: {
        goalId: goal1.id,
        userId: user.id,
        completedAt: d,
        note: `Day ${i} log`
      }
    });
  }

  console.log(`Created 10 HabitLogs for goal: ${goal1.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });