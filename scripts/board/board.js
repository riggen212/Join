const dummyBoard = {
    toDo: {
        id: "todo-content",
        name: "To Do",
        tasks: {},
    },
    inProgress: {
        id: "progress-content",
        name: "In progress",
        tasks: {},
    },
    awaitFeedback: {
        id: "feedback-content",
        name: "Await feedback",
        tasks: {},
    },
    done: {
        id: "done-content",
        name: "Done",
        tasks: {},
    },
};


// const dummyBoard = {
    //     toDo: {
//         id: "todo-content",
//         name: "To Do",
//         tasks: [
//             {
//                 story: "User",
//                 title: "Test Headline",
//                 description: "Test Description",
//                 subtasksSummary: 4,
//                 subtasksDone: 2,
//                 subtasksProgress: (2 / 4) * 100,
//                 assignees: ["CL", "SS", "ND"],
//                 prio: "medium",
//             },
//             {
//                 story: "Technical",
//                 title: "Test Headline",
//                 description: "Test Description",
//                 subtasksSummary: 3,
//                 subtasksDone: 2,
//                 subtasksProgress: ((2 / 3) * 100).toFixed(2),
//                 assignees: ["CL", "SS", "ND"],
//                 prio: "high",
//             },
//         ],
//     },
//     inProgress: {
//         id: "progress-content",
//         name: "In progress",
//         tasks: [],
//     },
//     awaitFeedback: {
//         id: "feedback-content",
//         name: "Await feedback",
//         tasks: [],
//     },
//     done: {
//         id: "done-content",
//         name: "Done",
//         tasks: [],
//     },
// };

function initBoard() {
    const contacts = data.users[0].contacts;

    loadTasks();
    renderBoardColumns();
    
}

function loadTasks() {
    const tasks =  Object.entries(data.users[0].tasks);
    tasks.forEach((task) => {
        console.log(task[1]);
        dummyBoard[task[1].status].tasks[task[0]] = task[1];
    });
}

function renderBoardColumns() {
    const board = Object.entries(dummyBoard);

    board.forEach((column) => {
        const columnContent = document.getElementById(column[1].id);

        if (column[1].tasks.length === 0) {
            columnContent.innerHTML = getTaskCardEmptyBadge(column[1].name);
            return;
        } else {
            const columnContentHtml = getColumnContentHtml(column[1].tasks);
            columnContent.innerHTML = columnContentHtml;
        }
    });
}

function getColumnContentHtml(tasks) {
    const tasksArray = Object.entries(tasks);
    let columnContentHtml = "";

    tasksArray.forEach((task) => {
        // const subtasks = Object.keys(task[1].subtasks);
        // console.log(subtasks);
        // let assigneesHtml = getAssigneesHtml(task);
        let assigneesHtml = "";

        columnContentHtml += getTaskCardTemplate(task[1], assigneesHtml);
    });

    return columnContentHtml;
}

function getAssigneesHtml() {
    const assignees = Object.keys(task[1].assignedTo);
}
