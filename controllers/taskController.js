const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

//taskCounter is temporary. when connecting to a real database later, it will create IDs for tasks.
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };  
})();


async function create(req, res) {
  //Validates the request body
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({message: error.message});

  const result = await pool.query(`INSERT INTO tasks (title, is_completed, user_id)
    VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id]);
  const task = result.rows[0];

  res.status(201).json(task);
};

//finds tasks owned by the logged-in user
async function index(req, res) {
  const result = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id]
  );
  const tasks = result.rows;   

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

  //Finds a task with that ID and the current user's email
  const shownTask = global.tasks.find((task) =>
    task.id === taskId &&
    task.userId === global.user_id.email,
  );


  if (!shownTask) {
    return res.status(404).json({
      message: "No matching tasks were found.",
    });
  }

  //uses destructuring to create sanitizedTask, a copy of shownTask but excluding the userId
  const {userId, ...sanitizedTask} = shownTask;

  res.status(200).json(sanitizedTask)

};

async function update(req, res) {
/*  update should:

    Validate the patch body
    Read req.params.id
    Find a task with that ID and the current user's email
    Merge the validated patch fields into the stored task, using Object.assign(task, value);
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

  const foundTask = global.tasks.find((task) =>
    task.id === taskId &&
    task.userId === global.user_id.email,
  );

  if (!foundTask) {
    return res.status(404).json({
      message: "No matching task was found.",
    });
  }

  Object.assign(foundTask, value);

  //removes the userId from a new copy (sanitizedTask) of the filtered tasks object (foundTask)
  const {userId, ...sanitizedTask} = foundTask;

  res.status(200).json(sanitizedTask)
};

async function deleteTask(req, res) {
/*  deleteTask should:

    Read req.params.id
    Find the task index for the current user
    Remove that task from global.tasks
    Return the deleted task without userId  */
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  const taskIndex = global.tasks.findIndex((task) =>
    task.id === taskId &&
    task.userId === global.user_id.email,
  );

  if (taskIndex === -1) {
    return res.status(404).json({
      message: "No matching task was found.",
    });
  }

  const task = global.tasks[taskIndex];
  const {userId, ...sanitizedTask} = task;

  global.tasks.splice(taskIndex, 1);

  res.status(200).json(sanitizedTask)
};

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};