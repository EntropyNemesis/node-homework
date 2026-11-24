const prisma = require("../db/prisma");

async function getUserAnalytics(req, res) {

    // Parse and validate user ID
    const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
            message: "The user ID passed is not valid.",
        });
    }    
    const user = await prisma.user.findUnique({
        where: {
            id: userId }, 
        select: { id: true }
    });

    if (!user) {
        return res.status(404).json({
            message: "No matching users were found.",
        });
    }

    // Uses groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
    by: ['isCompleted'],
    where: { userId },
    _count: {
        id: true
    }
    });

    // Includes recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
    where: { userId },
    select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
        select: { name: true }
        }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
    const weeklyProgress = await prisma.task.groupBy({
        by: ['createdAt'],
        where: {
            userId,
            createdAt: { gte: oneWeekAgo }
        },
        _count: { id: true }
    });

    res.status(200).json({
        taskStats,
        recentTasks,
        weeklyProgress
    });
    return;
}

module.exports = {getUserAnalytics};