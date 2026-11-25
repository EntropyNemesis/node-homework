const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

async function create(req, res) {
  //Validates the request body
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({message: error.message});

  const task = await prisma.task.create({
    data: { title: value.title, isCompleted: value.isCompleted, userId: global.user_id },
    select: { id: true, title: true, isCompleted: true, priority: true } // specify the column values to return
  });

  res.status(201).json(task);
};

//finds tasks owned by the logged-in user
async function index(req, res) {

  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause = { userId: global.user_id };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,        // Matches %find% pattern
      mode: 'insensitive'              // Case-insensitive search (ILIKE in PostgreSQL)
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: { 
      id: true, 
      title: true, 
      isCompleted: true, 
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });  

  // Get total count for pagination metadata
  const totalTasks = await prisma.task.count({
    where: whereClause
  });

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1
  };

  //returning 404 if that user has no tasks
  if (tasks.length === 0) return res.status(404).json({message: "No tasks were found for this user."});

  res.status(200).json({tasks, pagination});
};

async function show(req, res) {

/*  show should:
    Read req.params.id
    Find a task with that ID and the current user's email
    Return the task without userId
    Return 404 if no matching task exists   */

  //reads req.params.id
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  //Finds a task with that ID and the user's id
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      userId: global.user_id}, 
    select: { title: true, isCompleted: true, id: true }
  });

  if (!task) {
    return res.status(404).json({
      message: "No matching tasks were found.",
    });
  }

  res.status(200).json(task);

};

async function update(req, res, next) {
/*  update should:
    Validate the patch body
    Read req.params.id
    Find a task with that ID and the current user's email
    Merge the validated patch fields into the stored task
    Return the updated task without userId  */

  //Validates the patch body, aka the request body with patchTaskSchema
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({message: error.message});
  
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  let task = null;

  try {
    task = await prisma.task.update({
      data: value,
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true }
    });
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }

  res.status(200).json(task);
};

async function deleteTask(req, res, next) {
/*  deleteTask should:
    Read req.params.id
    Find the task index for the current user
    Remove that task from database rows
    Return the deleted task without userId  */
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  let task = null;

  try {
    task = await prisma.task.delete({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true }
    });
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }

  res.status(200).json(task);
};


async function bulkCreate(req, res, next) {
  const { tasks } = req.body;

  // Validates the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request data. Expected an array of tasks." 
    });
  }

  // Validates all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: global.user_id
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (err) {
    return next(err);
  }
};


module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
    bulkCreate
};