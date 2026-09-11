const data = {
    users: {
        "0": {
            profile: {
                name: "Guest",
                type: "guest"
            },

            contacts: {
                contact1: {
                    name: "Anton Mayer",
                    email: "anton@gmail.com",
                    phone: "+49 1111 111 11 1",
                    initials: "AM",
                    colorClass: "badge-user-orange"
                },

                contact2: {
                    name: "Anja Schulz",
                    email: "anja@gmx.com",
                    phone: "+49 2222 222 22 2",
                    initials: "AS",
                    colorClass: "badge-user-purple"
                },

                contact3: {
                    name: "Benedikt Ziegler",
                    email: "benediktz@gmail.com",
                    phone: "+49 3333 333 33 3",
                    initials: "BZ",
                    colorClass: "badge-user-pink"
                },

                contact4: {
                    name: "David Eisenberg",
                    email: "davide@hotmail.com",
                    phone: "+49 4444 444 44 4",
                    initials: "DE",
                    colorClass: "badge-user-blue-medium"
                },

                contact5: {
                    name: "Eva Fischer",
                    email: "eva@gmail.com",
                    phone: "+49 5555 555 55 5",
                    initials: "EF",
                    colorClass: "badge-user-yellow"
                },

                contact6: {
                    name: "Emmanuel Mauer",
                    email: "emmanuel@gmail.com",
                    phone: "+49 6666 666 66 6",
                    initials: "EM",
                    colorClass: "badge-user-mint"
                },

                contact7: {
                    name: "Max Mustermann",
                    email: "max@mustermann.de",
                    phone: "+49 7777 777 77 7",
                    initials: "MM",
                    colorClass: "badge-user-blue-light"
                }
            },

            tasks: {
                task1: {
                    title: "Prepare presentation",
                    description: "Create the project presentation.",
                    dueDate: "2026-09-30",
                    priority: "medium",
                    category: "User Story",
                    status: "toDo",

                    assignedTo: {
                        contact1: true,
                        contact2: true
                    },

                    subtasks: {
                        subtask1: {
                            title: "Create slides",
                            completed: false
                        }
                    }
                },

                task2: {
                    title: "Update contact list",
                    description: "Check and update all contact information.",
                    dueDate: "2026-10-05",
                    priority: "low",
                    category: "Technical Task",
                    status: "inProgress",

                    assignedTo: {
                        contact3: true
                    },

                    subtasks: {
                        subtask1: {
                            title: "Check email addresses",
                            completed: true
                        },
                        subtask2: {
                            title: "Check phone numbers",
                            completed: false
                        }
                    }
                },

                task3: {
                    title: "Design mobile view",
                    description: "Adjust the mobile layout to the Figma design.",
                    dueDate: "2026-10-10",
                    priority: "high",
                    category: "User Story",
                    status: "awaitFeedback",

                    assignedTo: {
                        contact4: true,
                        contact5: true
                    }
                },

                task4: {
                    title: "Test application",
                    description: "Test all pages and functions.",
                    dueDate: "2026-10-15",
                    priority: "medium",
                    category: "Technical Task",
                    status: "toDo",

                    assignedTo: {
                        contact6: true
                    },

                    subtasks: {
                        subtask1: {
                            title: "Test desktop view",
                            completed: false
                        },
                        subtask2: {
                            title: "Test mobile view",
                            completed: false
                        }
                    }
                },

                task5: {
                    title: "Finish documentation",
                    description: "Complete the project documentation.",
                    dueDate: "2026-10-20",
                    priority: "low",
                    category: "Technical Task",
                    status: "done",

                    assignedTo: {
                        contact7: true
                    }
                }
            }
        },

        FIREBASE_UID_USER_1: {
            profile: {
                name: "Max Mustermann",
                email: "max@mustermann.de",
                initials: "MM",
                colorClass: "badge-user-blue-light",
                type: "user"
            }
        },

        FIREBASE_UID_USER_2: {
            profile: {
                name: "Erika Musterfrau",
                email: "erika@musterfrau.de",
                initials: "EM",
                colorClass: "badge-user-mint",
                type: "user"
            }
        },

        FIREBASE_UID_USER_3: {
            profile: {
                name: "John Doe",
                email: "john@doe.com",
                initials: "JD",
                colorClass: "badge-user-purple",
                type: "user"
            }
        }
    },

    templates: {
        newUser: {
            profile: {
                type: "user",
                colorClass: "badge-user-blue-light"
            }
        }
    }
};