const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

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

  // creates and store the task with an ID from the task counter, and with the current user's id in a userId field
  const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };

  //Pushes the task into global.tasks
  global.tasks.push(newTask);

  //uses destructuring to create sanitizedTask, a copy of newTask but excluding the userId
  const {userId, ...sanitizedTask} = newTask;

  res.status(201).json(sanitizedTask)
};

function index(req, res) {
  //finds tasks owned by the logged-in user
  const userTasks = global.tasks.filter((task) =>
    task.userId === global.user_id.email,
  );

  //returning 404 if that user has no tasks
  if (userTasks.length === 0) return res.status(404).json({message: "No tasks were found for this user."});
  
  //returning the relevant user's tasks after excluding the userId from each one in the array
  const sanitizedUserTasks = userTasks.map((task) => {
    const {userId, ...sanitizedTask} = task;
    return sanitizedTask;
  });

  //returns 200 code with the new array
  res.status(200).json(sanitizedUserTasks);
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

async function update(res, req) {
/*  update should:

    Validate the patch body
    Read req.params.id
    Find a task with that ID and the current user's email
    Merge the validated patch fields into the stored task, using Object.assign(task, value);
    Return the updated task without userId  */
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }
}

function deleteTask() {
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
}

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};