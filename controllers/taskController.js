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

  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id, // only the tasks for this user!
    },
    select: { 
      id: true, 
      title: true, 
      isCompleted: true, 
      priority: true
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });  

  //returning 404 if that user has no tasks
  if (tasks.length === 0) return res.status(404).json({message: "No tasks were found for this user."});

  res.status(200).json(tasks);
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

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};