const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

async function create(req, res) {
  //Validates the request body
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({message: error.message});

  const result = await pool.query(`INSERT INTO tasks (title, is_completed, user_id)
    VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed AS "isCompleted"`,
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

  //Finds a task with that ID and the user's id
  const result = await pool.query("SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [taskId, global.user_id]
  );
  const task = result.rows[0];


  if (!task) {
    return res.status(404).json({
      message: "No matching tasks were found.",
    });
  }

  res.status(200).json(task);

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
  const taskChange = value;

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  let keys = Object.keys(taskChange);
  keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const result = await pool.query(`UPDATE tasks SET ${setClauses}
    WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
    [...Object.values(taskChange), taskId, global.user_id]);
  const updatedTask = result.rows[0];

  if (!updatedTask) {
    return res.status(404).json({
      message: "No matching task was found.",
    });
  }

  res.status(200).json(updatedTask);
};

async function deleteTask(req, res) {
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

  const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
    [taskId, global.user_id]
  );
  const deletedTask = result.rows[0];

  if (!deletedTask) {
    return res.status(404).json({
      message: "No matching task was found.",
    });
  }

  res.status(200).json(deletedTask);
};

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};