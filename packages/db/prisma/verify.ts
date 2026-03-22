import prisma from '../src/index.js';

async function verify() {
  const goalCount = await prisma.goal.count();
  const habitLogCount = await prisma.habitLog.count();

  const d = new Date();
  d.setDate(d.getDate() - 7);

  const recentHabitLogs = await prisma.habitLog.count({
    where: {
      completedAt: {
        gte: d
      }
    }
  });

  console.log(`=== Verification Results ===`);
  console.log(`Count of Goals: ${goalCount} (Expected: 3)`);
  console.log(`Count of HabitLogs: ${habitLogCount} (Expected: 10)`);
  console.log(`HabitLogs in last 7 days: ${recentHabitLogs}`);
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });