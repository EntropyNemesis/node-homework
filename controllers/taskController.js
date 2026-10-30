
//taskCounter is temporary. when connecting to a real database later, it will create IDs for tasks.
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const taskId = parseInt(req.params?.id);

if (!taskId) {
  return res.status(400).json({
    message: "The task ID passed is not valid.",
  });
}

function create() {
/*create should:

    Validate the request body
    Create a task with an ID
    Store the current user's email in userId
    Push the task into global.tasks
    Return status 201
    Return the task without userId  */

}

function index() {
 /*index should:

    Find tasks owned by the logged-in user
    Return those tasks without userId
    Return 404 if this user has no tasks    */
}

function show() {
/*  show should:

    Read req.params.id
    Find a task with that ID and the current user's email
    Return the task without userId
    Return 404 if no matching task exists   */
}

function update() {
/*  update should:

    Validate the patch body
    Read req.params.id
    Find a task with that ID and the current user's email
    Merge the validated patch fields into the stored task, using Object.assign(task, value);
    Return the updated task without userId  */

}

function deleteTask() {
/*  deleteTask should:

    Read req.params.id
    Find the task index for the current user
    Remove that task from global.tasks
    Return the deleted task without userId  */
}

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask
};